"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../../middlewares/jwt");
const notification_service_1 = require("../../services/v1/notifications/notification.service");
const notificationRouter = express_1.default.Router();
notificationRouter.get("/fetch-notifications", jwt_1.decode, async (req, res) => {
    try {
        const result = await notification_service_1.NotificationService.getNotifications(req);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error?.message,
        });
    }
});
notificationRouter.put("/mark-notification", jwt_1.decode, async (req, res) => {
    try {
        const result = await notification_service_1.NotificationService.markNotification(req);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification",
            error: error?.message,
        });
    }
});
exports.default = notificationRouter;
