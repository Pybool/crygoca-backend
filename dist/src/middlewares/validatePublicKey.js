"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePublicKey = void 0;
const merchant_credentials_model_1 = __importDefault(require("../models/merchant-credentials.model"));
const validatePublicKey = async (req, res, next) => {
    try {
        const publicKey = req.headers["x-api-key"];
        if (!publicKey) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized: Missing public key (x-api-key)",
            });
        }
        const publicKeyPattern = /^(CRY-PUB-(LIVE|TEST)-)/;
        if (!publicKeyPattern.test(publicKey)) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid public key format",
            });
        }
        const keyType = publicKey.includes("LIVE") ? "live" : "test";
        const merchantCredentials = await merchant_credentials_model_1.default.findOne({
            [`${keyType}PublicKey`]: publicKey,
        });
        if (!merchantCredentials) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid public key",
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
exports.validatePublicKey = validatePublicKey;
