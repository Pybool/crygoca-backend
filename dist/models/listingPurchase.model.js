"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const CryptoListingPurchaseSchema = new Schema({
    account: {
        type: Schema.Types.ObjectId, ref: "accounts",
        required: true,
    },
    cryptoListing: {
        type: Schema.Types.ObjectId, ref: "cryptolisting",
        required: true,
    },
    units: {
        type: Number,
        required: true,
        default: 0
    },
    notes: {
        type: String,
        required: false
    },
    paymentConfirmed: {
        type: Boolean,
        required: false,
        default: false
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
});
const CryptoListingPurchase = mongoose_1.default.model('cryptolistingpurchase', CryptoListingPurchaseSchema);
exports.default = CryptoListingPurchase;
