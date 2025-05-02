"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function verifyCardPayment(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { paymentReference, expectedAmount, expectedCurrency } = data;
        console.log("Verification data ", data);
        try {
            // Verify the payment with Flutterwave
            const response = yield flw.Transaction.verify({ id: paymentReference });
            if (response.status === "success" &&
                response.data.status === "successful" &&
                response.data.amount >= expectedAmount &&
                response.data.currency === expectedCurrency) {
                data.toRefund = response.data.amount - expectedAmount;
                // Remove from queue after successful verification
                yield failedVerificationQueue.removeFirst();
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
    });
}
// Function to loop through the queue and process each verification with a delay
function processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let queueSize = yield failedVerificationQueue.size();
            console.log(`Queue size: ${queueSize}`);
            if (queueSize === 0) {
                console.log("Queue is empty. Checking for unconfirmed payments...");
                const unconfirmedPayments = yield listingPurchase_model_1.default.find({
                    paymentConfirmed: false,
                });
                for (let unconfirmedPayment of unconfirmedPayments) {
                    if (unconfirmedPayment === null || unconfirmedPayment === void 0 ? void 0 : unconfirmedPayment.verificationData) {
                        const verificationData = JSON.parse(unconfirmedPayment.verificationData);
                        const verificationResponse = yield verifyCardPayment(verificationData);
                        yield processListingPayment(verificationData, verificationResponse);
                    }
                }
                return;
            }
            while (queueSize > 0) {
                const item = yield failedVerificationQueue.dequeue();
                if (item) {
                    const verificationData = JSON.parse(item);
                    console.log(`Verifying payment for reference: ${verificationData.paymentReference}`);
                    const verificationResponse = yield verifyCardPayment(verificationData);
                    yield processListingPayment(verificationData, verificationResponse);
                }
                // Update the queue size after each operation
                queueSize = yield failedVerificationQueue.size();
            }
            console.log("Finished processing the queue.");
        }
        catch (error) {
            console.error("Error processing queue:", error);
        }
    });
}
// Function to process payments based on verification result
function processListingPayment(verificationData, verificationResponse) {
    return __awaiter(this, void 0, void 0, function* () {
        if (verificationResponse) {
            console.log("verificationResponse ", verificationResponse);
            if (verificationResponse.status === true) {
                console.log(`Payment verified successfully for reference: ${verificationData.paymentReference}`);
                const account = yield accounts_model_1.default.findOne({
                    $or: [
                        { email: verificationResponse.data.customer.email },
                        { phone: verificationResponse.data.customer.phone_number },
                    ],
                });
                if (account) {
                    yield verifiedtransactions_model_1.default.create({
                        tx_ref: verificationResponse.data.tx_ref,
                        data: verificationResponse.data,
                        account: account._id,
                    });
                    yield (0, cryptolisting_service_1.updatePaymentConfirmation)(verificationResponse.data.tx_ref);
                }
                else {
                    yield verifiedtransactionsNoAccount_model_1.default.create({
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
                    yield sleep(5000); // Add a delay before retrying
                    yield failedVerificationQueue.enqueue(verificationData);
                }
                else {
                    console.log(`Payment verification failed permanently for reference: ${verificationData.paymentReference}. Max retries reached.`);
                }
            }
        }
    });
}
const startFlutterwavePaymentsVerification = () => {
    // Schedule the periodic task
    const periodicScheduler = new minitaskscheduler_1.PeriodicTaskScheduler();
    periodicScheduler.addTask("card-payment-verification", processQueue, 30000);
};
exports.startFlutterwavePaymentsVerification = startFlutterwavePaymentsVerification;
