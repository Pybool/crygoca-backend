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
exports.NotificationService = void 0;
const socketsStore_service_1 = require("../sockets/socketsStore.service");
const notifications_model_1 = require("../../../models/notifications.model");
class NotificationService {
    static sendNotificationToAdmins(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sockets = (0, socketsStore_service_1.getAllAdminProfileSockets)();
                if (sockets) {
                    console.log(sockets);
                    for (let socket of sockets) {
                        socket.emit("notifications", JSON.stringify(notification));
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static sendNotificationToUser(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
                if (socket) {
                    console.log(`Socket for user ${userId} found`);
                    socket.emit("notifications", JSON.stringify(data));
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static sendNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (notification) {
                    NotificationService.sendNotificationToAdmins(notification);
                    return { status: true, message: "Notification sent" };
                }
                else {
                    return {
                        status: false,
                        message: "No Notification was found that matches the id provided",
                    };
                }
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    static getNotifications(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10;
                const searchText = req.query.searchText || "";
                const accountId = req.accountId;
                const skip = (page - 1) * limit;
                // Build the query object
                const query = { user: accountId };
                // Add search text filtering if provided
                if (searchText) {
                    query.$or = [
                        { title: { $regex: searchText, $options: "i" } }, // Example field for text search
                        { message: { $regex: searchText, $options: "i" } }, // Adjust to match your schema
                        { status: { $regex: searchText, $options: "i" } },
                    ];
                }
                // Fetch paginated notifications
                const notifications = yield notifications_model_1.NotificationModel.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }); // Adjust sorting as per your requirement
                // Count total documents for pagination metadata
                const totalDocuments = yield notifications_model_1.NotificationModel.countDocuments(query);
                const unreadCount = yield notifications_model_1.NotificationModel.countDocuments(Object.assign(Object.assign({}, query), { status: "UNREAD" }));
                return {
                    status: true,
                    data: notifications,
                    pagination: {
                        page,
                        limit,
                        totalPages: Math.ceil(totalDocuments / limit),
                        totalDocuments,
                    },
                    unreadCount,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static markNotification(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { notificationId, status } = req.body;
                if (["READ", "UNREAD"].includes(status) == false) {
                    return {
                        status: false,
                        message: `Invalid notification status "${status}"`,
                    };
                }
                const notification = yield notifications_model_1.NotificationModel.findOne({
                    _id: notificationId,
                });
                if (!notification) {
                    return {
                        status: false,
                        message: `Failed to mark notification as ${status}`,
                    };
                }
                notification.status = status;
                yield notification.save();
                return {
                    status: true,
                    message: `Notification sucessfully marked as ${status}`,
                    data: notification,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.NotificationService = NotificationService;
