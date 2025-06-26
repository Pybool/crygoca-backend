"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("../../../../redis/connection"));
const bullmq_1 = require("bullmq");
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const accounts_model_1 = __importDefault(require("../../../../models/accounts.model"));
const notification_service_1 = require("../../notifications/notification.service");
const saleListing_model_1 = __importDefault(require("../../../../models/saleListing.model"));
const redisConnection = connection_1.default.generic;
const worker = new bullmq_1.Worker("payment-verification-queue", async (job) => {
    const { tx_ref } = job.data;
    let listingPurchase = await listingPurchase_model_1.default.findOne({
        checkOutId: tx_ref,
    })
        .populate("account")
        .populate("cryptoListing");
    if (listingPurchase) {
        listingPurchase.paymentConfirmed = true;
        listingPurchase.fulfillmentStatus = "Pending";
        await listingPurchase.save();
        // Update cryptoListing units
        if (listingPurchase.cryptoListing) {
            const cryptoListing = await saleListing_model_1.default.findById(listingPurchase.cryptoListing._id);
            if (cryptoListing) {
                cryptoListing.units -= listingPurchase.units; // Deduct purchased units
                await cryptoListing.save();
            }
        }
        listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
        listingPurchase.cryptoListing.account = await accounts_model_1.default.findOne({
            _id: listingPurchase.cryptoListing.account,
        });
        console.log("Notifications cryptoListing ", listingPurchase.cryptoListing);
        await notification_service_1.NotificationService.createNewSellerPurchaseNotifications(listingPurchase);
        await notification_service_1.NotificationService.createNewBuyerPurchaseNotifications(listingPurchase);
    }
}, {
    connection: redisConnection,
});
worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully.`);
});
worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err);
});
