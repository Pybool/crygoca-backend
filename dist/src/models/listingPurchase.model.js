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
exports.orderStatuses = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const payouts_model_1 = __importDefault(require("./payouts.model"));
const verifiedtransactions_model_1 = __importDefault(require("./verifiedtransactions.model"));
const referralrewards_model_1 = __importDefault(require("./referralrewards.model"));
const reward_service_1 = require("../services/v1/listingsServices/reward.service");
const settings_1 = require("./settings");
const comparison_service_1 = require("../services/v1/conversions/comparison.service");
const countries_1 = require("./countries");
const wallet_model_1 = require("./wallet.model");
const transfers_queue_1 = require("../services/v1/tasks/wallet/transfers.queue");
const Schema = mongoose_1.default.Schema;
exports.orderStatuses = [
    "Not-Started",
    "Pending",
    "In-Progress",
    "Completed",
    "Closed",
    "Disputed",
];
const CryptoListingPurchaseSchema = new Schema({
    checkOutId: {
        type: String,
        required: false,
    },
    account: {
        type: Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    cryptoListing: {
        type: Schema.Types.ObjectId,
        ref: "cryptolisting",
        required: true,
    },
    verifiedTransaction: {
        type: Schema.Types.ObjectId,
        ref: "verifiedTransactions",
        required: false,
    },
    walletAddress: {
        type: String,
        required: false,
    },
    paymentOption: {
        type: String,
        required: false,
    },
    units: {
        type: Number,
        required: true,
        default: 0,
    },
    unitPriceAtPurchaseTime: {
        type: Number,
        required: false,
        default: 0,
    },
    notes: {
        type: String,
        required: false,
    },
    escrowFeefactor: {
        type: Number,
        default: 0.02,
    },
    paymentConfirmed: {
        type: Boolean,
        required: false,
        default: false,
    },
    fulfillmentStatus: {
        type: String,
        enum: exports.orderStatuses,
        default: "Not-Started",
    },
    buyerFulfillmentClaim: {
        type: Schema.Types.Mixed,
        enum: ["Closed", "Disputed"],
        default: null,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
});
CryptoListingPurchaseSchema.post("save", function (doc) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        // Check if buyerFulfillmentClaim has been set to "Completed" and wasn't previously completed
        if (doc.fulfillmentStatus === "Completed" &&
            doc.buyerFulfillmentClaim === "Closed") {
            try {
                // Get the vendor details from the cryptoListing
                const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
                    tx_ref: (_a = doc.checkOutId) === null || _a === void 0 ? void 0 : _a.toString(),
                });
                const existingPayout = yield payouts_model_1.default.findOne({
                    checkOutId: (_b = doc.checkOutId) === null || _b === void 0 ? void 0 : _b.toString(),
                });
                if (existingPayout) {
                    throw new Error("Checkout id already has an existing payout");
                }
                if (!verifiedTransaction) {
                    throw new Error("No verified transaction/payments was found for this purchase");
                }
                const cryptoListing = yield mongoose_1.default
                    .model("cryptolisting")
                    .findById(doc.cryptoListing);
                const buyer = yield mongoose_1.default.model("accounts").findById(doc.account);
                const seller = yield mongoose_1.default
                    .model("accounts")
                    .findById(cryptoListing.account);
                // Ensure the cryptoListing and its vendor are found
                if (!cryptoListing || !cryptoListing.account || !seller) {
                    throw new Error("Vendor not found for the given cryptoListing.");
                }
                if (!seller) {
                    throw new Error("Vendor not found for the given cryptoListing.");
                }
                console.log("cryptoListing.account.geoData", seller.geoData);
                const currencyTo = seller.geoData.currency.code;
                const currencyFrom = verifiedTransaction.data.currency;
                const from = (0, countries_1.getCountryCodeByCurrencyCode)(currencyFrom.toUpperCase()).code;
                const to = (0, countries_1.getCountryCodeByCurrencyCode)(currencyTo.toUpperCase()).code;
                console.log(from, to, currencyFrom, currencyTo);
                const convertToDefaultCurrency = (amount) => __awaiter(this, void 0, void 0, function* () {
                    if (from && to && currencyFrom && currencyTo) {
                        return yield (0, comparison_service_1.convertCurrency)(from, to, currencyFrom, currencyTo, amount === null || amount === void 0 ? void 0 : amount.toString());
                    }
                    return null;
                });
                //Revisit
                const computePayout = (units, unitPrice) => {
                    let amount_settled = verifiedTransaction.data.amount_settled;
                    return amount_settled - amount_settled * settings_1.ADMIN_SETTINGS.escrowFeefactor;
                };
                const getLastDayOfMonth = () => {
                    const today = new Date();
                    // Set the date to the 1st day of the next month
                    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                    // Subtract one day to get the last day of the current month
                    const lastDay = new Date(nextMonth - 1);
                    return lastDay;
                };
                // Calculate the payout amount
                let isConverted = false;
                let payoutAmount = computePayout(doc.units, doc.unitPriceAtPurchaseTime);
                const payoutAmountUnconverted = JSON.parse(JSON.stringify(payoutAmount));
                const conversionResult = yield convertToDefaultCurrency(payoutAmount);
                console.log("conversionResult ==> ", conversionResult);
                if (conversionResult.status) {
                    isConverted = true;
                    payoutAmount =
                        payoutAmount * ((_d = (_c = conversionResult === null || conversionResult === void 0 ? void 0 : conversionResult.data) === null || _c === void 0 ? void 0 : _c.data[currencyTo]) === null || _d === void 0 ? void 0 : _d.value);
                }
                // Create the payout record within the transaction
                const payout = new payouts_model_1.default({
                    checkOutId: doc.checkOutId,
                    cryptoListingPurchase: doc._id,
                    vendorAccount: cryptoListing.account, // Assuming the vendor is linked to the `cryptoListing`
                    payout: payoutAmount,
                    paymentMethod: doc.paymentOption,
                    isConverted: isConverted,
                    payoutDate: getLastDayOfMonth(), // Assuming payment option is used to determine payment method
                    conversionMetaData: {
                        from,
                        to,
                        currencyFrom,
                        currencyTo,
                        payoutAmount: payoutAmountUnconverted,
                    },
                });
                // Save the payout within the same transaction
                yield payout.save();
                console.log("Payout =====>  ", payout);
                const vendorWallet = yield wallet_model_1.Wallet.findOne({
                    user: payout.vendorAccount,
                });
                console.log("vendorWallet ", vendorWallet);
                if (vendorWallet) {
                    const meta = {
                        walletAccountNo: vendorWallet.walletAccountNo,
                        payoutConversionMetrics: payout.conversionMetaData,
                        operationType: "credit",
                        payoutId: payout._id,
                        verifiedTransactionId: verifiedTransaction._id,
                    };
                    yield (0, transfers_queue_1.addWalletBalanceUpdateJob)("payout-topup", payout.payout, meta);
                }
                if (settings_1.ADMIN_SETTINGS.referrals.isActive &&
                    buyer.referredBy &&
                    ((_f = (_e = buyer === null || buyer === void 0 ? void 0 : buyer.referredBy) === null || _e === void 0 ? void 0 : _e.toString()) === null || _f === void 0 ? void 0 : _f.trim()) !== "") {
                    const referrer = yield mongoose_1.default
                        .model("accounts")
                        .findOne({ referralCode: buyer.referredBy });
                    if (referrer) {
                        const transactionIsRewardable = yield (0, reward_service_1.checkIfTransactionHasReward)(verifiedTransaction);
                        if (transactionIsRewardable.eligibleForReward) {
                            console.log("REF DATA ===> ", {
                                referralCode: buyer.referredBy,
                                rewardAmount: transactionIsRewardable.rewardAmount,
                                verifiedTransaction: verifiedTransaction._id,
                            });
                            yield referralrewards_model_1.default.create({
                                referralCode: buyer.referredBy,
                                rewardAmount: transactionIsRewardable.rewardAmount,
                                verifiedTransaction: verifiedTransaction._id,
                            });
                        }
                    }
                }
                // Commit the transaction
                console.log(`Payout created for listing purchase ${doc._id}`);
            }
            catch (error) {
                console.log("Error ", error);
                // If anything goes wrong, abort the transaction and rollback the changes
                console.error("Error creating payout:", error);
            }
            finally {
                // End the session
            }
        }
    });
});
const CryptoListingPurchase = mongoose_1.default.model("cryptolistingpurchase", CryptoListingPurchaseSchema);
exports.default = CryptoListingPurchase;
