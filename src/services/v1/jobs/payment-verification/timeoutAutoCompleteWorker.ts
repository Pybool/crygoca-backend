import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";
import { Worker } from "bullmq";
import { NotificationService } from "../../notifications/notification.service";
import CryptoListingPurchase from "../../../../models/listingPurchase.model";
const redisConnection = REDIS_CONNECTION_CONFIG.generic;

export const startTimeoutAutoCompleteWorker = () => {
    const worker = new Worker(
        "timeout-order-autocomplete-queue",
        async (job) => {
            try {
                let listingPurchase = await CryptoListingPurchase.hydrate(job.data).populate("account");
                listingPurchase = await listingPurchase.populate("cryptoListing");
                if (listingPurchase) {
                    listingPurchase.buyerFulfillmentClaim = "Completed";
                    await listingPurchase.save();
                    await NotificationService.createOrderAutoCompletionNotification(
                        listingPurchase
                    );
                }
            } catch { }
        },
        {
            connection: redisConnection,
        }
    );

    worker.on("completed", (job) => {
        console.log(`✅ Job ${job.id} completed successfully.`);
    });

    worker.on("failed", (job: any, err) => {
        console.error(`❌ Job ${job.id} failed:`, err);
    });

}