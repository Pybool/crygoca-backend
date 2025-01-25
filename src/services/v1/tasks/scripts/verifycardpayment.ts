import Accounts from "../../../../models/accounts.model";
import VerifiedTransactions from "../../../../models/verifiedtransactions.model";
import VerifiedTransactionsNoAuth from "../../../../models/verifiedtransactionsNoAccount.model";
import { updatePaymentConfirmation } from "../../listingsServices/cryptolisting.service";
import {
  FailedVerificationQueue,
  flutterwaveKeys,
} from "../../payments/flutterwave.service";
const Flutterwave = require("flutterwave-node-v3");

const flw = new Flutterwave(flutterwaveKeys.PUBLIC, flutterwaveKeys.SECRET);

interface IverificationData {
  paymentReference: number;
  expectedAmount: number;
  expectedCurrency: string;
  toRefund?: number;
}

// Function to sleep for a specified time (in milliseconds)
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to verify a single payment
async function verifyCardPayment(data: IverificationData) {
  const { paymentReference, expectedAmount, expectedCurrency } = data;
  console.log("Verification data ", data);
  try {
    // Verify the payment with Flutterwave
    const response = await flw.Transaction.verify({ id: paymentReference });

    if (
      response.status === "success" &&
      response.data.status === "successful" &&
      response.data.amount >= expectedAmount &&
      response.data.currency === expectedCurrency
    ) {
      if (response.data.amount >= expectedAmount) {
        data!.toRefund = response.data.amount - expectedAmount;
      }
      const failedVerificationQueue =
        new FailedVerificationQueue<IverificationData>();
      await failedVerificationQueue.removeFirst(); // Remove the first item from the queue after successful verification

      return {
        status: true,
        message: "Payment verified successfully",
        data: response.data,
      };
    } else {
      console.log("Payment verification failed", response.message);
      return {
        status: false,
        message: "Payment verification failed",
        error: response.message,
      };
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    throw error;
  }
}

// Function to loop through the queue and process each verification with a delay
async function processQueue() {
  const failedVerificationQueue = new FailedVerificationQueue<IverificationData>();

  // Get the size of the queue
  let queueSize = await failedVerificationQueue.size();
  console.log(`Queue size: ${queueSize}`);

  while (queueSize > 0) {
    const item = await failedVerificationQueue.dequeue();

    if (item) {
      console.log(
        `Verifying payment for reference: ${JSON.parse(item).paymentReference}`
      );

      // Verify the payment and wait for the result
      const verificationResponse = await verifyCardPayment(JSON.parse(item));
      console.log("verificationResponse ", verificationResponse);
      // Only dequeue if verification is successful
      if (verificationResponse.status === true) {
        console.log(
          `Payment verified successfully for reference: ${
            JSON.parse(item).paymentReference
          }`
        );
        const account = await Accounts.findOne({
          $or: [
            { email: verificationResponse.data.customer.email },
            { phone: verificationResponse.data.customer.phone_number },
          ],
        });
        if (account) {
          await VerifiedTransactions.create({
            tx_ref: verificationResponse.data.tx_ref,
            data: verificationResponse.data,
            account: account._id,
          });
          await updatePaymentConfirmation(verificationResponse.data.tx_ref);
        } else {
          await VerifiedTransactionsNoAuth.create({
            tx_ref: verificationResponse.data.tx_ref,
            data: verificationResponse.data,
          });
        }
      } else {
        // If verification fails, put the item back to the queue to retry later or handle the failure
        console.log(
          `Payment verification failed for reference: ${
            JSON.parse(item).paymentReference
          }`
        );
        await failedVerificationQueue.enqueue(JSON.parse(item)); // Optionally re-enqueue the failed item
      }

      // Wait for 3 seconds before processing the next item
      await sleep(3000);
    }

    // Update the queue size after each operation
    queueSize = await failedVerificationQueue.size();
    if (queueSize === 0) {
      break; // Exit the loop if no more items are left in the queue
    }
  }

  console.log("Finished processing the queue.");
}

// Entry point for the script
if (require.main === module) {
  // Start processing the queue
  processQueue().catch((err) =>
    console.error("Error in processing queue:", err)
  );
}
