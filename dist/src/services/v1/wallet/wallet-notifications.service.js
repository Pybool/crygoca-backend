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
exports.WalletNotificationService = void 0;
const notifications_model_1 = require("../../../models/notifications.model");
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const notification_service_1 = require("../notifications/notification.service");
const helpers_1 = require("../helpers");
class WalletNotificationService {
    static createCreditNotification(wallet_1, walletTransaction_1) {
        return __awaiter(this, arguments, void 0, function* (wallet, walletTransaction, isReversal = false) {
            //Notification for credit alert
            if (typeof walletTransaction.user !== "object") {
                throw new Error("User is not populated!");
            }
            const reversalMsg = isReversal ? "reversal " : "";
            const user = walletTransaction.user;
            const notification = yield notifications_model_1.NotificationModel.create({
                user: user._id,
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
            mailservice_1.default.wallet.sendCreditAlertMail(user.email, { walletTransaction, wallet });
            WalletNotificationService.sendSocketNotification(user._id, {
                hasTransaction: true,
                walletTransaction,
                notification,
                wallet
            });
            return notification;
        });
    }
    static createDebitNotification(wallet_1, walletTransaction_1) {
        return __awaiter(this, arguments, void 0, function* (wallet, walletTransaction, isReversal = false) {
            //Notification for debit alert
            if (typeof walletTransaction.user !== "object") {
                throw new Error("User is not populated!");
            }
            const reversalMsg = isReversal ? "reversal " : "";
            const user = walletTransaction.user;
            const notification = yield notifications_model_1.NotificationModel.create({
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
            mailservice_1.default.wallet.sendDebitAlertMail(user.email, { walletTransaction, wallet });
            yield WalletNotificationService.sendSocketNotification(user._id, {
                hasTransaction: true,
                walletTransaction,
                notification,
                wallet
            });
            return notification;
        });
    }
    static sendSocketNotification(accountId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield notification_service_1.NotificationService.sendNotificationToUser(accountId.toString(), data);
        });
    }
}
exports.WalletNotificationService = WalletNotificationService;
