"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const CryptoListingSchema = new Schema({
    account: {
        type: Schema.Types.ObjectId, ref: "accounts",
        required: true,
    },
    cryptoName: {
        type: String,
        required: true
    },
    cryptoCode: {
        type: String,
        required: true,
    },
    cryptoLogo: {
        type: String,
        required: true
    },
    cryptoCurrency: {
        type: Schema.Types.ObjectId, ref: "cryptocurrencies",
        required: true,
    },
    units: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        required: true,
    },
    unitPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    minUnits: {
        type: Number,
        required: true,
        default: 0
    },
    isArchived: {
        type: Boolean,
        required: false,
        default: false,
    },
    depositConfirmed: {
        type: Boolean,
        required: false,
        default: false,
    },
    escrow: {
        type: Schema.Types.ObjectId, ref: "Escrow",
        required: false,
    },
    isCrygoca: {
        type: Boolean,
        required: false,
        default: false,
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
const CryptoListing = mongoose_1.default.model('cryptolisting', CryptoListingSchema);
exports.default = CryptoListing;
