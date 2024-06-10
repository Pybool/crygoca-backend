"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
const jwthelper = {
    signAccessToken: (accountId, type = "") => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: "600s",
                issuer: process.env.ISSUER,
                audience: accountId,
            };
            jsonwebtoken_1.default.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    reject(http_errors_1.default.InternalServerError());
                    return;
                }
                resolve(token);
            });
        }).catch((error) => {
            console.log(error);
            throw error;
        });
    },
    verifyAccessToken: (req, res, next) => {
        try {
            if (!req.headers["authorization"])
                return next(http_errors_1.default.Unauthorized());
            const authHeader = req.headers["authorization"];
            const bearerToken = authHeader.split(" ");
            const token = bearerToken[1];
            jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
                if (err) {
                    const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
                    return next(http_errors_1.default.Unauthorized(message));
                }
                req.payload = payload;
                next();
            });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    },
    signRefreshToken: (accountId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: "72h",
                issuer: process.env.ISSUER,
                audience: accountId,
            };
            jsonwebtoken_1.default.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    reject(http_errors_1.default.InternalServerError());
                }
                resolve(token);
            });
        }).catch((error) => {
            console.log(error);
            throw error;
        });
    },
    verifyRefreshToken: (refreshToken, next) => {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if (err) {
                    const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
                    resolve({ aud: false });
                }
                console.log("===========> ", payload);
                resolve(payload);
            });
        }).catch((error) => {
            console.log(error);
            throw error;
        });
    },
};
exports.default = jwthelper;
