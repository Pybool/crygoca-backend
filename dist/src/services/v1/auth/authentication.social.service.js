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
exports.SocialAuthentication = void 0;
const jwt_helper_1 = __importDefault(require("../../../helpers/jwt_helper"));
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const helpers_1 = require("../helpers");
const auth_service_1 = require("./auth.service");
function generateRandomUserName(googleUser) {
    return __awaiter(this, void 0, void 0, function* () {
        let username = null;
        let isUnique = false;
        while (!isUnique) {
            const shortTimestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
            let baseName = `${googleUser.firstname}${googleUser.lastname}`.toLowerCase();
            // Trim baseName to ensure total length does not exceed 10 characters
            baseName = baseName.slice(0, 10 - shortTimestamp.length);
            username = `${baseName}${shortTimestamp}`;
            // Check if username exists in MongoDB
            const existingUser = yield accounts_model_1.default.findOne({ username });
            if (!existingUser) {
                isUnique = true;
            }
        }
        return username;
    });
}
class SocialAuthentication {
    static googleAuthentication(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let firstTimeSignup = false;
                const googleUser = req.gAccount;
                const referralCode = req.referralCode;
                console.log("googleUser ", googleUser, referralCode);
                if (!googleUser.googleId) {
                    return {
                        status: false,
                        message: "Invalid google authentication profile",
                    };
                }
                let user = yield accounts_model_1.default.findOne({
                    $or: [
                        { googleId: googleUser.googleId },
                        { email: googleUser.email }
                    ]
                });
                if (user) {
                    user.lastLogin = new Date();
                    yield user.save();
                }
                if (!user) {
                    firstTimeSignup = true;
                    if (referralCode) {
                        const referrer = yield accounts_model_1.default.findOne({
                            referralCode: referralCode,
                        });
                        if (referrer) {
                            googleUser.referredBy = referrer.referralCode;
                            referrer.referralCount += 1; // Increment the referrer's referral count
                            yield referrer.save(); // Save the updated referrer
                        }
                    }
                    let username = yield generateRandomUserName(googleUser);
                    if (!username) {
                        const randomNum = Math.floor(1000 + Math.random() * 9000);
                        username = `${googleUser.firstname}_${googleUser.lastname}_${randomNum}`;
                    }
                    googleUser.username = username;
                    googleUser.referralCode = yield (0, helpers_1.generateReferralCode)(`${googleUser.firstname}${googleUser.lastname}`);
                    googleUser.avatar = '/assets/images/avatar.jpg';
                    googleUser.createdAt = new Date();
                    googleUser.lastLogin = new Date();
                    googleUser.provider = "GOOGLE";
                    const newUser = yield accounts_model_1.default.create(googleUser);
                    user = newUser;
                    // newUser.email_confirmed = true;
                    yield newUser.save();
                }
                if (firstTimeSignup) {
                    req.body = { accountId: user._id.toString() };
                    const auth = new auth_service_1.Authentication(req);
                    auth.sendEmailConfirmationOtp();
                    const authResult = {
                        status: true,
                        message: "Complete Email 2fa Otp step",
                        data: { accountId: user._id.toString() }
                    };
                    return authResult;
                }
                const accessToken = yield jwt_helper_1.default.signAccessToken(user._id.toString());
                const refreshToken = yield jwt_helper_1.default.signRefreshToken(user._id.toString());
                const authResult = {
                    status: true,
                    message: "Google authentication was successful",
                    data: user,
                    accessToken,
                    refreshToken,
                    extraMessage: "",
                };
                return authResult;
            }
            catch (error) {
                console.log(error);
                return {
                    status: false,
                    message: "Google authentication was not successfull",
                };
            }
        });
    }
}
exports.SocialAuthentication = SocialAuthentication;
