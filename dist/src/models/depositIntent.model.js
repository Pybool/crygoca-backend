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
exports.DepositIntent = void 0;
// deposit intent model placeholder
const mongoose_1 = __importStar(require("mongoose"));
const depositIntentSchema = new mongoose_1.default.Schema({
    intentId: String,
    sender: String,
    receivingAddress: String,
    currency: String,
    amount: String,
    gasFeeEth: String,
    gasFeeToken: String,
    gasConversionRate: String,
    tokenAddress: String,
    isTopUp: { type: Boolean, default: false },
    account: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    listing: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "cryptolisting",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed"],
        default: "pending",
    },
    txHash: {
        type: String,
        required: false,
    },
    blockchain: {
        type: String,
        required: false,
    },
    chainId: {
        type: String,
        required: false,
    },
    blockHash: {
        type: String,
        required: false,
    },
    blockNumber: {
        type: String,
        required: false,
    },
}, { timestamps: true });
exports.DepositIntent = mongoose_1.default.model("DepositIntent", depositIntentSchema);
