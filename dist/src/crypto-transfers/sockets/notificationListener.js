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
exports.startEscrowPayoutNotificationListener = void 0;
const bullmq_1 = require("bullmq");
const socketsStore_service_1 = require("../../services/v1/sockets/socketsStore.service");
const startEscrowPayoutNotificationListener = () => {
    new bullmq_1.Worker("notification-queue", (job) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { userId, recipient, symbol, amount, txHash, status, error } = job.data;
            const payload = {
                recipient,
                symbol,
                amount,
                txHash,
                status,
                error,
            };
            const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
            if (socket) {
                console.log(`Socket for user ${userId} found`);
                console.log(`📣 Emitting notification for ${recipient}`);
                socket.emit("crypto-purchase-sent", JSON.stringify(payload));
            }
        }
        catch (error) {
            console.log(error);
        }
    }), {
        connection: {
            host: "127.0.0.1",
            port: 6379,
        },
    });
};
exports.startEscrowPayoutNotificationListener = startEscrowPayoutNotificationListener;
