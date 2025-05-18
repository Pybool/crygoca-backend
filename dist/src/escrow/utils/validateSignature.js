"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSignature = void 0;
// signature validation placeholder
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default();
const validateSignature = (address, signature, message) => {
    try {
        const signer = web3.eth.accounts.recover(message, signature);
        return signer.toLowerCase() === address.toLowerCase();
    }
    catch (error) {
        console.error('Signature validation error:', error);
        return false;
    }
};
exports.validateSignature = validateSignature;
