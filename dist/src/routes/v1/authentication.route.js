"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRouter = express_1.default.Router();
const invalidrequest_1 = require("../../middlewares/invalidrequest");
const authentication_controller_1 = __importDefault(require("../../controllers/v1/authentication.controller"));
const jwt_1 = require("../../middlewares/jwt");
const external_integration_controller_1 = require("../../controllers/v1/external-integration.controller");
authRouter.post('/register', authentication_controller_1.default.register);
authRouter.get('/verify-email-address', authentication_controller_1.default.verifyEmail);
authRouter.post('/check-username', authentication_controller_1.default.checkUserName);
authRouter.post('/resend-email-verification-otp', authentication_controller_1.default.sendEmailConfirmationOtp);
/* Password reset */
authRouter.post('/send-reset-password-otp', authentication_controller_1.default.sendPasswordResetOtp);
authRouter.post('/verify-reset-password-otp', authentication_controller_1.default.verifyPasswordResetOtp);
authRouter.post('/reset-password', authentication_controller_1.default.resetPassword);
authRouter.get('/getUser', authentication_controller_1.default.getUser);
authRouter.post('/login', authentication_controller_1.default.login);
authRouter.post('/refresh-token', authentication_controller_1.default.getRefreshToken);
authRouter.get('/user-profile', jwt_1.decode, authentication_controller_1.default.getUserProfile);
authRouter.put('/user-profile', jwt_1.decode, authentication_controller_1.default.saveUserProfile);
authRouter.put('/verify-account', authentication_controller_1.default.verifyEmail);
authRouter.post('/resend-2fa-signin-otp', authentication_controller_1.default.resendtwoFaLoginOtp);
authRouter.post('/2fa-signin-verify', authentication_controller_1.default.twofaSignInVerification);
//Merchant accounts
authRouter.post('/create-merchant', external_integration_controller_1.createMerchantAccount);
authRouter.all('/register', invalidrequest_1.handleInvalidMethod);
authRouter.all('/verify-email-address', invalidrequest_1.handleInvalidMethod);
authRouter.all('/resend-email-verification', invalidrequest_1.handleInvalidMethod);
authRouter.all('/send-reset-password-link', invalidrequest_1.handleInvalidMethod);
authRouter.all('/reset-password', invalidrequest_1.handleInvalidMethod);
authRouter.all('/login', invalidrequest_1.handleInvalidMethod);
authRouter.all('/refresh-token', invalidrequest_1.handleInvalidMethod);
authRouter.all('/user-profile', invalidrequest_1.handleInvalidMethod);
authRouter.all('/user-profile', invalidrequest_1.handleInvalidMethod);
exports.default = authRouter;
