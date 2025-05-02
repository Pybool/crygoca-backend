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
exports.NotificationService = void 0;
const socketsStore_service_1 = require("../sockets/socketsStore.service");
const notifications_model_1 = require("../../../models/notifications.model");
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const helpers_1 = require("../helpers");
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
    static createNewSellerPurchaseNotifications(listingPurchase) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            //Notification for seller
            const userId = listingPurchase.cryptoListing.account._id;
            const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
                tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
            });
            yield notifications_model_1.NotificationModel.create({
                user: userId,
                title: `You have a new order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}"`,
                message: `${listingPurchase.account.username} purchased ${listingPurchase.units} of ${listingPurchase.cryptoListing.cryptoName} at ${(_a = verifiedTransaction === null || verifiedTransaction === void 0 ? void 0 : verifiedTransaction.data) === null || _a === void 0 ? void 0 : _a.currency}${((_b = verifiedTransaction === null || verifiedTransaction === void 0 ? void 0 : verifiedTransaction.data) === null || _b === void 0 ? void 0 : _b.amount) || 'N/A'}`,
                createdAt: new Date(),
                status: "UNREAD",
                class: "info",
                meta: {
                    url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${listingPurchase._id}`,
                },
            });
            if (verifiedTransaction) {
                const email = listingPurchase.cryptoListing.account.email;
                const date = (0, helpers_1.formatTimestamp)(listingPurchase.createdAt);
                const data = {
                    checkOutId: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
                    cryptoName: listingPurchase.cryptoListing.cryptoName,
                    cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                    cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                    units: listingPurchase.units,
                    currency: (_d = (_c = listingPurchase.cryptoListing) === null || _c === void 0 ? void 0 : _c.currency) === null || _d === void 0 ? void 0 : _d.toUpperCase(),
                    amount: verifiedTransaction.data.amount,
                    walletAddress: listingPurchase.walletAddress,
                    buyerUserName: listingPurchase.account.username,
                    sellerUserName: listingPurchase.cryptoListing.account.username,
                    paymentOption: listingPurchase.paymentOption,
                    date,
                };
                mailservice_1.default.orders.sendSellerOrderReceivedMail(email, data);
            }
        });
    }
    static createNewBuyerPurchaseNotifications(listingPurchase) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            //Notification for buyer
            const userId = listingPurchase.account._id;
            yield notifications_model_1.NotificationModel.create({
                user: userId,
                title: `Your order ${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId} was successful`,
                message: `You order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was successful. The seller has been notified.`,
                createdAt: new Date(),
                status: "UNREAD",
                class: "success",
                meta: {
                    url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${listingPurchase._id}`,
                },
            });
            const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
                tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
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
                    checkOutId: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
                    cryptoName: listingPurchase.cryptoListing.cryptoName,
                    cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                    cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                    units: listingPurchase.units,
                    currency: (_b = (_a = listingPurchase.cryptoListing) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
                    amount: verifiedTransaction.data.amount,
                    walletAddress: listingPurchase.walletAddress,
                    buyerUserName: listingPurchase.account.username,
                    sellerUserName: listingPurchase.cryptoListing.account.username,
                    paymentOption: listingPurchase.paymentOption,
                    date,
                };
                mailservice_1.default.orders.sendBuyerOrderReceivedMail(email, data);
            }
        });
    }
    static createOrderAutoCompletionNotification(listingPurchase) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = listingPurchase.account._id;
            yield notifications_model_1.NotificationModel.create({
                user: userId,
                title: `Your order ${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId} was auto-completed`,
                message: `You order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was auto completed.`,
                createdAt: new Date(),
                status: "UNREAD",
                class: "success",
                meta: {
                    url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${listingPurchase._id}`,
                },
            });
            const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
                tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
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
                    checkOutId: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
                    cryptoName: listingPurchase.cryptoListing.cryptoName,
                    cryptoCode: listingPurchase.cryptoListing.cryptoCode,
                    cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
                    units: listingPurchase.units,
                    currency: (_b = (_a = listingPurchase.cryptoListing) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
                    amount: verifiedTransaction.data.amount,
                    walletAddress: listingPurchase.walletAddress,
                    buyerUserName: listingPurchase.account.username,
                    sellerUserName: listingPurchase.cryptoListing.account.username,
                    paymentOption: listingPurchase.paymentOption,
                    date,
                };
                mailservice_1.default.orders.sendOrderAutoCompletionMail(email, data);
            }
        });
    }
}
exports.NotificationService = NotificationService;
