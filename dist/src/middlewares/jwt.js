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
exports.verifyGoogleToken = exports.ensureAdmin = exports.decodeExt = exports.decode = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
        return next();
    }
    catch (error) {
        return next();
    }
};
exports.decodeExt = decodeExt;
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
// Middleware to verify the Google ID token
function verifyGoogleToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const idToken = req.body.idToken;
        if (!idToken) {
            return res.status(400).send({ error: "ID Token is required" });
        }
        try {
            const ticket = yield client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            console.log("Payload ===> ", payload);
            req.user = {
                email: payload.email,
                fullname: payload.name,
                avatar: payload.picture,
                googleId: payload.sub,
                firstname: payload.given_name,
                lastname: payload.family_name
            };
            next();
        }
        catch (error) {
            res.status(401).send({ error: "Invalid ID Token" });
        }
    });
}
exports.verifyGoogleToken = verifyGoogleToken;
