"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const http_errors_1 = __importDefault(require("http-errors"));
const messages_1 = __importDefault(require("../../../helpers/messages"));
const validations_core_1 = require("../../../helpers/validators/validations_core");
const jwt_helper_1 = __importDefault(require("../../../helpers/jwt_helper"));
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const joiAuthValidators_1 = __importDefault(require("../../../helpers/validators/joiAuthValidators"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const helper_1 = require("./helper");
const devices_model_1 = __importDefault(require("../../../models/devices.model"));
const comparison_service_1 = require("../conversions/comparison.service");
const global_error_handler_1 = require("../../../bootstrap/global.error.handler");
const wallet_service_1 = require("../wallet/wallet.service");
class Authentication {
    constructor(req) {
        this.req = req;
        this.payload = req.body || {};
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield mongoose_1.default.startSession();
                const result = yield joiAuthValidators_1.default.registerSchema.validateAsync(this.req.body);
                const user = yield accounts_model_1.default.findOne({ email: result.email }).session(session);
                if (user) {
                    throw http_errors_1.default.Conflict(messages_1.default.auth.alreadyExistPartText);
                }
                let referredBy = null;
                if (result === null || result === void 0 ? void 0 : result.referralCode) {
                    const referrer = yield accounts_model_1.default.findOne({
                        referralCode: result.referralCode,
                    });
                    if (referrer) {
                        referredBy = referrer.referralCode;
                        referrer.referralCount += 1; // Increment the referrer's referral count
                        yield referrer.save(); // Save the updated referrer
                    }
                }
                result.referredBy = referredBy;
                const pendingAccount = new accounts_model_1.default(result);
                const savedUser = yield pendingAccount.save();
                if (savedUser._id.toString()) {
                    const otp = (0, helper_1.generateOtp)();
                    console.log("Register OTP ", otp);
                    yield (0, helper_1.setExpirableCode)(result.email, "account-verification", otp);
                    mailservice_1.default.auth.sendEmailConfirmationOtp(result.email, otp);
                    return {
                        status: true,
                        data: savedUser._id,
                        message: "Registration successful",
                    };
                }
                return { status: false, message: "Registration was unsuccessful!" };
            }
            catch (error) {
                console.log(error);
                let msg = "Registration was unsuccessful!";
                if (error.message.includes("already exists!")) {
                    error.status = 200;
                    msg = error.message || "User with email address already exists!";
                }
                return { status: false, message: msg };
            }
        });
    }
    sendEmailConfirmationOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authSendEmailConfirmOtpSchema.validateAsync(this.req.body);
                const user = yield accounts_model_1.default.findOne({ _id: result.accountId });
                if (!user) {
                    throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                        result.accountId,
                        messages_1.default.auth.notRegisteredPartText,
                    ]));
                }
                if (user.email_confirmed) {
                    return { status: false, message: messages_1.default.auth.emailAlreadyVerified };
                }
                const otp = (0, helper_1.generateOtp)();
                yield (0, helper_1.setExpirableCode)(user.email, "account-verification", otp);
                return yield mailservice_1.default.auth.sendEmailConfirmationOtp(user.email, otp);
            }
            catch (error) {
                console.log(error);
                throw error;
            }
        });
    }
    sendPasswordResetOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authSendResetPasswordOtp.validateAsync(this.req.body);
                const user = yield accounts_model_1.default.findOne({ email: result.email });
                if (!user) {
                    return {
                        status: false,
                        message: validations_core_1.utils.joinStringsWithSpace([
                            result.email,
                            messages_1.default.auth.notRegisteredPartText,
                        ]),
                    };
                }
                const otp = (0, helper_1.generateOtp)();
                yield (0, helper_1.setExpirableCode)(user._id.toString(), "password-reset", otp);
                console.log("Password reset otp: ", otp);
                return mailservice_1.default.auth.sendPasswordResetMail(result, user);
            }
            catch (error) {
                console.log(error);
                throw error.message;
            }
        });
    }
    verifyPasswordResetOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = this.req.body;
                const user = yield accounts_model_1.default.findOne({ email: result.email });
                if (!user) {
                    return {
                        status: false,
                        message: validations_core_1.utils.joinStringsWithSpace([
                            result.email,
                            messages_1.default.auth.notRegisteredPartText,
                        ]),
                    };
                }
                const cachedOtp = yield (0, helper_1.getExpirableCode)("password-reset", user._id.toString());
                if (!cachedOtp || (cachedOtp === null || cachedOtp === void 0 ? void 0 : cachedOtp.code.toString()) !== result.otp.toString()) {
                    return {
                        status: false,
                        message: "This otp is incorrect or has expired, please resend an otp...",
                    };
                }
                // await deleteExpirableCode(`password-reset${result.email}`);
                const hash = (0, helper_1.generatePasswordResetHash)(result.email, result.otp);
                yield (0, helper_1.setExpirableCode)(user._id.toString(), "password-reset-token", hash);
                return {
                    status: true,
                    message: "Otp has been verified successfully.",
                    data: { uid: user._id.toString(), token: hash },
                };
            }
            catch (error) {
                console.log(error);
                throw error.message;
            }
        });
    }
    resetPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authResetPassword.validateAsync(this.req.body);
                const cachedToken = yield (0, helper_1.getExpirableCode)("password-reset-token", result.uid);
                if (!cachedToken || (cachedToken === null || cachedToken === void 0 ? void 0 : cachedToken.code.toString()) !== result.token) {
                    throw http_errors_1.default.BadRequest(messages_1.default.auth.invalidTokenSupplied);
                }
                const account = yield accounts_model_1.default.findOne({
                    _id: result.uid,
                });
                if (!account) {
                    return {
                        status: false,
                        message: validations_core_1.utils.joinStringsWithSpace([
                            result.uid,
                            messages_1.default.auth.userNotRequestPasswordReset,
                        ]),
                    };
                }
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(result.password, salt);
                account.password = hashedPassword; // Set to the new password provided by the account
                yield account.save();
                yield (0, helper_1.deleteExpirableCode)(`password-reset-token${result.uid}`);
                return { status: true, message: messages_1.default.auth.passwordResetOk };
            }
            catch (error) {
                console.log(error);
                return { status: false, message: messages_1.default.auth.passwordResetFailed };
            }
        });
    }
    verifyEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const { otp, accountId } = this.req.body;
            if (!otp) {
                return { status: false, message: messages_1.default.auth.missingConfToken };
            }
            const account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!account) {
                return {
                    status: false,
                    message: "No account is associated with this request, please create an account.",
                };
            }
            const email = account.email;
            const cachedOtp = yield (0, helper_1.getExpirableCode)("account-verification", email);
            if (!cachedOtp || (cachedOtp === null || cachedOtp === void 0 ? void 0 : cachedOtp.code.toString()) !== otp.toString()) {
                return {
                    status: false,
                    message: "This otp is incorrect or has expired, please resend an otp...",
                };
            }
            try {
                if (!account.email_confirmed) {
                    account.email_confirmed = true;
                    const walletResponse = yield wallet_service_1.WalletService.createWallet(account._id);
                    if (walletResponse.status) {
                        account.walletCreated = true;
                    }
                    yield account.save();
                    yield (0, helper_1.deleteExpirableCode)(`account-verification${email}`);
                    return { status: true, message: messages_1.default.auth.emailVerifiedOk };
                }
                return { status: false, message: "Account already verified!" };
            }
            catch (error) {
                console.log(error);
                return { status: false, message: messages_1.default.auth.invalidConfToken };
            }
        });
    }
    static addDevice(account_1, deviceInformation_1) {
        return __awaiter(this, arguments, void 0, function* (account, deviceInformation, ipAddress = "127.0.0.1:27017") {
            const device = yield devices_model_1.default.findOne({
                account: account._id,
                fingerprint: deviceInformation.fingerprint,
            });
            if (!device) {
                yield devices_model_1.default.create({
                    account: account._id,
                    ipAddress: ipAddress,
                    fingerprint: deviceInformation.fingerprint,
                    deviceInformation,
                });
            }
        });
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authSchema.validateAsync(this.req.body);
                console.log("Login payload ", result);
                const account = yield accounts_model_1.default.findOne({ email: result.email });
                if (!account)
                    return http_errors_1.default.NotFound(messages_1.default.auth.userNotRegistered);
                const isMatch = yield account.isValidPassword(result.password);
                if (!isMatch)
                    return http_errors_1.default.Unauthorized(messages_1.default.auth.invalidCredentials);
                if (!account.email_confirmed) {
                    const otp = (0, helper_1.generateOtp)();
                    yield (0, helper_1.setExpirableCode)(result.email, "account-verification", otp);
                    yield mailservice_1.default.auth.sendEmailConfirmationOtp(result.email, otp);
                    return {
                        status: false,
                        code: 1001, //Code 101 is code to restart otp verification...
                        data: account._id,
                        message: "Please verify your account",
                    };
                }
                const accessToken = yield jwt_helper_1.default.signAccessToken(account.id);
                const refreshToken = yield jwt_helper_1.default.signRefreshToken(account.id);
                const userIpData = yield (0, comparison_service_1.getUserCountry)(this.req);
                const reqIp = userIpData === null || userIpData === void 0 ? void 0 : userIpData.reqIp;
                account.lastLogin = new Date();
                yield account.save();
                yield Authentication.addDevice(account, result.deviceInformation, reqIp);
                return { status: true, data: account, accessToken, refreshToken };
            }
            catch (error) {
                console.log(error);
                return { status: false, message: messages_1.default.auth.loginError };
            }
        });
    }
    checkUserName() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userName } = this.req.body;
                const users = yield accounts_model_1.default.find({
                    username: { $regex: `^${userName}$`, $options: "i" },
                });
                return {
                    status: true,
                    data: users.length,
                };
            }
            catch (error) {
                return { status: false, message: error.message };
            }
        });
    }
    getRefreshToken(next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = this.req.body;
                if (!refreshToken)
                    throw http_errors_1.default.BadRequest();
                const { aud } = (yield jwt_helper_1.default.verifyRefreshToken(refreshToken, next));
                if (aud) {
                    const accessToken = yield jwt_helper_1.default.signAccessToken(aud);
                    // const refToken = await jwthelper.signRefreshToken(aud);
                    return { status: true, accessToken: accessToken };
                }
            }
            catch (error) {
                console.log(error);
                return { status: false, message: error.message };
            }
        });
    }
    getUserProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield accounts_model_1.default.findOne({ _id: this.req.accountId });
                if (!account) {
                    throw http_errors_1.default.NotFound("User was not found");
                }
                return yield account.getProfile();
            }
            catch (error) {
                console.log(error);
                throw error.message;
            }
        });
    }
    saveUserProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patchData = this.req.body;
                if (!patchData) {
                    throw http_errors_1.default.NotFound("No data was provided");
                }
                const account = yield accounts_model_1.default.findOne({ _id: this.req.accountId });
                if (!account) {
                    throw http_errors_1.default.NotFound("Account was not found");
                }
                // Add fields validation
                Object.keys(patchData).forEach((field) => {
                    if (field != "email")
                        account[field] = patchData[field];
                });
                yield account.save();
                return {
                    status: true,
                    data: yield account.getProfile(),
                    message: "Profile updated successfully..",
                };
            }
            catch (error) {
                console.log(error);
                return { status: false, message: "Profile update failed.." };
            }
        });
    }
    toggleUserAdminStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accountId = this.req.body.accountId;
                const account = yield accounts_model_1.default.findById(accountId);
                account.isAdmin = !account.isAdmin;
                const savedUser = yield account.save();
                return {
                    status: savedUser.isAdmin,
                    message: "Sucessfull",
                    data: savedUser,
                };
            }
            catch (error) {
                console.log(error);
                return {
                    status: false,
                    message: error.message,
                };
            }
        });
    }
    resendtwoFaLoginOtp() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { accountId, otpChannel } = this.req.body;
                const otp = (0, helper_1.generateOtp)();
                const account = yield accounts_model_1.default.findById(accountId);
                if (!account) {
                    return {
                        status: false,
                        data: null,
                        message: "Account identity does not exist",
                    };
                }
                if (otpChannel === "email") {
                    yield (0, helper_1.setExpirableCode)(account.email, "email-2fa-signin-otp", otp);
                    console.log("Email 2FA OTP ===> ", Number(otp));
                    yield mailservice_1.default.auth.sendEmailConfirmationOtp(account.email, otp);
                }
                else if (otpChannel === "sms") {
                    const key = "sms-2fa-signin-otp";
                    yield this.sendPhoneOtp(key, account, "");
                }
                return {
                    status: true,
                    message: "Otp sent successfully",
                };
            }
            catch (error) {
                console.log(error);
                return {
                    status: false,
                    message: error.message,
                };
            }
        });
    }
    sendPhoneOtp(key, account, messageType) {
        return __awaiter(this, void 0, void 0, function* () {
            let otpType = key;
            const phone = account.phone;
            const countryCode = account.geoData.dialling_code;
            console.log("Account ==> ", JSON.stringify(account.geoData, null, 2));
            const parsedPhone = (0, helper_1.normalizePhoneNumber)(countryCode, phone);
            const otp = (0, helper_1.generateOtp)();
            yield (0, helper_1.setExpirablePhoneCode)(parsedPhone, otpType, otp);
            const data = {
                api_key: "API_KEY",
                message_type: "NUMERIC",
                to: parsedPhone,
                from: "CRYGOCA",
                channel: "generic",
                pin_attempts: 10,
                pin_time_to_live: 5,
                pin_length: 4,
                pin_placeholder: "< 1234 >",
                message_text: "Your GTR pin is < 1234 >",
                pin_type: "NUMERIC",
            };
            console.log("2FA OTP ===> ", Number(otp));
            // SmsService.sendSms(messageType, Number(otp), data);
            return {
                status: true,
                code: 200,
            };
        });
    }
    twofaSignInVerification() {
        return __awaiter(this, void 0, void 0, function* () {
            const { code, accountId, otpChannel, deviceInformation } = this.req
                .body;
            const getTokensAndLogin = (cachedOtp) => __awaiter(this, void 0, void 0, function* () {
                if ((cachedOtp === null || cachedOtp === void 0 ? void 0 : cachedOtp.code) === code) {
                    const accessToken = yield jwt_helper_1.default.signAccessToken(account.id);
                    const refreshToken = yield jwt_helper_1.default.signRefreshToken(account.id);
                    const userIpData = yield (0, comparison_service_1.getUserCountry)(this.req);
                    const reqIp = userIpData === null || userIpData === void 0 ? void 0 : userIpData.reqIp;
                    account.lastLogin = new Date();
                    yield account.save();
                    yield Authentication.addDevice(account, deviceInformation, reqIp);
                    return { status: true, data: account, accessToken, refreshToken };
                }
                return { status: false, message: messages_1.default.auth.loginError };
            });
            const account = yield accounts_model_1.default.findById(accountId);
            if (!account) {
                return {
                    status: false,
                    data: null,
                    message: "Account identity does not exist",
                };
            }
            if (otpChannel === "email") {
                const cachedOtp = yield (0, helper_1.getExpirableCode)("email-2fa-signin-otp", account.email);
                if (!cachedOtp) {
                    return {
                        status: false,
                        data: null,
                        message: "Invalid or expired otp, please request for a new otp",
                    };
                }
                console.log("cachedOtp email ===> ", cachedOtp);
                return yield getTokensAndLogin(cachedOtp);
            }
            else if (otpChannel === "sms") {
                const parsedPhone = (0, helper_1.normalizePhoneNumber)(account.geoData.dialling_code, account.phone);
                const cachedOtp = yield (0, helper_1.getExpirablePhoneCode)("sms-2fa-signin-otp", parsedPhone);
                if (!cachedOtp) {
                    return {
                        status: false,
                        data: null,
                        message: "Invalid or expired otp, please request for a new otp",
                    };
                }
                console.log("cachedOtp sms ===> ", cachedOtp);
                return yield getTokensAndLogin(cachedOtp);
            }
        });
    }
}
exports.Authentication = Authentication;
__decorate([
    (0, global_error_handler_1.handleErrors)()
], Authentication.prototype, "resendtwoFaLoginOtp", null);
__decorate([
    (0, global_error_handler_1.handleErrors)()
], Authentication.prototype, "sendPhoneOtp", null);
__decorate([
    (0, global_error_handler_1.handleErrors)()
], Authentication.prototype, "twofaSignInVerification", null);
