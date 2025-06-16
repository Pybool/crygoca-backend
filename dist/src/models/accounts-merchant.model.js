"use strict";
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
MerchantAccountsSchema.pre("save", async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(this.password, salt);
            this.password = hashedPassword;
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
MerchantAccountsSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcryptjs_1.default.compare(password, this.password);
    }
    catch (error) {
        throw error;
    }
};
MerchantAccountsSchema.statics.addPassword = async function (accountId, newPassword, confirmPassword) {
    try {
        // Fetch the account by ID
        const account = await this.findById(accountId);
        if (!account) {
            return { status: false, message: "Account not found" };
        }
        if (account?.password) {
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
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        // Update the account's password
        account.password = hashedPassword;
        await account.save();
        return { status: true, message: "Password created successfully" };
    }
    catch (error) {
        return { status: false, message: "Error updating password" };
    }
};
MerchantAccountsSchema.statics.changePassword = async function (accountId, oldPassword, newPassword, confirmPassword) {
    try {
        // Fetch the account by ID
        const account = await this.findById(accountId);
        if (!account) {
            return { status: false, message: "Account not found" };
        }
        // Compare old password
        try {
            const isMatch = await bcryptjs_1.default.compare(oldPassword, account.password);
            if (!isMatch) {
                return { status: false, message: "Incorrect old password" };
            }
        }
        catch {
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
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        // Update the account's password
        account.password = hashedPassword;
        await account.save();
        return { status: true, message: "Password updated successfully" };
    }
    catch (error) {
        return { status: false, message: "Error updating password" };
    }
};
MerchantAccountsSchema.methods.getProfile = async function () {
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
};
MerchantAccountsSchema.index({ username: 1 }, { collation: { locale: "en", strength: 2 } });
const MerchantAccounts = mongoose_1.default.model("merchantAccounts", MerchantAccountsSchema);
exports.default = MerchantAccounts;
