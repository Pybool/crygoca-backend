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
exports.startTimeoutAutoCompleteWorker = void 0;
const connection_1 = __importDefault(require("../../../../redis/connection"));
const bullmq_1 = require("bullmq");
const notification_service_1 = require("../../notifications/notification.service");
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const redisConnection = connection_1.default.generic;
const startTimeoutAutoCompleteWorker = () => {
    const worker = new bullmq_1.Worker("timeout-order-autocomplete-queue", (job) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let listingPurchase = yield listingPurchase_model_1.default.hydrate(job.data).populate("account");
            listingPurchase = yield listingPurchase.populate("cryptoListing");
            if (listingPurchase) {
                listingPurchase.buyerFulfillmentClaim = "Completed";
                yield listingPurchase.save();
                yield notification_service_1.NotificationService.createOrderAutoCompletionNotification(listingPurchase);
            }
        }
        catch (_a) { }
    }), {
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
