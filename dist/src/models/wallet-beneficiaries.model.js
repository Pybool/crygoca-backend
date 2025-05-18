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
exports.WalletBeneficiary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WalletBeneficiarySchema = new mongoose_1.Schema({
    account: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    beneficiaryAccount: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    receiverWallet: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    bankDetails: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    isCrygocaAccount: { type: Boolean, required: false, default: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.WalletBeneficiary = mongoose_1.default.model("WalletBeneficiary", WalletBeneficiarySchema);
