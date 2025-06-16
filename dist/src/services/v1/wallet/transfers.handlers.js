"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransfer = exports.withdrawToLocalBankHandler = exports.flutterwaveKeys = void 0;
const flutterwave_transfer_sdk_1 = require("./flutterwave-transfer-sdk");
exports.flutterwaveKeys = {
    PUBLIC: process.env.FLW_PUBLIC_KEY,
    SECRET: process.env.FLW_SECRET_KEY,
    ENC_KEY: process.env.FLW_ENCRYPTION_KEY,
};
// Initialize SDK with the Flutterwave secret key
const flutterwaveSdk = new flutterwave_transfer_sdk_1.CrygocaFlutterwaveSdk(exports.flutterwaveKeys.SECRET);
const withdrawToLocalBankHandler = async (payload) => {
    return await flutterwaveSdk.makeTransfer(payload);
};
exports.withdrawToLocalBankHandler = withdrawToLocalBankHandler;
const getTransfer = async (id) => {
    return await flutterwaveSdk.getTransfer(id);
};
exports.getTransfer = getTransfer;
