"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const authSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
    password: joi_1.default.string().min(4).required(),
});
const authSendEmailConfirmOtpSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
});
const authSendResetPasswordLink = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().required(),
});
const authResetPassword = joi_1.default.object({
    password: joi_1.default.string().min(4).required(),
});
const validations = {
    authSchema,
    authSendEmailConfirmOtpSchema,
    authSendResetPasswordLink,
    authResetPassword,
};
exports.default = validations;
