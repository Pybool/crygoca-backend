"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWalletWithdrawalJob = exports.getQueueJobsByStatus = exports.addWalletBalanceUpdateJob = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const wallet_service_1 = require("../../wallet/wallet.service");
const redisConnection = connection_1.default.generic;
// Define the wallet queue
const walletQueue = new bullmq_1.Queue("wallet-operations", {
    connection: redisConnection,
});
// Listen to queue events (optional, for debugging and monitoring)
const queueEvents = new bullmq_1.QueueEvents("wallet-operations", {
    connection: redisConnection,
});
queueEvents.on("completed", ({ jobId }) => {
    console.log(`Job ${jobId} completed successfully.`);
});
queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`Job ${jobId} failed with reason: ${failedReason}`);
});
// Add a job to the queue for wallet operations
async function addWalletBalanceUpdateJob(type, amount, meta, transferId, // Concantenation of wallets AccountNo
debitDetails, creditDetails, saveBeneficiary) {
    await walletQueue.add(type, {
        type,
        amount,
        meta,
        debitDetails,
        creditDetails,
        transferId,
        saveBeneficiary,
    });
    console.log("Wallet job added to the queue.");
}
exports.addWalletBalanceUpdateJob = addWalletBalanceUpdateJob;
async function getQueueJobsByStatus(status = "failed", uuid = null) {
    try {
        const existingJobs = await walletQueue.getJobs([status]);
        if (!uuid) {
            return existingJobs;
        }
        else {
            const duplicateJob = existingJobs.find((job) => job.data?.meta?.verifiedTransactionId === uuid);
            return duplicateJob;
        }
    }
    catch {
        return null;
    }
}
exports.getQueueJobsByStatus = getQueueJobsByStatus;
// Add a job to the queue for wallet operations
async function addWalletWithdrawalJob(type, data, hash, accountId) {
    await walletQueue.add(type, {
        type,
        withdrawalData: data,
        hash,
        accountId,
    });
    console.log("Wallet withdrawal job added to the queue.");
}
exports.addWalletWithdrawalJob = addWalletWithdrawalJob;
// Define a worker to process wallet jobs
const worker = new bullmq_1.Worker("wallet-operations", async (job) => {
    const { debitDetails, creditDetails, amount, meta, type, saveBeneficiary, withdrawalData, hash, accountId, } = job.data;
    if (type === "wallet-to-bank-withdrawal") {
        return await wallet_service_1.WalletService.processToLocalBankWithdrawal(type, withdrawalData, hash, accountId);
    }
    else {
        await wallet_service_1.WalletService.updateWalletBalance(type, amount, meta, debitDetails, creditDetails, saveBeneficiary);
    }
}, {
    concurrency: 5, // Number of jobs to process concurrently
    connection: redisConnection, // Redis connection details
});
worker.on("completed", (job) => {
    console.log(`Processed job with ID: ${job.id}`);
});
worker.on("failed", (job, err) => {
    console.error(`Job with ID ${job.id} failed: ${err.message}`);
});
