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
class SocialAuthentication {
    static googleAuthentication(googleUser) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("googleUser ", googleUser);
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
                    googleUser.avatar = googleUser.avatar;
                    googleUser.createdAt = new Date();
                    googleUser.lastLogin = new Date();
                    googleUser.provider = "GOOGLE";
                    const newUser = yield accounts_model_1.default.create(googleUser);
                    user = newUser;
                }
                const accessToken = yield jwt_helper_1.default.signAccessToken(user._id.toString());
                const refreshToken = yield jwt_helper_1.default.signRefreshToken(user._id.toString());
                const authResult = {
                    status: true,
                    message: "google authentication was successful",
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
                    message: "google authentication was not successfull",
                };
            }
        });
    }
}
exports.SocialAuthentication = SocialAuthentication;
