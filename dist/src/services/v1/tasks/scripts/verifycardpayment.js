"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFlutterwavePaymentsVerification = void 0;
const accounts_model_1 = __importDefault(require("../../../../models/accounts.model"));
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../../models/verifiedtransactions.model"));
const verifiedtransactionsNoAccount_model_1 = __importDefault(require("../../../../models/verifiedtransactionsNoAccount.model"));
const cryptolisting_service_1 = require("../../listingsServices/cryptolisting.service");
const minitaskscheduler_1 = require("../../minitaskscheduler");
const flutterwave_service_1 = require("../../payments/flutterwave.service");
const Flutterwave = require("flutterwave-node-v3");
const flw = new Flutterwave(flutterwave_service_1.flutterwaveKeys.PUBLIC, flutterwave_service_1.flutterwaveKeys.SECRET);
const failedVerificationQueue = new flutterwave_service_1.FailedVerificationQueue();
// Function to sleep for a specified time (in milliseconds)
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Function to verify a single payment
async function verifyCardPayment(data) {
    const { paymentReference, expectedAmount, expectedCurrency } = data;
    try {
        // Verify the payment with Flutterwave
        const response = await flw.Transaction.verify({ id: paymentReference });
        if (response.status === "success" &&
            response.data.status === "successful" &&
            response.data.amount >= expectedAmount &&
            response.data.currency === expectedCurrency) {
            data.toRefund = response.data.amount - expectedAmount;
            // Remove from queue after successful verification
            await failedVerificationQueue.removeFirst();
            return {
                status: true,
                message: "Payment verified successfully",
                data: response.data,
            };
        }
        else {
            console.log("Payment verification failed", response.message);
            return {
                status: false,
                message: "Payment verification failed",
                error: response.message,
            };
        }
    }
    catch (error) {
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
            const unconfirmedPayments = await listingPurchase_model_1.default.find({
                paymentConfirmed: false,
            });
            for (let unconfirmedPayment of unconfirmedPayments) {
                if (unconfirmedPayment?.verificationData) {
                    const verificationData = JSON.parse(unconfirmedPayment.verificationData);
                    const verificationResponse = await verifyCardPayment(verificationData);
                    await processListingPayment(verificationData, verificationResponse);
                }
            }
            return;
        }
        while (queueSize > 0) {
            const item = await failedVerificationQueue.dequeue();
            if (item) {
                const verificationData = JSON.parse(item);
                console.log(`Verifying payment for reference: ${verificationData.paymentReference}`);
                const verificationResponse = await verifyCardPayment(verificationData);
                await processListingPayment(verificationData, verificationResponse);
            }
            // Update the queue size after each operation
            queueSize = await failedVerificationQueue.size();
        }
        console.log("Finished processing the queue.");
    }
    catch (error) {
        console.error("Error processing queue:", error);
    }
}
// Function to process payments based on verification result
async function processListingPayment(verificationData, verificationResponse) {
    if (verificationResponse) {
        if (verificationResponse.status === true) {
            console.log(`Payment verified successfully for reference: ${verificationData.paymentReference}`);
            const account = await accounts_model_1.default.findOne({
                $or: [
                    { email: verificationResponse.data.customer.email },
                    { phone: verificationResponse.data.customer.phone_number },
                ],
            });
            if (account) {
                await verifiedtransactions_model_1.default.create({
                    tx_ref: verificationResponse.data.tx_ref,
                    data: verificationResponse.data,
                    account: account._id,
                });
                await (0, cryptolisting_service_1.updatePaymentConfirmation)(verificationResponse.data.tx_ref);
            }
            else {
                await verifiedtransactionsNoAccount_model_1.default.create({
                    tx_ref: verificationResponse.data.tx_ref,
                    data: verificationResponse.data,
                });
            }
        }
        else {
            console.log(`Payment verification failed for reference: ${verificationData.paymentReference}`);
            // Implement retry logic before re-enqueuing
            if (!verificationData.retries) {
                verificationData.retries = 1;
            }
            else {
                verificationData.retries += 1;
            }
            if (verificationData.retries <= 3) {
                console.log(`Retrying verification for reference: ${verificationData.paymentReference} (Attempt ${verificationData.retries}/3)`);
                await sleep(5000); // Add a delay before retrying
                await failedVerificationQueue.enqueue(verificationData);
            }
            else {
                console.log(`Payment verification failed permanently for reference: ${verificationData.paymentReference}. Max retries reached.`);
            }
        }
    }
}
const startFlutterwavePaymentsVerification = () => {
    // Schedule the periodic task
    const periodicScheduler = new minitaskscheduler_1.PeriodicTaskScheduler();
    periodicScheduler.addTask("card-payment-verification", processQueue, 30000);
};
exports.startFlutterwavePaymentsVerification = startFlutterwavePaymentsVerification;
