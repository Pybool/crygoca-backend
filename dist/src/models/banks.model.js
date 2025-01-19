"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const BanksSchema = new Schema({
    countryCode: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    routingNumber: {
        type: String,
        required: false,
        default: "",
    },
    swiftCode: {
        type: String,
        required: false,
        default: "",
    },
});
const Banks = mongoose_1.default.model("banks", BanksSchema);
exports.default = Banks;
