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
exports.FailedVerificationQueue = exports.FlutterWaveService = exports.flutterwaveKeys = void 0;
const Flutterwave = require("flutterwave-node-v3");
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const verifiedtransactionsNoAccount_model_1 = __importDefault(require("../../../models/verifiedtransactionsNoAccount.model"));
const cryptolisting_service_1 = require("../listingsServices/cryptolisting.service");
const init_redis_1 = require("../../../redis/init.redis");
const mock_service_1 = require("./mock.service");
exports.flutterwaveKeys = {
    PUBLIC: process.env.FLW_PUBLIC_KEY,
    SECRET: process.env.FLW_SECRET_KEY,
    ENC_KEY: process.env.FLW_ENCRYPTION_KEY,
};
const flw = new Flutterwave(exports.flutterwaveKeys.PUBLIC, exports.flutterwaveKeys.SECRET);
class FlutterWaveService {
    static initiateCardPayment(req) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield flw.Charge.card(paymentData);
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
        });
    }
    static verifyCardPayment() {
        return __awaiter(this, arguments, void 0, function* (data = null) {
            const { paymentReference, expectedAmount, expectedCurrency } = data; // The transaction reference from Flutterwave
            console.log("Verification data ", data);
            try {
                // Verify the payment with Flutterwave
                const response = yield flw.Transaction.verify({ id: paymentReference });
                if (response.status !== "success") {
                    const failedVerificationQueue = new FailedVerificationQueue();
                    yield failedVerificationQueue.enqueue(data);
                }
                if (response.status === "success" &&
                    response.data.status === "successful" &&
                    response.data.amount >= expectedAmount &&
                    response.data.currency === expectedCurrency) {
                    if (response.data.amount >= expectedAmount) {
                        data.toRefund = response.data.amount - expectedAmount;
                    }
                    const account = yield accounts_model_1.default.findOne({
                        $or: [
                            { email: response.data.customer.email },
                            { phone: response.data.customer.phone_number },
                        ],
                    });
                    if (account) {
                        yield verifiedtransactions_model_1.default.create({
                            tx_ref: response.data.tx_ref,
                            data: response.data,
                            account: account._id,
                        });
                        yield (0, cryptolisting_service_1.updatePaymentConfirmation)(response.data.tx_ref);
                    }
                    else {
                        yield verifiedtransactionsNoAccount_model_1.default.create({
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
                throw error;
            }
        });
    }
    static initiateACHPayment(req) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const response = yield flw.Charge.ach(payload);
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
        });
    }
}
exports.FlutterWaveService = FlutterWaveService;
class FailedVerificationQueue {
    constructor() {
        this.redis = init_redis_1.redisClient.generic;
    }
    enqueue(item) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redis.lpush("failed_verifications", JSON.stringify(item)); // Add to the left side (front)
        });
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.rpop("failed_verifications"); // Remove from the right side (end)
        });
    }
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.llen("failed_verifications"); // Get the size of the queue
        });
    }
    // Peek at the first item in the queue without removing it
    peek() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.lindex("failed_verifications", 0); // Get the item at index 0 (front of the queue)
        });
    }
    // Remove and return the first item (front) from the queue
    removeFirst() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.lpop("failed_verifications"); // Remove from the left side (front)
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redis.del("failed_verifications"); // Clear the queue
        });
    }
}
exports.FailedVerificationQueue = FailedVerificationQueue;
