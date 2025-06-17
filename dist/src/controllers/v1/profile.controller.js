"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const profile_service_1 = require("../../services/v1/auth/profile.service");
exports.profileController = {
    _getUserProfile: async (req, res) => {
        try {
            const result = await profile_service_1.ProfileService.getUserProfile(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _saveBasicInfoAndPreferences: async (req, res) => {
        try {
            const result = await profile_service_1.ProfileService.saveBasicInfoAndPreferences(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _saveSinglePreference: async (req, res) => {
        try {
            const result = await profile_service_1.ProfileService.saveSinglePreference(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _reassignDeviceAuthorization: async (req, res) => {
        try {
            const result = await profile_service_1.ProfileService.reassignDeviceAuthorization(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword, confirmPassword } = req.body;
            const accountId = req.accountId;
            const result = await profile_service_1.ProfileService.changePassword(accountId, oldPassword, newPassword, confirmPassword);
            if (result.status) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _sendAddPasswordCode: async (req, res) => {
        try {
            const accountId = req.accountId;
            const result = await profile_service_1.ProfileService.sendAddPasswordCode(accountId);
            if (result.status) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _addPassword: async (req, res) => {
        try {
            const { otp, newPassword, confirmPassword } = req.body;
            const accountId = req.accountId;
            const result = await profile_service_1.ProfileService.addPassword(accountId, newPassword, confirmPassword, otp);
            if (result.status) {
                res.status(200).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    _uploadAvatar: async (req, res) => {
        try {
            let status = 400;
            const result = await profile_service_1.ProfileService.uploadAvatar(req);
            if (result)
                status = 200;
            return res.status(status).json(result);
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
