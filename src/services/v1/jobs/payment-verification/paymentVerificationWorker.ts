import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";
import { Worker } from "bullmq";
import CryptoListingPurchase from "../../../../models/listingPurchase.model";
import Accounts from "../../../../models/accounts.model";
import { NotificationService } from "../../notifications/notification.service";
import CryptoListing from "../../../../models/saleListing.model";
const redisConnection = REDIS_CONNECTION_CONFIG.generic;

const worker = new Worker(
  "payment-verification-queue",
  async (job) => {
    const { tx_ref } = job.data;
    console.log("Starting job====> ", tx_ref)

    let listingPurchase: any = await CryptoListingPurchase.findOne({
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
        const cryptoListing = await CryptoListing.findById(
          listingPurchase.cryptoListing._id
        );
        if (cryptoListing) {
          cryptoListing.units -= listingPurchase.units; // Deduct purchased units
          await cryptoListing.save();
        }
      }

      listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
      listingPurchase.cryptoListing.account = await Accounts.findOne({
        _id: listingPurchase.cryptoListing.account,
      });

      console.log(
        "Notifications cryptoListing ",
        listingPurchase.cryptoListing
      );
      await NotificationService.createNewSellerPurchaseNotifications(
        listingPurchase
      );
      await NotificationService.createNewBuyerPurchaseNotifications(
        listingPurchase
      );
    }
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
