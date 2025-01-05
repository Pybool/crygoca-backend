"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const EnquiriesSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    name: {
        type: String,
        required: false,
        default: ''
    },
    phone: {
        type: String,
        required: false,
        default: ''
    },
    message: {
        type: String,
        required: false,
        default: ''
    },
    createdAt: {
        type: Date,
        required: true
    },
});
const Enquiries = mongoose_1.default.model('enquiries', EnquiriesSchema);
exports.default = Enquiries;
