"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const VerifiedTransactionsSchema = new Schema({
    tx_ref: {
        type: String,
        required: true
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
    },
    paymentProcessor: {
        type: String,
        required: false,
        enum: ["FLUTTERWAVE", "CRYGOCA"],
        default: "FLUTTERWAVE"
    },
    account: {
        type: Schema.Types.ObjectId, ref: "accounts",
        required: true,
    },
    valueProvided: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
});
const VerifiedTransactions = mongoose_1.default.model('verifiedTransactions', VerifiedTransactionsSchema);
exports.default = VerifiedTransactions;
