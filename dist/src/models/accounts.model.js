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
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AccountsSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    email_confirmed: {
        type: Boolean,
        required: true,
        default: false,
    },
    firstname: {
        type: String,
        required: false,
        default: "",
    },
    lastname: {
        type: String,
        required: false,
        default: "",
    },
    fullname: {
        type: String,
        required: false,
        default: "",
    },
    googleId: {
        type: String,
        required: false,
        default: "",
    },
    idToken: {
        type: String,
        required: false,
        default: "",
    },
    provider: {
        type: String,
        required: false,
        enum: ["CRYGOCA", "GOOGLE"],
        default: "CRYGOCA",
    },
    username: {
        type: String,
        required: false,
        unique: true,
        default: "",
    },
    phone: {
        type: String,
        required: false,
        default: "",
    },
    address: {
        type: String,
        required: false,
        default: "",
    },
    useLoginOtp: {
        type: Boolean,
        default: false,
    },
    receiveNotifications: {
        type: Boolean,
        default: true,
    },
    geoData: {
        type: Schema.Types.Mixed,
        required: false,
        default: {},
    },
    bankInfo: {
        type: Schema.Types.Mixed,
        required: false,
        default: {},
    },
    google2fa: {
        type: Boolean,
        default: false,
    },
    sms2fa: {
        type: Boolean,
        default: false,
    },
    email2fa: {
        type: Boolean,
        default: false,
    },
    referralCode: { type: String, unique: true, required: false },
    referredBy: { type: String, default: null }, // This will store the referral code of the referrer
    referralCount: { type: Number, default: 0 },
    avatar: {
        type: String,
        required: false,
        default: "/assets/images/anon.png",
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    reset_password_token: {
        type: String,
        required: false,
        default: "",
    },
    reset_password_expires: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        default: null,
        required: false,
    },
    lastLogin: {
        type: Date,
        default: null,
        required: false,
    },
});
AccountsSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isNew && this.googleId == "") {
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(this.password, salt);
                this.password = hashedPassword;
                const generateReferralCode = () => {
                    const length = 13;
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    const randomPartLength = length - this.username.length; // Ensure the code has the desired length
                    let referralCode = this.username.substring(0, 4).toUpperCase(); // Take the first 3 letters of the username
                    // Generate random characters to fill up the remaining part of the referral code
                    for (let i = 0; i < randomPartLength; i++) {
                        const randomIndex = Math.floor(Math.random() * chars.length);
                        referralCode += chars[randomIndex];
                    }
                    return referralCode.toUpperCase();
                };
                this.referralCode = generateReferralCode();
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
AccountsSchema.methods.isValidPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcryptjs_1.default.compare(password, this.password);
        }
        catch (error) {
            throw error;
        }
    });
};
AccountsSchema.statics.changePassword = function (accountId, oldPassword, newPassword, confirmPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch the account by ID
            const account = yield this.findById(accountId);
            if (!account) {
                return { status: false, message: 'Account not found' };
            }
            // Compare old password
            const isMatch = yield bcryptjs_1.default.compare(oldPassword, account.password);
            if (!isMatch) {
                return { status: false, message: 'Incorrect old password' };
            }
            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                return { status: false, message: 'New password and confirm password do not match' };
            }
            // Hash the new password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
            // Update the account's password
            account.password = hashedPassword;
            yield account.save();
            return { status: true, message: 'Password updated successfully' };
        }
        catch (error) {
            return { status: false, message: 'Error updating password' };
        }
    });
};
AccountsSchema.methods.getProfile = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                firstname: this.firstname,
                lastname: this.lastname,
                othername: this.othername,
                email: this.email,
                phone: this.phone,
                username: this.username,
                isAdmin: this.isAdmin,
                avatar: this.avatar,
                address: this.address,
            };
        }
        catch (error) {
            throw error;
        }
    });
};
AccountsSchema.index({ username: 1 }, { collation: { locale: "en", strength: 2 } });
const Accounts = mongoose_1.default.model("accounts", AccountsSchema);
exports.default = Accounts;
