"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const VerifiedTransactionsNoAuthSchema = new Schema({
    tx_ref: {
        type: String,
        required: true,
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
    },
    valueProvided: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
});
const VerifiedTransactionsNoAuth = mongoose_1.default.model("verifiedTransactionsNoAuth", VerifiedTransactionsNoAuthSchema);
exports.default = VerifiedTransactionsNoAuth;
