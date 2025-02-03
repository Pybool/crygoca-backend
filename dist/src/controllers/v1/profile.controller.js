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
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const profile_service_1 = require("../../services/v1/auth/profile.service");
exports.profileController = {
    _getUserProfile: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield profile_service_1.ProfileService.getUserProfile(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _saveBasicInfoAndPreferences: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield profile_service_1.ProfileService.saveBasicInfoAndPreferences(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _saveSinglePreference: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield profile_service_1.ProfileService.saveSinglePreference(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _reassignDeviceAuthorization: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield profile_service_1.ProfileService.reassignDeviceAuthorization(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    _changePassword: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { oldPassword, newPassword, confirmPassword } = req.body;
            const accountId = req.accountId;
            const result = yield profile_service_1.ProfileService.changePassword(accountId, oldPassword, newPassword, confirmPassword);
            if (result.status) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
};
