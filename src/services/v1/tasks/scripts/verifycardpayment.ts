import Accounts from "../../../../models/accounts.model";
import CryptoListingPurchase from "../../../../models/listingPurchase.model";
import VerifiedTransactions from "../../../../models/verifiedtransactions.model";
import VerifiedTransactionsNoAuth from "../../../../models/verifiedtransactionsNoAccount.model";
import { updatePaymentConfirmation } from "../../listingsServices/cryptolisting.service";
import { PeriodicTaskScheduler } from "../../minitaskscheduler";
import {
  FailedVerificationQueue,
  flutterwaveKeys,
} from "../../payments/flutterwave.service";
const Flutterwave = require("flutterwave-node-v3");

const flw = new Flutterwave(flutterwaveKeys.PUBLIC, flutterwaveKeys.SECRET);
const failedVerificationQueue = new FailedVerificationQueue<IverificationData>();

interface IverificationData {
  paymentReference: number;
  expectedAmount: number;
  expectedCurrency: string;
  toRefund?: number;
  retries?: number;
}

// Function to sleep for a specified time (in milliseconds)
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to verify a single payment
async function verifyCardPayment(data: IverificationData) {
  const { paymentReference, expectedAmount, expectedCurrency } = data;
  
  try {
    // Verify the payment with Flutterwave
    const response = await flw.Transaction.verify({ id: paymentReference });

    if (
      response.status === "success" &&
      response.data.status === "successful" &&
      response.data.amount >= expectedAmount &&
      response.data.currency === expectedCurrency
    ) {
      data.toRefund = response.data.amount - expectedAmount;
      
      // Remove from queue after successful verification
      await failedVerificationQueue.removeFirst();

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
    return { status: false, message: "Error verifying payment", error };
  }
}

// Function to loop through the queue and process each verification with a delay
async function processQueue() {
  try {
    let queueSize = await failedVerificationQueue.size();
    console.log(`Queue size: ${queueSize}`);

    if (queueSize === 0) {
      console.log("Queue is empty. Checking for unconfirmed payments...");

      const unconfirmedPayments = await CryptoListingPurchase.find({
        paymentConfirmed: false,
      });

      for (let unconfirmedPayment of unconfirmedPayments) {
        if (unconfirmedPayment?.verificationData) {
          const verificationData: IverificationData = JSON.parse(
            unconfirmedPayment.verificationData
          );
          const verificationResponse = await verifyCardPayment(verificationData);
          await processListingPayment(verificationData, verificationResponse);
        }
      }
      return;
    }

    while (queueSize > 0) {
      const item = await failedVerificationQueue.dequeue();
      if (item) {
        const verificationData: IverificationData = JSON.parse(item);
        console.log(`Verifying payment for reference: ${verificationData.paymentReference}`);

        const verificationResponse = await verifyCardPayment(verificationData);
        await processListingPayment(verificationData, verificationResponse);
      }

      // Update the queue size after each operation
      queueSize = await failedVerificationQueue.size();
    }

    console.log("Finished processing the queue.");
  } catch (error) {
    console.error("Error processing queue:", error);
  }
}

// Function to process payments based on verification result
async function processListingPayment(
  verificationData: IverificationData,
  verificationResponse: any
) {
  if (verificationResponse) {

    if (verificationResponse.status === true) {
      console.log(
        `Payment verified successfully for reference: ${verificationData.paymentReference}`
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
      console.log(
        `Payment verification failed for reference: ${verificationData.paymentReference}`
      );

      // Implement retry logic before re-enqueuing
      if (!verificationData.retries) {
        verificationData.retries = 1;
      } else {
        verificationData.retries += 1;
      }

      if (verificationData.retries <= 3) {
        console.log(
          `Retrying verification for reference: ${verificationData.paymentReference} (Attempt ${verificationData.retries}/3)`
        );
        await sleep(5000); // Add a delay before retrying
        await failedVerificationQueue.enqueue(verificationData);
      } else {
        console.log(
          `Payment verification failed permanently for reference: ${verificationData.paymentReference}. Max retries reached.`
        );
      }
    }
  }
}

export const startFlutterwavePaymentsVerification = ()=>{
  // Schedule the periodic task
  const periodicScheduler = new PeriodicTaskScheduler();
  periodicScheduler.addTask("card-payment-verification", processQueue, 30000);
}
