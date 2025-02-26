"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const WithdrawalsSchema = new Schema({
    reference: {
        type: String,
        required: true,
    },
    account: {
        type: Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "wallet",
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    hash: {
        type: String,
        required: true,
    },
    payload: {
        type: Schema.Types.Mixed,
        required: true,
    },
    queuedResponse: {
        type: Schema.Types.Mixed,
        required: true,
    },
    verificationResponse: {
        type: Schema.Types.Mixed,
        required: false,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});
const Withdrawals = mongoose_1.default.model("withdrawals", WithdrawalsSchema);
exports.default = Withdrawals;
