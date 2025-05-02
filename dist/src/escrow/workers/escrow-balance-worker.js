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
exports.startEscrowBalanceWorker = void 0;
// escrow-balance-worker.ts
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("../redisConnection");
const escrow_utils_1 = require("../services/escrow-utils");
const notify_ui_1 = require("../services/notify-ui");
const startEscrowBalanceWorker = () => {
    new bullmq_1.Worker("escrow-balance-queue", (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { buyerId, escrowId, amount, metaData } = job.data;
        switch (job.name) {
            case "lockEscrowFunds":
                const data = yield (0, escrow_utils_1.lockEscrowFunds)(escrowId, amount, metaData);
                if (data)
                    (0, notify_ui_1.sendLockedOrderNotification)(buyerId, data);
                break;
            case "topUpEscrow":
                yield (0, escrow_utils_1.topUpEscrow)(escrowId, amount);
                break;
            case "dispenseLockedFunds":
                yield (0, escrow_utils_1.dispenseLockedFunds)(escrowId, amount);
                break;
            case "releaseLockedFunds":
                yield (0, escrow_utils_1.releaseLockedFunds)(escrowId, amount);
                break;
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }), { connection: redisConnection_1.connection });
};
exports.startEscrowBalanceWorker = startEscrowBalanceWorker;
