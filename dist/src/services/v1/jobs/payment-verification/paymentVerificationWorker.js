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
const connection_1 = __importDefault(require("../../../../redis/connection"));
const bullmq_1 = require("bullmq");
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const accounts_model_1 = __importDefault(require("../../../../models/accounts.model"));
const notification_service_1 = require("../../notifications/notification.service");
const saleListing_model_1 = __importDefault(require("../../../../models/saleListing.model"));
const redisConnection = connection_1.default.generic;
const worker = new bullmq_1.Worker("payment-verification-queue", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { tx_ref } = job.data;
    console.log("Starting job====> ", tx_ref);
    let listingPurchase = yield listingPurchase_model_1.default.findOne({
        checkOutId: tx_ref,
    })
        .populate("account")
        .populate("cryptoListing");
    if (listingPurchase) {
        listingPurchase.paymentConfirmed = true;
        listingPurchase.fulfillmentStatus = "Pending";
        yield listingPurchase.save();
        // Update cryptoListing units
        if (listingPurchase.cryptoListing) {
            const cryptoListing = yield saleListing_model_1.default.findById(listingPurchase.cryptoListing._id);
            if (cryptoListing) {
                cryptoListing.units -= listingPurchase.units; // Deduct purchased units
                yield cryptoListing.save();
            }
        }
        listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
        listingPurchase.cryptoListing.account = yield accounts_model_1.default.findOne({
            _id: listingPurchase.cryptoListing.account,
        });
        console.log("Notifications cryptoListing ", listingPurchase.cryptoListing);
        yield notification_service_1.NotificationService.createNewSellerPurchaseNotifications(listingPurchase);
        yield notification_service_1.NotificationService.createNewBuyerPurchaseNotifications(listingPurchase);
    }
}), {
    connection: redisConnection,
});
worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully.`);
});
worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err);
});
