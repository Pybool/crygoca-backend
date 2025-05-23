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
const mongoose_1 = __importStar(require("mongoose"));
const PayoutSchema = new mongoose_1.Schema({
    checkOutId: {
        type: String,
        required: true,
    },
    cryptoListingPurchase: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "cryptolistingpurchase",
        required: true,
    },
    vendorAccount: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "accounts",
        required: true,
    },
    conversionMetaData: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
        required: false,
    },
    payout: {
        type: Number,
        required: true,
    },
    isConverted: {
        type: Boolean,
        default: false,
        required: false,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
    },
    payoutDate: {
        type: Date,
    },
    transactionId: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
const Payout = mongoose_1.default.model("Payout", PayoutSchema);
exports.default = Payout;
