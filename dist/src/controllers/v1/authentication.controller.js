"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = __importDefault(require("../../helpers/messages"));
const auth_service_1 = require("../../services/v1/auth/auth.service");
const authController = {
    register: async (req, res, next) => {
        let status = 200;
        try {
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.register();
            if (result.status) {
                status = 201;
                res.status(status).json(result);
            }
            else {
                return res.status(200).json(result);
            }
        }
        catch (error) {
            if (error.isJoi === true) {
                error.status = 422;
            }
            res.status(status).json({ status: false, message: error?.message });
        }
    },
    sendPasswordResetOtp: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.sendPasswordResetOtp();
            status = 200;
            res.status(status).json({ status: true });
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    sendEmailConfirmationOtp: async (req, res, next) => {
        try {
            let status = 200;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.sendEmailConfirmationOtp();
            if (!result.status)
                status = 400;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    verifyPasswordResetOtp: async (req, res, next) => {
        try {
            let status = 200;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.verifyPasswordResetOtp();
            if (!result.status)
                status = 400;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.resetPassword();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    },
    verifyEmail: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.verifyEmail();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    login: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.login();
            status = 200;
            return res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true) {
                res
                    .status(400)
                    .json({ status: false, message: messages_1.default.auth.invalidCredentials });
            }
            else {
                res
                    .status(400)
                    .json({ status: false, message: "Could not process login request!" });
            }
        }
    },
    checkUserName: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.checkUserName();
            status = 200;
            return res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true) {
                res
                    .status(400)
                    .json({ status: false, message: "" });
            }
            else {
                res
                    .status(400)
                    .json({ status: false, message: "Could not process request!" });
            }
        }
    },
    getRefreshToken: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            if (req.body.refreshToken == "") {
                res.status(200).json({ status: false });
            }
            const result = await authentication.getRefreshToken(next);
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    getUserProfile: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.getUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    saveUserProfile: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.saveUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    resendtwoFaLoginOtp: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.resendtwoFaLoginOtp();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    twofaSignInVerification: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.twofaSignInVerification();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
    getUser: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = await authentication.getUser();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
};
exports.default = authController;
