"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const socketsStore_service_1 = require("../sockets/socketsStore.service");
const notifications_model_1 = require("../../../models/notifications.model");
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const helpers_1 = require("../helpers");
class NotificationService {
    static async sendNotificationToAdmins(notification) {
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
    }
    static async sendNotificationToUser(userId, data) {
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
    }
    static async sendNotification(notification) {
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
    }
    static async getNotifications(req) {
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
            const notifications = await notifications_model_1.NotificationModel.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }); // Adjust sorting as per your requirement
            // Count total documents for pagination metadata
            const totalDocuments = await notifications_model_1.NotificationModel.countDocuments(query);
            const unreadCount = await notifications_model_1.NotificationModel.countDocuments({
                ...query,
                status: "UNREAD",
            });
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
    }
    static async markNotification(req) {
        try {
            const { notificationId, status } = req.body;
            if (["READ", "UNREAD"].includes(status) == false) {
                return {
                    status: false,
                    message: `Invalid notification status "${status}"`,
                };
            }
            const notification = await notifications_model_1.NotificationModel.findOne({
                _id: notificationId,
            });
            if (!notification) {
                return {
                    status: false,
                    message: `Failed to mark notification as ${status}`,
                };
            }
            notification.status = status;
            await notification.save();
            return {
                status: true,
                message: `Notification sucessfully marked as ${status}`,
                data: notification,
            };
        }
        catch (error) {
            throw error;
        }
    }
    static async createNewSellerPurchaseNotifications(listingPurchase) {
        //Notification for seller
        const userId = listingPurchase.cryptoListing.account._id;
        const verifiedTransaction = await verifiedtransactions_model_1.default.findOne({
            tx_ref: listingPurchase?.checkOutId,
        });
        await notifications_model_1.NotificationModel.create({
            user: userId,
            title: `You have a new order "${listingPurchase?.checkOutId}"`,
            message: `${listingPurchase.account.username} purchased ${listingPurchase.units} of ${listingPurchase.cryptoListing.cryptoName} at ${verifiedTransaction?.data?.currency}${verifiedTransaction?.data?.amount || 'N/A'}`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "info",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}notifications?uid=${listingPurchase._id}`,
            },
        });
        if (verifiedTransaction) {
            const email = listingPurchase.cryptoListing.account.email;
            const date = (0, helpers_1.formatTimestamp)(listingPurchase.createdAt);
            const data = {
                checkOutId: listingPurchase?.checkOutId,
                cryptoName: listingPurchase.cryptoListing.cryptoName,
                cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                units: listingPurchase.units,
                currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
                amount: verifiedTransaction.data.amount,
                walletAddress: listingPurchase.walletAddress,
                buyerUserName: listingPurchase.account.username,
                sellerUserName: listingPurchase.cryptoListing.account.username,
                paymentOption: listingPurchase.paymentOption,
                date,
            };
            mailservice_1.default.orders.sendSellerOrderReceivedMail(email, data);
        }
    }
    static async createNewBuyerPurchaseNotifications(listingPurchase) {
        //Notification for buyer
        const userId = listingPurchase.account._id;
        await notifications_model_1.NotificationModel.create({
            user: userId,
            title: `Your order ${listingPurchase?.checkOutId} was successful`,
            message: `You order "${listingPurchase?.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was successful. The seller has been notified.`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "success",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}notifications?uid=${listingPurchase._id}`,
            },
        });
        const verifiedTransaction = await verifiedtransactions_model_1.default.findOne({
            tx_ref: listingPurchase?.checkOutId,
        });
        if (verifiedTransaction) {
            const email = listingPurchase.account.email;
            const date = listingPurchase.createdAt.toLocaleString("en-US", {
                weekday: "long", // "Monday"
                year: "numeric", // "2024"
                month: "long", // "December"
                day: "numeric", // "1"
                hour: "2-digit", // "08"
                minute: "2-digit", // "45"
                second: "2-digit", // "32"
                hour12: true, // 12-hour format with AM/PM
            });
            const data = {
                checkOutId: listingPurchase?.checkOutId,
                cryptoName: listingPurchase.cryptoListing.cryptoName,
                cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                units: listingPurchase.units,
                currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
                amount: verifiedTransaction.data.amount,
                walletAddress: listingPurchase.walletAddress,
                buyerUserName: listingPurchase.account.username,
                sellerUserName: listingPurchase.cryptoListing.account.username,
                paymentOption: listingPurchase.paymentOption,
                date,
            };
            mailservice_1.default.orders.sendBuyerOrderReceivedMail(email, data);
        }
    }
    static async createOrderAutoCompletionNotification(listingPurchase) {
        const userId = listingPurchase.account._id;
        await notifications_model_1.NotificationModel.create({
            user: userId,
            title: `Your order ${listingPurchase?.checkOutId} was auto-completed`,
            message: `You order "${listingPurchase?.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was auto completed.`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "success",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}notifications?uid=${listingPurchase._id}`,
            },
        });
        const verifiedTransaction = await verifiedtransactions_model_1.default.findOne({
            tx_ref: listingPurchase?.checkOutId,
        });
        if (verifiedTransaction) {
            const email = listingPurchase.account.email;
            const date = listingPurchase.createdAt.toLocaleString("en-US", {
                weekday: "long", // "Monday"
                year: "numeric", // "2024"
                month: "long", // "December"
                day: "numeric", // "1"
                hour: "2-digit", // "08"
                minute: "2-digit", // "45"
                second: "2-digit", // "32"
                hour12: true, // 12-hour format with AM/PM
            });
            const data = {
                checkOutId: listingPurchase?.checkOutId,
                cryptoName: listingPurchase.cryptoListing.cryptoName,
                cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                units: listingPurchase.units,
                currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
                amount: verifiedTransaction.data.amount,
                walletAddress: listingPurchase.walletAddress,
                buyerUserName: listingPurchase.account.username,
                sellerUserName: listingPurchase.cryptoListing.account.username,
                paymentOption: listingPurchase.paymentOption,
                date,
            };
            mailservice_1.default.orders.sendOrderAutoCompletionMail(email, data);
        }
    }
}
exports.NotificationService = NotificationService;
