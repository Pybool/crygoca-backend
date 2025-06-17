"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEscrowBalanceWorker = void 0;
// escrow-balance-worker.ts
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("../redisConnection");
const escrow_utils_1 = require("../services/escrow-utils");
const notify_ui_1 = require("../services/notify-ui");
const startEscrowBalanceWorker = () => {
    new bullmq_1.Worker("escrow-balance-queue", async (job) => {
        const { buyerId, escrowId, amount, metaData } = job.data;
        switch (job.name) {
            case "lockEscrowFunds":
                const data = await (0, escrow_utils_1.lockEscrowFunds)(escrowId, amount, metaData);
                if (data)
                    (0, notify_ui_1.sendLockedOrderNotification)(buyerId, data);
                break;
            case "topUpEscrow":
                const topupData = await (0, escrow_utils_1.topUpEscrow)(escrowId, amount);
                if (topupData)
                    (0, notify_ui_1.sendTopUpNotification)(buyerId, topupData);
                break;
            case "dispenseLockedFunds":
                await (0, escrow_utils_1.dispenseLockedFunds)(escrowId, amount);
                break;
            case "releaseLockedFunds":
                const escrow = await (0, escrow_utils_1.releaseLockedFunds)(escrowId, amount, metaData.checkOutId);
                if (escrow)
                    (0, notify_ui_1.sendReleaseLockedFundsNotification)(buyerId, escrow);
                break;
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }, { connection: redisConnection_1.connection });
};
exports.startEscrowBalanceWorker = startEscrowBalanceWorker;
