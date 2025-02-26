import CryptoListingPurchase from "../../../../models/listingPurchase.model";
import VerifiedTransactions from "../../../../models/verifiedtransactions.model";
import mailActions, { IEmailCheckoutData } from "../../mail/mailservice";
import { PeriodicTaskScheduler } from "../../minitaskscheduler";
import { Queue, Worker, QueueEvents } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";

const redisConnection = REDIS_CONNECTION_CONFIG.generic;

// Create a BullMQ queue
export const timeoutAutoCompleteQueue = new Queue(
  "timeout-order-autocomplete-queue",
  {
    connection: redisConnection,
  }
);

const checkIfListingIsDue = (listing: any): string[] => {
  if (!listing?.updatedAt) return ["no-action", '0'];

  const updatedAt = new Date(listing.updatedAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - updatedAt) / (1000 * 60); // Convert milliseconds to minutes
  if (diffMinutes >= 30) return ["eligible", '0'];
  if (diffMinutes >= 20) return ["send-reminder", Math.round((30 - diffMinutes)).toString()];

  return ["no-action", '0'];
};

export const timeoutAutoConfirmation = async () => {
  const filter: { fulfillmentStatus: string; buyerFulfillmentClaim: string } = {
    fulfillmentStatus: "Completed",
    buyerFulfillmentClaim: "Pending",
  };
  
  const CryptoListingPurchaseSchema: any = await CryptoListingPurchase.find(
    filter
  ).populate("account").populate("cryptoListing");

  for (let listing of CryptoListingPurchaseSchema) {
    const [ state, timeout] = checkIfListingIsDue(listing);
    console.log("State & Timeout ===> ", state, timeout)
    if (state === "send-reminder") {
      //Send user a mail to remind him to confirm ,
      // else auto confirmation will take place in less than 10 mins
      const verifiedTransaction = await VerifiedTransactions.findOne({
        tx_ref: listing?.checkOutId,
      });
      if (verifiedTransaction) {
        const email: string = listing.account.email;
        const date = listing.createdAt.toLocaleString("en-US", {
          weekday: "long", // "Monday"
          year: "numeric", // "2024"
          month: "long", // "December"
          day: "numeric", // "1"
          hour: "2-digit", // "08"
          minute: "2-digit", // "45"
          second: "2-digit", // "32"
          hour12: true, // 12-hour format with AM/PM
        });
        const data: IEmailCheckoutData = {
          checkOutId: listing?.checkOutId,
          cryptoName: listing.cryptoListing.cryptoName,
          cryptoCode: listing.cryptoListing.cryptoCode,
          cryptoLogo: listing.cryptoListing.cryptoLogo,
          units: listing.units,
          currency: listing.cryptoListing?.currency?.toUpperCase(),
          amount: verifiedTransaction.data.amount,
          walletAddress: listing.walletAddress,
          buyerUserName: listing.account.username,
          sellerUserName: listing.cryptoListing.account.username,
          paymentOption: listing.paymentOption,
          date,
          status: "",
        };
        mailActions.orders.sendOrderAutoConfirmationWarningMail(
          email,
          data,
          listing.account._id.toString(),
          timeout
        );
      }
    } else if (state === "eligible") {
      //Add to autoconfirmation queue for processing.
      listing.account = listing.account._id;
      listing.cryptoListing = listing.cryptoListing._id;
      await timeoutAutoCompleteQueue.add("order-auto-completion", listing, {
        attempts: 2,
        backoff: 5000,
      });
    }
  }
};

const periodicScheduler = new PeriodicTaskScheduler();

export const startAutoConfirmationTask = () => {
  periodicScheduler.addTask(
    "check-listings-for-auto-confirmation",
    timeoutAutoConfirmation,
    120000
  );
  console.log("==== Starting Auto-confirmation task ===== ");
};
