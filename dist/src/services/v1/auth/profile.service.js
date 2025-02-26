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
exports.ProfileService = void 0;
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const devices_model_1 = __importDefault(require("../../../models/devices.model"));
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const helper_1 = require("./helper");
class ProfileService {
    static getUserProfile(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const preferences = {};
            const accountId = req.accountId;
            if (!accountId) {
                return {
                    status: false,
                    message: "No valid identity for request.",
                    data: null,
                    code: 200,
                };
            }
            const account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!account) {
                return {
                    status: false,
                    message: "No account found for identity.",
                    data: null,
                    code: 200,
                };
            }
            const devices = yield devices_model_1.default.find({ account: accountId });
            return {
                status: true,
                message: "User profile was fetched succesfully.",
                data: {
                    account,
                    devices,
                    preferences,
                },
            };
        });
    }
    static saveBasicInfoAndPreferences(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = req.body;
            const accountId = req.accountId;
            if (!accountId) {
                return {
                    status: false,
                    message: "No valid identity for request.",
                    data: null,
                    code: 200,
                };
            }
            const Account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (Account) {
                if ((_a = Account === null || Account === void 0 ? void 0 : Account.geoData) === null || _a === void 0 ? void 0 : _a.code) {
                    delete payload.geoData;
                }
            }
            const updatedAccount = yield accounts_model_1.default.findOneAndUpdate({ _id: accountId }, payload, { new: true });
            if (!updatedAccount) {
                return {
                    status: false,
                    message: "User profile update failed",
                    data: null,
                    code: 200,
                };
            }
            return {
                status: true,
                message: "User profile was updated succesfully.",
                data: updatedAccount,
            };
        });
    }
    static saveSinglePreference(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = req.body;
            const accountId = req.accountId;
            if (!accountId) {
                return {
                    status: false,
                    message: "No valid identity for request.",
                    data: null,
                    code: 200,
                };
            }
            const updatedAccount = yield accounts_model_1.default.findOneAndUpdate({ _id: accountId }, payload, { new: true });
            if (!updatedAccount) {
                return {
                    status: false,
                    message: "Preference update failed",
                    data: null,
                    code: 200,
                };
            }
            return {
                status: true,
                message: "Preference was updated succesfully.",
                data: updatedAccount,
            };
        });
    }
    static reassignDeviceAuthorization(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = req.body;
            const accountId = req.accountId;
            if (!accountId) {
                return {
                    status: false,
                    message: "No valid identity for request.",
                    data: null,
                    code: 200,
                };
            }
            const account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!account) {
                return {
                    status: false,
                    message: "No account found for identity.",
                    data: null,
                    code: 200,
                };
            }
            const device = yield devices_model_1.default.findOne({
                account: accountId,
                fingerprint: payload.fingerprint,
            });
            if (!device) {
                return {
                    status: false,
                    message: "No device found for identity.",
                    data: null,
                    code: 200,
                };
            }
            device.canLogin = payload.canLogin;
            const savedDevice = yield device.save();
            return {
                status: true,
                message: "Device authorization was updated succesfully.",
                data: savedDevice,
            };
        });
    }
    static changePassword(accountId, oldPassword, newPassword, confirmPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield accounts_model_1.default.changePassword(accountId, oldPassword, newPassword, confirmPassword);
            return result;
        });
    }
    static sendAddPasswordCode(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const otp = (0, helper_1.generateOtp)();
            const user = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!user) {
                return {
                    status: false,
                    message: "No user was found for this session"
                };
            }
            if (user === null || user === void 0 ? void 0 : user.password) {
                return {
                    status: false,
                    message: "You already have an existing password, you can only change this password.",
                };
            }
            yield (0, helper_1.setExpirableCode)(accountId, "add-password", otp);
            mailservice_1.default.auth.sendAddPasswordMail(user.email, otp);
            return {
                status: true,
                message: "Add Password Otp Sent Successfully."
            };
        });
    }
    static addPassword(accountId, newPassword, confirmPassword, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOtp = yield (0, helper_1.getExpirableCode)("add-password", accountId);
            if (!cachedOtp || (cachedOtp === null || cachedOtp === void 0 ? void 0 : cachedOtp.code.toString()) !== otp) {
                return {
                    status: false,
                    data: null,
                    message: "Invalid or expired otp, please request for a new otp",
                };
            }
            const result = yield accounts_model_1.default.addPassword(accountId, newPassword, confirmPassword);
            return result;
        });
    }
}
exports.ProfileService = ProfileService;
