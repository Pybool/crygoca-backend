"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTimeoutAutoCompleteWorker = void 0;
const connection_1 = __importDefault(require("../../../../redis/connection"));
const bullmq_1 = require("bullmq");
const notification_service_1 = require("../../notifications/notification.service");
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const redisConnection = connection_1.default.generic;
const startTimeoutAutoCompleteWorker = () => {
    const worker = new bullmq_1.Worker("timeout-order-autocomplete-queue", async (job) => {
        try {
            let listingPurchase = await listingPurchase_model_1.default.hydrate(job.data).populate("account");
            listingPurchase = await listingPurchase.populate("cryptoListing");
            if (listingPurchase) {
                listingPurchase.buyerFulfillmentClaim = "Completed";
                await listingPurchase.save();
                await notification_service_1.NotificationService.createOrderAutoCompletionNotification(listingPurchase);
            }
        }
        catch { }
    }, {
        connection: redisConnection,
    });
    worker.on("completed", (job) => {
        console.log(`✅ Job ${job.id} completed successfully.`);
    });
    worker.on("failed", (job, err) => {
        console.error(`❌ Job ${job.id} failed:`, err);
    });
};
exports.startTimeoutAutoCompleteWorker = startTimeoutAutoCompleteWorker;
