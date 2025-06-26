"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = exports.ensureAdmin = exports.decodeMerchant = exports.decodeExt = exports.decode = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const accounts_model_1 = __importDefault(require("../models/accounts.model"));
const accounts_merchant_model_1 = __importDefault(require("../models/accounts-merchant.model"));
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET || "";
const decode = (req, res, next) => {
    const reqHeaders = req.headers;
    if (!reqHeaders["authorization"]) {
        return res
            .status(400)
            .json({ success: false, message: "No access token provided" });
    }
    const accessToken = reqHeaders.authorization.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, SECRET_KEY);
        req.accountId = decoded.aud;
        updateLastSeen(req.accountId);
        return next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
};
exports.decode = decode;
const decodeExt = (req, res, next) => {
    const reqHeaders = req.headers;
    if (!reqHeaders["authorization"]) {
        return next();
    }
    const accessToken = reqHeaders.authorization.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, SECRET_KEY);
        req.accountId = decoded.aud;
        updateLastSeen(req.accountId);
        return next();
    }
    catch (error) {
        return next();
    }
};
exports.decodeExt = decodeExt;
const decodeMerchant = async (req, res, next) => {
    const reqHeaders = req.headers;
    if (!reqHeaders["authorization"]) {
        return res
            .status(400)
            .json({ success: false, message: "No access token provided" });
    }
    const accessToken = reqHeaders.authorization.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(accessToken, SECRET_KEY);
        req.merchantAccountId = decoded.aud;
        const merchantAccount = await accounts_merchant_model_1.default.findOne({
            _id: req.merchantAccountId,
        });
        if (merchantAccount && merchantAccount.isVerified) {
            next();
        }
        else {
            res
                .status(403)
                .json({
                message: "Forbidden: Account is not a verified merchant account",
            });
        }
    }
    catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
};
exports.decodeMerchant = decodeMerchant;
function ensureAdmin(req, res, next) {
    const account = req.account;
    if (account && account.admin) {
        next();
    }
    else {
        res.status(403).json({ message: "Forbidden: Account is not an admin" });
    }
}
exports.ensureAdmin = ensureAdmin;
async function updateLastSeen(accountId) {
    await accounts_model_1.default.findByIdAndUpdate(accountId, { lastSeen: new Date() });
}
// Middleware to verify the Google ID token
async function verifyGoogleToken(req, res, next) {
    const idToken = req.body.idToken;
    if (!idToken) {
        return res.status(400).send({ error: "ID Token is required" });
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        req.user = {
            email: payload.email,
            fullname: payload.name,
            avatar: payload.picture,
            googleId: payload.sub,
            firstname: payload.given_name,
            lastname: payload.family_name,
        };
        next();
    }
    catch (error) {
        res.status(401).send({ error: "Invalid ID Token" });
    }
}
exports.verifyGoogleToken = verifyGoogleToken;
