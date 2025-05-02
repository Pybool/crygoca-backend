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
exports.MerchantAuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const accounts_merchant_model_1 = __importDefault(require("../../../models/accounts-merchant.model"));
const wallet_service_1 = require("../wallet/wallet.service");
const merchant_credentials_model_1 = __importDefault(require("../../../models/merchant-credentials.model"));
class MerchantAuthService {
    /**
     * Register a new merchant account
     * @param email - Merchant's email
     * @param password - Merchant's password
     * @param confirmPassword - Confirm password
     * @param businessName - Business name
     * @param phone - Merchant's phone number
     * @param username - Unique username
     * @param address - Business address
     * @param geoData - Business geodata
     */
    static register(_a) {
        return __awaiter(this, arguments, void 0, function* ({ email, password, confirmPassword, businessName, phone, username, address, geoData }) {
            try {
                // Check if email already exists
                const existingEmail = yield accounts_merchant_model_1.default.findOne({ email });
                if (existingEmail) {
                    return { status: false, message: "Email already exists" };
                }
                // Check if username already exists
                const existingUsername = yield accounts_merchant_model_1.default.findOne({ username });
                if (existingUsername) {
                    return { status: false, message: "Username already taken" };
                }
                // Check if passwords match
                if (password !== confirmPassword) {
                    return { status: false, message: "Passwords do not match" };
                }
                // Hash the password
                const salt = yield bcryptjs_1.default.genSalt(10);
                const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
                // Create a new merchant account
                const newMerchant = yield accounts_merchant_model_1.default.create({
                    email,
                    password: hashedPassword,
                    businessName,
                    phone,
                    username,
                    address,
                    isVerified: true, // Set default to false
                    walletCreated: false,
                    geoData,
                    createdAt: new Date()
                });
                const wallet = yield wallet_service_1.WalletService.createWallet(newMerchant._id, true);
                const merchantCredentials = yield merchant_credentials_model_1.default.create({ account: newMerchant._id });
                // Return success response
                return {
                    status: true,
                    message: "Merchant account registered successfully",
                    data: {
                        id: newMerchant._id,
                        email: newMerchant.email,
                        username: newMerchant.username,
                        businessName: newMerchant.businessName,
                        phone: newMerchant.phone,
                        address: newMerchant.address,
                        avatar: newMerchant.avatar,
                        createdAt: newMerchant.createdAt,
                        wallet,
                        merchantCredentials: {
                            account: merchantCredentials.account,
                            testPublicKey: merchantCredentials.testPublicKey,
                            testSecretKey: merchantCredentials.testSecretKey,
                            livePublicKey: merchantCredentials.livePublicKey,
                            liveSecretKey: "******************************", // Hide secret key
                            createdAt: merchantCredentials.createdAt,
                            updatedAt: merchantCredentials.updatedAt,
                        }
                    },
                };
            }
            catch (error) {
                console.error("Error registering merchant:", error);
                return { status: false, message: "Error registering merchant" };
            }
        });
    }
}
exports.MerchantAuthService = MerchantAuthService;
