"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const OrderSchema = new mongoose_1.default.Schema({
    seller: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "accounts" },
    buyer: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "accounts" },
    amount: Number,
    walletToFund: String,
    checkoutId: String,
    toPay: String,
    listing: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "cryptolisting" },
    status: { type: String, enum: ["Pending", "Approved", "cancelled"], default: "Pending" },
}, { timestamps: true });
exports.Order = mongoose_1.default.model("Order", OrderSchema);
