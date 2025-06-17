"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const withdrawals_status_queue_1 = require("../../wallet/withdrawals-status.queue");
const transfers_handlers_1 = require("../../wallet/transfers.handlers");
const events_1 = require("events");
const wallet_service_1 = require("../../wallet/wallet.service");
const redisConnection = connection_1.default.generic;
const eventEmitter = new events_1.EventEmitter();
const queueName = "withdrawal-event-status";
const withdrawalQueue = new withdrawals_status_queue_1.WithdrawalStatusQueue();
// Maintain failure count in-memory (or use a database/Redis for persistence)
const failureCounts = {};
// Start listening to queue events
const withdrawalEventQueue = new bullmq_1.Queue(queueName, {
    connection: redisConnection,
});
// Worker to process jobs
const worker = new bullmq_1.Worker(queueName, async () => {
    const size = await withdrawalQueue.size();
    console.log(`Queue size: ${size}`);
    while ((await withdrawalQueue.size()) > 0) {
        const transactionData = await withdrawalQueue.peek();
        if (transactionData) {
            try {
                const parsedData = JSON.parse(transactionData);
                // Process the transaction (e.g., update database, notify users)
                //   console.log("Processing transaction:", parsedData);
                const transferRespponse = await (0, transfers_handlers_1.getTransfer)(parsedData?.queuedResponse?.data?.id);
                if (process.env.NODE_ENV == undefined ||
                    process.env.NODE_ENV == "dev") {
                    transferRespponse.data.status = "SUCCESS";
                }
                console.log("transferRespponse ===> ", transferRespponse);
                if (transferRespponse?.data?.status === "SUCCESS") {
                    // Emit an event to update the database
                    eventEmitter.emit("updateRecord", {
                        initialPayload: parsedData,
                        transferRespponse,
                    });
                    await withdrawalQueue.removeFirst();
                }
                else if (transferRespponse?.data?.status === "FAILED" &&
                    transferRespponse?.data?.complete_message.includes("Insufficient funds in customer balance")) {
                    eventEmitter.emit("reportInsufficientMerchantBalance", transferRespponse);
                    // return null; // Skip further processing for this case
                }
                if (transferRespponse?.data?.status === "FAILED" ||
                    transferRespponse?.data?.status === "PENDING") {
                    // Increment failure count for this job
                    const jobId = parsedData?.queuedResponse?.data?.id;
                    failureCounts[jobId] = (failureCounts[jobId] || 0) + 1;
                    // Check if the job has failed twice
                    if (failureCounts[jobId] >= 2) {
                        console.error(`Job ${jobId} failed twice. Emitting failed event and removing from queue.`);
                        // Emit a failed event
                        eventEmitter.emit("jobFailed", parsedData);
                        // Remove the job from the queue
                        await withdrawalQueue.removeFirst();
                        // Clean up failure count record
                        delete failureCounts[jobId];
                    }
                    else {
                        console.warn(`Job ${jobId} failed ${failureCounts[jobId]} times. Retrying...`);
                    }
                }
            }
            catch (error) {
                console.error("Error processing transaction:", error);
            }
        }
    }
}, {
    concurrency: 10,
    connection: redisConnection,
});
// Recursive periodic check
const PERIODIC_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds
async function checkWithdrawalQueuePeriodically() {
    try {
        console.log("Checking withdrawal queue for jobs...");
        const size = await withdrawalQueue.size();
        if (size > 0) {
            console.log(`Found ${size} jobs in the queue. Starting worker...`);
            // Add a dummy job to the BullMQ queue to trigger the worker
            await withdrawalEventQueue.add("check-queue", {});
        }
        else {
            console.log("No jobs found in the queue.");
        }
    }
    catch (error) {
        console.error("Error during periodic queue check:", error);
    }
    finally {
        // Schedule the next execution
        setTimeout(checkWithdrawalQueuePeriodically, PERIODIC_INTERVAL);
    }
}
// Start the periodic execution
checkWithdrawalQueuePeriodically();
worker.on("completed", (job) => {
    console.log(`Processed job with ID: ${job.id}`);
});
worker.on("failed", (job, err) => {
    console.error(`Job with ID ${job.id} failed: ${err.message}`);
});
// Listener for database updates
eventEmitter.on("updateRecord", async (data) => {
    try {
        await wallet_service_1.WalletService.updateWithdrawalStatus(data);
    }
    catch (error) {
        console.error("Failed to update record:", error);
    }
});
// Listener for failed jobs
eventEmitter.on("jobFailed", (data) => {
    console.log(`Job with ID ${data?.queuedResponse?.data?.id} has failed twice and has been removed from the queue.`
    // Optionally log or notify about the failure
    );
});
// Listener for merchant insufficient balance
eventEmitter.on("reportInsufficientMerchantBalance", (data) => {
    console.log(`Merchant has insufficient balance`
    // Optionally log or notify about the failure
    );
});
