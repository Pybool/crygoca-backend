"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferLog = void 0;
// models/TransferLog.ts
const mongoose_1 = __importDefault(require("mongoose"));
const TransferLogSchema = new mongoose_1.default.Schema({
    account: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    escrow: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Escrow",
        required: true,
    },
    checkOutId: String,
    recipient: String,
    symbol: String,
    amount: String,
    tokenAddress: String,
    type: String,
    txHash: String,
    status: String,
    error: String,
    createdAt: { type: Date, default: Date.now },
});
exports.TransferLog = mongoose_1.default.model("TransferLog", TransferLogSchema);
