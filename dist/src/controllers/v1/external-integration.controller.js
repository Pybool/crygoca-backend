"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNewCredentials = exports.createMerchantAccount = void 0;
const accounts_merchant_model_1 = __importDefault(require("../../models/accounts-merchant.model"));
const credentials_1 = require("../../services/v1/externalIntegration/credentials");
const merchant_credentials_model_1 = __importDefault(require("../../models/merchant-credentials.model"));
const accounts_service_1 = require("../../services/v1/externalIntegration/accounts.service");
const createMerchantAccount = async (req, res) => {
    try {
        const payload = req.body;
        const response = await accounts_service_1.MerchantAuthService.register(payload);
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
exports.createMerchantAccount = createMerchantAccount;
const generateNewCredentials = async (req, res) => {
    try {
        const merchantAccountId = req.merchantAccountId;
        // Validate if account exists
        const account = await accounts_merchant_model_1.default.findById(merchantAccountId);
        if (!account) {
            return res.status(400).json({
                status: false,
                message: "No account found for business",
            });
        }
        // Generate new keys
        const newCredentials = {
            testPublicKey: (0, credentials_1.generateKeys)("public", "test"),
            testSecretKey: (0, credentials_1.generateKeys)("secret", "test"),
            livePublicKey: (0, credentials_1.generateKeys)("public", "live"),
            liveSecretKey: (0, credentials_1.generateKeys)("secret", "live"),
        };
        // Find and update or create a new entry
        const merchantCredentials = await merchant_credentials_model_1.default.findOneAndUpdate({ account: merchantAccountId }, {
            ...newCredentials,
            account: merchantAccountId
        }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Mask live secret key before sending response
        return res.status(200).json({
            status: true,
            message: "Credentials generated successfully",
            data: {
                account: merchantCredentials.account,
                testPublicKey: merchantCredentials.testPublicKey,
                testSecretKey: merchantCredentials.testSecretKey,
                livePublicKey: merchantCredentials.livePublicKey,
                liveSecretKey: "******************************", // Hide secret key
                createdAt: merchantCredentials.createdAt,
                updatedAt: merchantCredentials.updatedAt,
            },
        });
    }
    catch (error) {
        console.error("Error generating credentials:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};
exports.generateNewCredentials = generateNewCredentials;
