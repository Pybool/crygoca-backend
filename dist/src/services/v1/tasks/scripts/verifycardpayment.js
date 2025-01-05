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
const accounts_model_1 = __importDefault(require("../../../../models/accounts.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../../models/verifiedtransactions.model"));
const verifiedtransactionsNoAccount_model_1 = __importDefault(require("../../../../models/verifiedtransactionsNoAccount.model"));
const cryptolisting_service_1 = require("../../listingsServices/cryptolisting.service");
const flutterwave_service_1 = require("../../payments/flutterwave.service");
const Flutterwave = require("flutterwave-node-v3");
const flw = new Flutterwave(flutterwave_service_1.flutterwaveKeys.PUBLIC, flutterwave_service_1.flutterwaveKeys.SECRET);
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
                if (response.data.amount >= expectedAmount) {
                    data.toRefund = response.data.amount - expectedAmount;
                }
                const failedVerificationQueue = new flutterwave_service_1.FailedVerificationQueue();
                yield failedVerificationQueue.removeFirst(); // Remove the first item from the queue after successful verification
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
            throw error;
        }
    });
}
// Function to loop through the queue and process each verification with a delay
function processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        const failedVerificationQueue = new flutterwave_service_1.FailedVerificationQueue();
        // Get the size of the queue
        let queueSize = yield failedVerificationQueue.size();
        console.log(`Queue size: ${queueSize}`);
        while (queueSize > 0) {
            const item = yield failedVerificationQueue.dequeue();
            if (item) {
                console.log(`Verifying payment for reference: ${JSON.parse(item).paymentReference}`);
                // Verify the payment and wait for the result
                const verificationResponse = yield verifyCardPayment(JSON.parse(item));
                console.log("verificationResponse ", verificationResponse);
                // Only dequeue if verification is successful
                if (verificationResponse.status === true) {
                    console.log(`Payment verified successfully for reference: ${JSON.parse(item).paymentReference}`);
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
                    // If verification fails, put the item back to the queue to retry later or handle the failure
                    console.log(`Payment verification failed for reference: ${JSON.parse(item).paymentReference}`);
                    yield failedVerificationQueue.enqueue(JSON.parse(item)); // Optionally re-enqueue the failed item
                }
                // Wait for 3 seconds before processing the next item
                yield sleep(3000);
            }
            // Update the queue size after each operation
            queueSize = yield failedVerificationQueue.size();
            if (queueSize === 0) {
                break; // Exit the loop if no more items are left in the queue
            }
        }
        console.log("Finished processing the queue.");
    });
}
// Entry point for the script
if (require.main === module) {
    // Start processing the queue
    processQueue().catch((err) => console.error("Error in processing queue:", err));
}
