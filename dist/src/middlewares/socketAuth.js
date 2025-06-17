"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
const mongoose_1 = require("mongoose");
const accounts_model_1 = __importDefault(require("../models/accounts.model"));
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env` });
async function authenticateToken(token) {
    try {
        const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        let user = await accounts_model_1.default.findOne({
            _id: new mongoose_1.Types.ObjectId(decoded.aud),
        });
        if (!user) {
            return {
                status: false,
                message: "No associated user was found for the jwt token",
            };
        }
        if (user) {
            return { status: true, user: user };
        }
        return { status: false };
    }
    catch (error) {
        console.log(error);
        return { status: false };
    }
}
const socketAuth = async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const deviceId = socket.handshake.auth.deviceId || socket.handshake.query.deviceId;
    ;
    if (!token && !deviceId) {
        console.log("Authentication error no token or deviceId in request");
        return next(new Error("Authentication error no token or deviceId in request"));
    }
    try {
        let result;
        if (token) {
            result = await authenticateToken(token);
        }
        else {
            result = { status: true, user: deviceId };
        }
        if (result.status) {
            socket.user = result?.user;
            socket.token = token || deviceId || undefined;
            next();
        }
        else {
            console.log("Error ", "Authentication error");
            next(new Error("Authentication error"));
        }
    }
    catch (error) {
        console.log("Error ", error);
        next(new Error("Authentication error"));
    }
};
exports.socketAuth = socketAuth;
