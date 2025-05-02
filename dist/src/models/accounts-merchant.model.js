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
const MerchantAccountsSchema = new Schema({
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
    isVerified: {
        type: Boolean,
        required: true,
        default: true,
    },
    businessName: {
        type: String,
        required: false,
        default: "",
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
    geoData: {
        type: Schema.Types.Mixed,
        required: false,
        default: {},
    },
    walletCreated: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String,
        required: false,
        default: "/assets/images/anon.png",
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
    lastSeen: {
        type: Date,
        default: null,
        required: false,
    },
});
MerchantAccountsSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isNew) {
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(this.password, salt);
                this.password = hashedPassword;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
MerchantAccountsSchema.methods.isValidPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcryptjs_1.default.compare(password, this.password);
        }
        catch (error) {
            throw error;
        }
    });
};
MerchantAccountsSchema.statics.addPassword = function (accountId, newPassword, confirmPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch the account by ID
            const account = yield this.findById(accountId);
            if (!account) {
                return { status: false, message: "Account not found" };
            }
            if (account === null || account === void 0 ? void 0 : account.password) {
                return {
                    status: false,
                    message: "You already have an existing password, you can only change this password.",
                };
            }
            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                return {
                    status: false,
                    message: "New password and confirm password do not match",
                };
            }
            // Hash the new password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
            // Update the account's password
            account.password = hashedPassword;
            yield account.save();
            return { status: true, message: "Password created successfully" };
        }
        catch (error) {
            return { status: false, message: "Error updating password" };
        }
    });
};
MerchantAccountsSchema.statics.changePassword = function (accountId, oldPassword, newPassword, confirmPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch the account by ID
            const account = yield this.findById(accountId);
            if (!account) {
                return { status: false, message: "Account not found" };
            }
            // Compare old password
            try {
                const isMatch = yield bcryptjs_1.default.compare(oldPassword, account.password);
                if (!isMatch) {
                    return { status: false, message: "Incorrect old password" };
                }
            }
            catch (_a) {
                return { status: false, message: "Incorrect old password" };
            }
            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                return {
                    status: false,
                    message: "New password and confirm password do not match",
                };
            }
            // Hash the new password
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
            // Update the account's password
            account.password = hashedPassword;
            yield account.save();
            return { status: true, message: "Password updated successfully" };
        }
        catch (error) {
            return { status: false, message: "Error updating password" };
        }
    });
};
MerchantAccountsSchema.methods.getProfile = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                businessName: this.businessName,
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
MerchantAccountsSchema.index({ username: 1 }, { collation: { locale: "en", strength: 2 } });
const MerchantAccounts = mongoose_1.default.model("merchantAccounts", MerchantAccountsSchema);
exports.default = MerchantAccounts;
