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
const messages_1 = __importDefault(require("../../helpers/messages"));
const auth_service_1 = require("../../services/v1/auth.service");
const authController = {
    register: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        let status = 200;
        try {
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.register();
            if (result.status) {
                status = 201;
                res.status(status).json(result);
            }
            else {
                console.log("result ", result);
                return res.status(200).json(result);
            }
        }
        catch (error) {
            console.log("Auth error ", error.message);
            if (error.isJoi === true) {
                error.status = 422;
            }
            res.status(status).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    sendPasswordResetLink: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.sendPasswordResetLink();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    }),
    sendEmailConfirmationOtp: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 200;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.sendEmailConfirmationOtp();
            if (!result.status)
                status = 400;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    }),
    resetPassword: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("reset password token ", req.query.token);
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.resetPassword();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            if (error.isJoi === true)
                error.status = 422;
            next(error);
        }
    }),
    verifyEmail: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.verifyEmail();
            if (result.status)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    }),
    login: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.login();
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
    }),
    getRefreshToken: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            if (req.body.refreshToken == "") {
                res.status(200).json({ status: false });
            }
            const result = yield authentication.getRefreshToken(next);
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    }),
    getUserProfile: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.getUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    }),
    saveUserProfile: (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let status = 400;
            const authentication = new auth_service_1.Authentication(req);
            const result = yield authentication.saveUserProfile();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    }),
};
exports.default = authController;
