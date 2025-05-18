"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const CryptoListingBookmarksSchema = new Schema({
    account: {
        type: String,
        required: true,
    },
    cryptoListing: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});
const CryptoListingBookmarks = mongoose_1.default.model("cryptolistingbookmarks", CryptoListingBookmarksSchema);
exports.default = CryptoListingBookmarks;
