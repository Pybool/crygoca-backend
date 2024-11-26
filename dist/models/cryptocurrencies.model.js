"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const CryptoCurrenciesSchema = new Schema({
    cryptoId: {
        type: Number,
        required: false
    },
    logo: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    name: {
        type: String,
        required: false,
    },
    symbol: {
        type: String,
        required: false,
    },
    slug: {
        type: String,
        required: false,
    },
    tags: {
        type: String,
        required: false,
    },
    platform: {
        type: Schema.Types.Mixed,
        required: false,
    },
    crygocaSupported: {
        type: Boolean,
        required: false,
        default: false,
    },
    dateAdded: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        required: false
    },
});
const Cryptocurrencies = mongoose_1.default.model('cryptocurrencies', CryptoCurrenciesSchema);
exports.default = Cryptocurrencies;
