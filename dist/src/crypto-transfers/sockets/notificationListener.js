"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEscrowPayoutNotificationListener = void 0;
const bullmq_1 = require("bullmq");
const socketsStore_service_1 = require("../../services/v1/sockets/socketsStore.service");
const startEscrowPayoutNotificationListener = () => {
    new bullmq_1.Worker("notification-queue", async (job) => {
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
    }, {
        connection: {
            host: "127.0.0.1",
            port: 6379,
        },
    });
};
exports.startEscrowPayoutNotificationListener = startEscrowPayoutNotificationListener;
