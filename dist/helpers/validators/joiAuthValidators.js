"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const authSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
    password: joi_1.default.string().min(8).required(),
});
const authSendEmailConfirmOtpSchema = joi_1.default.object({
    accountId: joi_1.default.string().required(),
});
const authSendResetPasswordOtp = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
});
const authResetPassword = joi_1.default.object({
    uid: joi_1.default.string().required(),
    token: joi_1.default.string().required(),
    password: joi_1.default.string().min(8).required(),
});
const validations = {
    authSchema,
    authSendEmailConfirmOtpSchema,
    authSendResetPasswordOtp,
    authResetPassword,
};
exports.default = validations;
