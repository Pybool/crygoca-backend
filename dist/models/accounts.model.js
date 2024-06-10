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
        required: true,
    },
    email_confirmed: {
        type: Boolean,
        required: true,
        default: false
    },
    firstname: {
        type: String,
        required: false,
        default: ''
    },
    surname: {
        type: String,
        required: false,
        default: ''
    },
    othername: {
        type: String,
        required: false,
        default: ''
    },
    username: {
        type: String,
        required: false,
        default: ''
    },
    phone: {
        type: String,
        required: false,
        default: ''
    },
    address: {
        type: String,
        required: false,
        default: ''
    },
    avatar: {
        type: String,
        required: false,
        default: '/assets/images/anon.png'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    reset_password_token: {
        type: String,
        required: false,
        default: ''
    },
    reset_password_expires: {
        type: Date,
        required: false,
    },
});
AccountsSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isNew) {
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(this.password, salt);
                this.password = hashedPassword;
                this.username = 'User ' + this._id;
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
AccountsSchema.methods.getProfile = function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                firstname: this.firstname,
                surname: this.surname,
                othername: this.othername,
                email: this.email,
                phone: this.phone,
                username: this.username,
                isAdmin: this.isAdmin,
                avatar: this.avatar,
                address: this.address
            };
        }
        catch (error) {
            throw error;
        }
    });
};
const Accounts = mongoose_1.default.model('accounts', AccountsSchema);
exports.default = Accounts;
