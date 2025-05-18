"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletNotificationService = void 0;
const notifications_model_1 = require("../../../models/notifications.model");
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const notification_service_1 = require("../notifications/notification.service");
const helpers_1 = require("../helpers");
class WalletNotificationService {
    static async createCreditNotification(wallet, walletTransaction, isReversal = false) {
        //Notification for credit alert
        if (typeof walletTransaction.user !== "object") {
            throw new Error("User is not populated!");
        }
        const reversalMsg = isReversal ? "reversal " : "";
        const user = walletTransaction.user;
        const notification = await notifications_model_1.NotificationModel.create({
            user: user?._id,
            title: `Credit Alert! ${user.geoData.currency.symbol}${walletTransaction.amount.toFixed(2)} ${reversalMsg} on your wallet`,
            message: `Hi ${user.firstname}\n\nWe wish to inform you that a ${reversalMsg}credit transaction occured on your wallet`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "success",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${walletTransaction._id}`,
            },
        });
        walletTransaction.createdAt = (0, helpers_1.formatTimestamp)(walletTransaction.createdAt);
        mailservice_1.default.wallet.sendCreditAlertMail(user.email, {
            walletTransaction,
            wallet,
        });
        WalletNotificationService.sendSocketNotification(user._id, {
            hasTransaction: true,
            walletTransaction,
            notification,
            wallet,
        });
        return notification;
    }
    static async createDebitNotification(wallet, walletTransaction, isReversal = false, pendingIncoming = false) {
        //Notification for debit alert
        if (typeof walletTransaction.user !== "object") {
            throw new Error("User is not populated!");
        }
        const reversalMsg = isReversal ? "reversal " : "";
        const user = walletTransaction.user;
        const notification = await notifications_model_1.NotificationModel.create({
            user: user._id,
            title: `Debit Alert! ${user.geoData.currency.symbol}${walletTransaction.amount.toFixed(2)} ${reversalMsg} on your wallet`,
            message: `Hi ${user.firstname}\n\nWe wish to inform you that a ${reversalMsg}debit transaction occured on your wallet`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "error",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${walletTransaction._id}`,
            },
        });
        walletTransaction.createdAt = (0, helpers_1.formatTimestamp)(walletTransaction.createdAt);
        if (!pendingIncoming) {
            mailservice_1.default.wallet.sendDebitAlertMail(user.email, {
                walletTransaction,
                wallet,
            });
        }
        else {
            mailservice_1.default.wallet.sendPaymentDebitAlertMail(user.email, {
                walletTransaction,
                wallet,
            });
        }
        await WalletNotificationService.sendSocketNotification(user._id, {
            hasTransaction: true,
            walletTransaction,
            notification,
            wallet,
        });
        return notification;
    }
    static async createIncomingPaymentNotification(receiverWallet, walletIncomingPayment) {
        const user = receiverWallet.user;
        const notification = await notifications_model_1.NotificationModel.create({
            user: user._id,
            title: `Pending Incoming Payment! ${user.geoData.currency.symbol}${walletIncomingPayment.amount.toFixed(2)} on your wallet`,
            message: `Hi ${user.firstname}\n\nWe wish to inform you that you have a pending incoming payment for order ${walletIncomingPayment.checkOutId}`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "success",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${walletIncomingPayment._id}`,
            },
        });
        walletIncomingPayment.createdAt = (0, helpers_1.formatTimestamp)(walletIncomingPayment.createdAt.toString());
        mailservice_1.default.wallet.sendPendingIncomingPaymentMail(user.email, {
            walletIncomingPayment,
            receiverWallet,
        });
        // WalletNotificationService.sendSocketNotification(user._id, {
        //   hasTransaction: true,
        //   walletIncomingPayment,
        //   notification,
        //   receiverWallet,
        // });
        return notification;
    }
    static async createExternalPaymentCreditNotification(wallet, walletTransaction, isReversal = false) {
        //Notification for credit alert
        if (typeof walletTransaction.user !== "object") {
            throw new Error("User is not populated!");
        }
        const reversalMsg = isReversal ? "reversal " : "";
        const user = walletTransaction.user;
        const notification = await notifications_model_1.NotificationModel.create({
            user: user?._id,
            title: `Credit Alert! ${user.geoData.currency.symbol}${walletTransaction.amount.toFixed(2)} ${reversalMsg} on your wallet`,
            message: `Hi ${user.firstname}\n\nWe wish to inform you that a ${reversalMsg}wallet payment was deposited into your merchant account.`,
            createdAt: new Date(),
            status: "UNREAD",
            class: "success",
            meta: {
                url: `${process.env.CRYGOCA_FRONTEND_BASE_URL}/notifications?uid=${walletTransaction._id}`,
            },
        });
    }
    static async sendSocketNotification(accountId, data) {
        await notification_service_1.NotificationService.sendNotificationToUser(accountId.toString(), data);
    }
}
exports.WalletNotificationService = WalletNotificationService;
