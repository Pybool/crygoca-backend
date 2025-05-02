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
exports.WalletExternalTransactions = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WalletExternalTransactionsSchema = new mongoose_1.Schema({
    debitWallet: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    creditWallet: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "SUCCESS"],
        required: true,
    },
    paymentProcessor: {
        type: String,
        required: true,
        default: "CRYGOCA"
    },
    txRef: {
        type: String,
        required: true,
        unique: true
    },
    currency: {
        type: String,
        required: true,
    },
    convertedAmount: {
        type: Number,
        required: false,
    },
    app_fee: {
        type: Number,
        default: 0,
    },
    payment_type: {
        type: String,
        required: true,
    },
    authorized: {
        type: Boolean,
        required: true,
        default: false
    },
    exchangeRate: {
        type: Number,
        default: 0,
    },
    conversionPayload: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
        default: {},
    },
    isConverted: {
        type: Boolean,
        required: true,
        default: false
    },
    mode: {
        type: String,
        required: true,
        default: "test"
    },
    businessName: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    redirectUrl: {
        type: String,
        required: true,
    },
}, { timestamps: true } // Automatically manages `createdAt` and `updatedAt`
);
exports.WalletExternalTransactions = mongoose_1.default.model("WalletExternalTransactions", WalletExternalTransactionsSchema);
