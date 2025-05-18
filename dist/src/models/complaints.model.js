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
const complaintSchema = new mongoose_1.Schema({
    ticketNo: { type: String, required: true, index: true },
    checkoutId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    attachment: { type: String }, // file URL or path
    account: { type: mongoose_1.Schema.Types.ObjectId, ref: 'accounts' }, // reference to user, optional
    listingPurchase: { type: mongoose_1.Schema.Types.ObjectId, ref: 'cryptolistingpurchase' }, // reference to order, optional
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
        default: 'pending',
    },
}, { timestamps: true });
const Complaint = mongoose_1.default.model('Complaint', complaintSchema);
exports.default = Complaint;
