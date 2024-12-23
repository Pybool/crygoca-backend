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
const Schema = mongoose_1.default.Schema;
exports.orderStatuses = [
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
        default: "Pending",
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
        var _a, _b, _c, _d;
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
                // Ensure the cryptoListing and its vendor are found
                if (!cryptoListing || !cryptoListing.account) {
                    throw new Error("Vendor not found for the given cryptoListing.");
                }
                //Revisit
                const computePayout = (units, unitPrice) => {
                    let amount_settled = verifiedTransaction.data.amount_settled;
                    return (amount_settled - (amount_settled * settings_1.ADMIN_SETTINGS.escrowFeefactor));
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
                const payoutAmount = computePayout(doc.units, cryptoListing.unitPrice); // Example logic for payout amount
                // Create the payout record within the transaction
                const payout = new payouts_model_1.default({
                    checkOutId: doc.checkOutId,
                    cryptoListingPurchase: doc._id,
                    vendorAccount: cryptoListing.account, // Assuming the vendor is linked to the `cryptoListing`
                    payout: payoutAmount,
                    paymentMethod: doc.paymentOption,
                    payoutDate: getLastDayOfMonth(), // Assuming payment option is used to determine payment method
                });
                // Save the payout within the same transaction
                yield payout.save();
                console.log("Buyer ", buyer);
                if (settings_1.ADMIN_SETTINGS.referrals.isActive &&
                    buyer.referredBy &&
                    ((_d = (_c = buyer === null || buyer === void 0 ? void 0 : buyer.referredBy) === null || _c === void 0 ? void 0 : _c.toString()) === null || _d === void 0 ? void 0 : _d.trim()) !== "") {
                    const referrer = yield mongoose_1.default
                        .model("accounts")
                        .findOne({ referralCode: buyer.referredBy });
                    console.log("referrer ", referrer);
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
