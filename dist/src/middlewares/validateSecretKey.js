"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSecretKey = void 0;
const merchant_credentials_model_1 = __importDefault(require("../models/merchant-credentials.model"));
const validateSecretKey = async (req, res, next) => {
    try {
        const authHeader = req.headers['x-api-key'];
        if (!authHeader) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized: Missing secret key (x-api-key)",
            });
        }
        const secretKey = authHeader;
        const keyPattern = /^(CRY-SEC-(LIVE|TEST)-)/;
        if (!keyPattern.test(secretKey)) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid secret key format",
            });
        }
        const keyType = secretKey.includes("LIVE") ? "live" : "test";
        const merchantCredentials = await merchant_credentials_model_1.default.findOne({
            [`${keyType}SecretKey`]: secretKey,
        });
        if (!merchantCredentials) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid secret key",
            });
        }
        req.merchantCredentials = merchantCredentials;
        next();
    }
    catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
exports.validateSecretKey = validateSecretKey;
