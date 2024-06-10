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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const http_errors_1 = __importDefault(require("http-errors"));
const messages_1 = __importDefault(require("../../helpers/messages"));
const validations_core_1 = require("../../helpers/validators/validations_core");
const jwt_helper_1 = __importDefault(require("../../helpers/jwt_helper"));
const mailservice_1 = __importDefault(require("./mailservice"));
const joiAuthValidators_1 = __importDefault(require("../../helpers/validators/joiAuthValidators"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const helper_1 = require("./helper");
class Authentication {
    constructor(req) {
        this.req = req;
        this.payload = req.body || {};
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield mongoose_1.default.startSession();
                const result = yield joiAuthValidators_1.default.authSchema.validateAsync(this.req.body);
                const user = yield accounts_model_1.default.findOne({ email: result.email }).session(session);
                if (user) {
                    throw http_errors_1.default.Conflict(messages_1.default.auth.alreadyExistPartText);
                }
                const pendingAccount = new accounts_model_1.default(result);
                // pendingAccount.email_confirmed = true; //Remove this line
                const savedUser = yield pendingAccount.save();
                if (savedUser._id.toString()) {
                    const otp = (0, helper_1.generateOtp)();
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
                const user = yield accounts_model_1.default.findOne({ email: result.email });
                if (!user) {
                    throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                        result.email,
                        messages_1.default.auth.notRegisteredPartText,
                    ]));
                }
                if (user.email_confirmed) {
                    return { status: false, message: messages_1.default.auth.emailAlreadyVerified };
                }
                const otp = (0, helper_1.generateOtp)();
                yield (0, helper_1.setExpirableCode)(result.email, "account-verification", otp);
                return yield mailservice_1.default.auth.sendEmailConfirmationOtp(result.email, otp);
            }
            catch (error) {
                console.log(error);
                throw error;
            }
        });
    }
    sendPasswordResetLink() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authSendResetPasswordLink.validateAsync(this.req.body);
                const user = yield accounts_model_1.default.findOne({ email: result.email });
                if (!user) {
                    throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                        result.email,
                        messages_1.default.auth.notRegisteredPartText,
                    ]));
                }
                return mailservice_1.default.auth.sendPasswordResetMail(result, user);
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
                if (!this.req.query.token)
                    throw http_errors_1.default.BadRequest(messages_1.default.auth.invalidTokenSupplied);
                const result = yield joiAuthValidators_1.default.authResetPassword.validateAsync(this.req.body);
                const account = yield accounts_model_1.default.findOne({
                    reset_password_token: this.req.query.token,
                    reset_password_expires: { $gt: Date.now() },
                });
                if (!account) {
                    throw http_errors_1.default.NotFound(validations_core_1.utils.joinStringsWithSpace([
                        result.email,
                        messages_1.default.auth.userNotRequestPasswordReset,
                    ]));
                }
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(result.password, salt);
                account.password = hashedPassword; // Set to the new password provided by the account
                account.reset_password_token = undefined;
                account.reset_password_expires = undefined;
                yield account.save();
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
            const { otp, email } = this.req.body;
            if (!otp) {
                return { status: false, message: messages_1.default.auth.missingConfToken };
            }
            const cachedOtp = yield (0, helper_1.getExpirableCode)("account-verification", email);
            if (!cachedOtp || (cachedOtp === null || cachedOtp === void 0 ? void 0 : cachedOtp.code.toString()) !== otp.toString()) {
                return {
                    status: false,
                    message: "This otp is incorrect or has expired...",
                };
            }
            try {
                const account = yield accounts_model_1.default.findOne({ email });
                if (!account.email_confirmed) {
                    account.email_confirmed = true;
                    yield account.save();
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
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield joiAuthValidators_1.default.authSchema.validateAsync(this.req.body);
                console.log("Login pauyload ", result);
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
                return { status: true, data: account, accessToken, refreshToken };
            }
            catch (error) {
                console.log(error);
                return { status: false, message: messages_1.default.auth.loginError };
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
                return { status: false, message: error.mesage };
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
}
exports.Authentication = Authentication;
