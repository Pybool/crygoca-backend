"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransaction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WalletTransactionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    creditWalletAccountNo: { type: String, required: false },
    debitWalletAccountNo: { type: String, required: false },
    payout: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Payout",
        required: false,
    },
    verifiedTransaction: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "verifiedTransactions",
        required: false,
    },
    amount: { type: Number, required: true, default: 0 },
    priorBalance: { type: Number, required: true, default: 0 },
    type: {
        type: String,
        required: true,
        default: "wallet-transfer",
        enum: [
            "wallet-transfer",
            "direct-topup",
            "payout-topup",
            "wallet-withdrawal",
        ],
    },
    reference: { type: String, required: false },
    operationType: {
        type: String,
        required: true,
        default: "credit",
        enum: ["credit", "debit"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.WalletTransaction = mongoose_1.default.model("WalletTransaction", WalletTransactionSchema);
