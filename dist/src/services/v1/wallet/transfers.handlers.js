"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const withdrawToLocalBankHandler = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield flutterwaveSdk.makeTransfer(payload);
});
exports.withdrawToLocalBankHandler = withdrawToLocalBankHandler;
const getTransfer = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield flutterwaveSdk.getTransfer(id);
});
exports.getTransfer = getTransfer;
