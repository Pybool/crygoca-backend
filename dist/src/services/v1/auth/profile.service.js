"use strict";
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
    static async getUserProfile(req) {
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
        const account = await accounts_model_1.default.findOne({ _id: accountId });
        if (!account) {
            return {
                status: false,
                message: "No account found for identity.",
                data: null,
                code: 200,
            };
        }
        const devices = await devices_model_1.default.find({ account: accountId });
        return {
            status: true,
            message: "User profile was fetched succesfully.",
            data: {
                account,
                devices,
                preferences,
            },
        };
    }
    static async saveBasicInfoAndPreferences(req) {
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
        const Account = await accounts_model_1.default.findOne({ _id: accountId });
        if (Account) {
            if (Account?.geoData?.code) {
                delete payload.geoData;
            }
        }
        const updatedAccount = await accounts_model_1.default.findOneAndUpdate({ _id: accountId }, payload, { new: true });
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
    }
    static async saveSinglePreference(req) {
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
        const updatedAccount = await accounts_model_1.default.findOneAndUpdate({ _id: accountId }, payload, { new: true });
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
    }
    static async reassignDeviceAuthorization(req) {
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
        const account = await accounts_model_1.default.findOne({ _id: accountId });
        if (!account) {
            return {
                status: false,
                message: "No account found for identity.",
                data: null,
                code: 200,
            };
        }
        const device = await devices_model_1.default.findOne({
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
        const savedDevice = await device.save();
        return {
            status: true,
            message: "Device authorization was updated succesfully.",
            data: savedDevice,
        };
    }
    static async changePassword(accountId, oldPassword, newPassword, confirmPassword) {
        const result = await accounts_model_1.default.changePassword(accountId, oldPassword, newPassword, confirmPassword);
        return result;
    }
    static async sendAddPasswordCode(accountId) {
        const otp = (0, helper_1.generateOtp)();
        const user = await accounts_model_1.default.findOne({ _id: accountId });
        if (!user) {
            return {
                status: false,
                message: "No user was found for this session"
            };
        }
        if (user?.password) {
            return {
                status: false,
                message: "You already have an existing password, you can only change this password.",
            };
        }
        await (0, helper_1.setExpirableCode)(accountId, "add-password", otp);
        mailservice_1.default.auth.sendAddPasswordMail(user.email, otp);
        return {
            status: true,
            message: "Add Password Otp Sent Successfully."
        };
    }
    static async addPassword(accountId, newPassword, confirmPassword, otp) {
        const cachedOtp = await (0, helper_1.getExpirableCode)("add-password", accountId);
        if (!cachedOtp || cachedOtp?.code.toString() !== otp) {
            return {
                status: false,
                data: null,
                message: "Invalid or expired otp, please request for a new otp",
            };
        }
        const result = await accounts_model_1.default.addPassword(accountId, newPassword, confirmPassword);
        return result;
    }
    static async uploadAvatar(req) {
        try {
            let account = await accounts_model_1.default.findOne({ _id: req.accountId });
            if (!account) {
                return {
                    status: false,
                    message: "Account was not found",
                    code: 400
                };
            }
            if (req?.attachments?.length > 0) {
                account.avatar = req.attachments[0].replaceAll("/public", "");
            }
            account = await account.save();
            return {
                status: true,
                data: account,
                message: "Avatar updated successfully..",
            };
        }
        catch (error) {
            console.log(error);
            return { status: false, message: "Profile update failed.." };
        }
    }
}
exports.ProfileService = ProfileService;
