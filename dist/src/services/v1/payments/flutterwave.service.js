"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailedVerificationQueue = exports.FlutterWaveService = exports.flutterwaveKeys = void 0;
const Flutterwave = require("flutterwave-node-v3");
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const verifiedtransactionsNoAccount_model_1 = __importDefault(require("../../../models/verifiedtransactionsNoAccount.model"));
const cryptolisting_service_1 = require("../listingsServices/cryptolisting.service");
const init_redis_1 = require("../../../redis/init.redis");
const mock_service_1 = require("./mock.service");
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
exports.flutterwaveKeys = {
    PUBLIC: process.env.FLW_PUBLIC_KEY,
    SECRET: process.env.FLW_SECRET_KEY,
    ENC_KEY: process.env.FLW_ENCRYPTION_KEY,
};
const flw = new Flutterwave(exports.flutterwaveKeys.PUBLIC, exports.flutterwaveKeys.SECRET);
class FlutterWaveService {
    static async initiateCardPayment(req) {
        const { ref, amount, email, phone, currency = "NGN", redirect_url, } = req.body;
        // Prepare payment data
        const paymentData = {
            tx_ref: ref, //`txn_${new Date().getTime()}`, // Unique transaction reference
            amount,
            currency,
            email,
            phone_number: phone,
            redirect_url,
            enckey: exports.flutterwaveKeys.ENC_KEY,
        };
        try {
            // Call Flutterwave API to initiate payment
            const response = await flw.Charge.card(paymentData);
            if (response.status === "success") {
                return {
                    status: true,
                    message: "Payment initiation successful",
                    data: response.data,
                };
            }
            else {
                return {
                    status: false,
                    message: "Payment initiation failed",
                    error: response.message,
                };
            }
        }
        catch (error) {
            console.error("Error initiating payment:", error);
            throw error;
        }
    }
    static async devGooglepayVerificationResponse(data) {
        const googlePayVerificationResponse = mock_service_1.mockGooglePayVerificationResponse;
        googlePayVerificationResponse.data.tx_ref = data.tx_ref;
        googlePayVerificationResponse.data.amount = data.amount;
        googlePayVerificationResponse.data.charged_amount = data.amount;
        googlePayVerificationResponse.data.currency = data.currency;
        googlePayVerificationResponse.data.customer.email = data.customer.email;
        googlePayVerificationResponse.data.customer.name = data.customer.name;
        googlePayVerificationResponse.data.created_at = new Date();
        return googlePayVerificationResponse;
    }
    static async verifyCardPayment(data = null, fullResponse = null) {
        const { paymentReference, expectedAmount, expectedCurrency, payment_type } = data; // The transaction reference from Flutterwave
        try {
            // Verify the payment with Flutterwave
            let response = null;
            if (payment_type === "googlepay" &&
                process.env.MOCK_VERIFICATION_RESPONSE === "true") {
                response = await FlutterWaveService.devGooglepayVerificationResponse(fullResponse);
            }
            else {
                response = await flw.Transaction.verify({ id: paymentReference });
            }
            console.log("Verification response ", response);
            if (response.status !== "success") {
                const failedVerificationQueue = new FailedVerificationQueue();
                await failedVerificationQueue.enqueue(data);
                const cryptoPurchase = await listingPurchase_model_1.default.findOne({
                    checkOutId: paymentReference,
                });
                if (cryptoPurchase) {
                    cryptoPurchase.verificationData = data;
                    await cryptoPurchase.save();
                }
            }
            if (response.status === "success" &&
                response.data.status === "successful" &&
                response.data.amount >= expectedAmount &&
                response.data.currency === expectedCurrency) {
                if (response.data.amount >= expectedAmount) {
                    data.toRefund = response.data.amount - expectedAmount;
                }
                const account = await accounts_model_1.default.findOne({
                    $or: [
                        { email: response.data.customer.email },
                        { phone: response.data.customer.phone_number },
                    ],
                });
                if (account) {
                    const verifiedTransaction = await verifiedtransactions_model_1.default.create({
                        tx_ref: response.data.tx_ref,
                        data: response.data,
                        account: account._id,
                    });
                    const cryptoPurchase = await listingPurchase_model_1.default.findOne({
                        checkOutId: verifiedTransaction.tx_ref,
                    });
                    if (cryptoPurchase) {
                        cryptoPurchase.verifiedTransaction = verifiedTransaction._id;
                        await cryptoPurchase.save();
                    }
                    await (0, cryptolisting_service_1.updatePaymentConfirmation)(response.data.tx_ref);
                }
                else {
                    await verifiedtransactionsNoAccount_model_1.default.create({
                        tx_ref: response.data.tx_ref,
                        data: response.data,
                    });
                }
                return {
                    status: true,
                    message: "Payment verified successfully",
                    data: response.data,
                };
            }
            else {
                return {
                    status: false,
                    message: "Payment verification failed",
                    error: response.message,
                };
            }
        }
        catch (error) {
            console.error("Error verifying payment:", error);
        }
    }
    static async initiateACHPayment(req) {
        const { ref, amount, email, currency = "usd" } = req.body;
        const payload = {
            amount: amount,
            currency: currency,
            email: email,
            tx_ref: ref,
        };
        if (payload.currency !== "USD" && payload.currency !== "usd") {
            return {
                status: false,
                message: "ACH payment is only available for USD payments",
            };
        }
        /* Development environment only */
        if (process.env.NODE_ENV === "dev") {
            mock_service_1.achChargeSuccess.data.amount = payload.amount;
            mock_service_1.achChargeSuccess.data.charged_amount = payload.amount;
            mock_service_1.achChargeSuccess.data.customer.email = payload.email;
            mock_service_1.achChargeSuccess.data.tx_ref = payload.tx_ref;
            return {
                status: true,
                message: "Payment initiation successful",
                data: mock_service_1.achChargeSuccess,
            };
        }
        try {
            // Call Flutterwave API to initiate payment
            const response = await flw.Charge.ach(payload);
            if (response.status === "success") {
                return {
                    status: true,
                    message: "Payment initiation successful",
                    data: response.data,
                };
            }
            else {
                return {
                    status: false,
                    message: "Payment initiation failed",
                    error: response.message,
                };
            }
        }
        catch (error) {
            console.error("Error initiating payment:", error);
            throw error;
        }
    }
}
exports.FlutterWaveService = FlutterWaveService;
class FailedVerificationQueue {
    constructor() {
        this.redis = init_redis_1.redisClient.generic;
    }
    async enqueue(item) {
        await this.redis.lpush("failed_verifications", JSON.stringify(item)); // Add to the left side (front)
    }
    async dequeue() {
        return this.redis.rpop("failed_verifications"); // Remove from the right side (end)
    }
    async size() {
        return this.redis.llen("failed_verifications"); // Get the size of the queue
    }
    // Peek at the first item in the queue without removing it
    async peek() {
        return this.redis.lindex("failed_verifications", 0); // Get the item at index 0 (front of the queue)
    }
    // Remove and return the first item (front) from the queue
    async removeFirst() {
        return this.redis.lpop("failed_verifications"); // Remove from the left side (front)
    }
    async clear() {
        await this.redis.del("failed_verifications"); // Clear the queue
    }
}
exports.FailedVerificationQueue = FailedVerificationQueue;
