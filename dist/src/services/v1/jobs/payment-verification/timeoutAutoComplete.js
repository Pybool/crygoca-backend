"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAutoConfirmationTask = exports.timeoutAutoConfirmation = exports.timeoutAutoCompleteQueue = void 0;
const listingPurchase_model_1 = __importDefault(require("../../../../models/listingPurchase.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../../models/verifiedtransactions.model"));
const mailservice_1 = __importDefault(require("../../mail/mailservice"));
const minitaskscheduler_1 = require("../../minitaskscheduler");
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const redisConnection = connection_1.default.generic;
// Create a BullMQ queue
exports.timeoutAutoCompleteQueue = new bullmq_1.Queue("timeout-order-autocomplete-queue", {
    connection: redisConnection,
});
const checkIfListingIsDue = (listing) => {
    if (!listing?.updatedAt)
        return ["no-action", '0'];
    const updatedAt = new Date(listing.updatedAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - updatedAt) / (1000 * 60); // Convert milliseconds to minutes
    if (diffMinutes >= 30)
        return ["eligible", '0'];
    if (diffMinutes >= 20)
        return ["send-reminder", Math.round((30 - diffMinutes)).toString()];
    return ["no-action", '0'];
};
const timeoutAutoConfirmation = async () => {
    const filter = {
        fulfillmentStatus: "Completed",
        buyerFulfillmentClaim: "Pending",
    };
    const CryptoListingPurchaseSchema = await listingPurchase_model_1.default.find(filter).populate("account").populate("cryptoListing");
    for (let listing of CryptoListingPurchaseSchema) {
        const [state, timeout] = checkIfListingIsDue(listing);
        console.log("State & Timeout ===> ", state, timeout);
        if (state === "send-reminder") {
            //Send user a mail to remind him to confirm ,
            // else auto confirmation will take place in less than 10 mins
            const verifiedTransaction = await verifiedtransactions_model_1.default.findOne({
                tx_ref: listing?.checkOutId,
            });
            if (verifiedTransaction) {
                const email = listing.account.email;
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
                const data = {
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
                mailservice_1.default.orders.sendOrderAutoConfirmationWarningMail(email, data, listing.account._id.toString(), timeout);
            }
        }
        else if (state === "eligible") {
            //Add to autoconfirmation queue for processing.
            listing.account = listing.account._id;
            listing.cryptoListing = listing.cryptoListing._id;
            await exports.timeoutAutoCompleteQueue.add("order-auto-completion", listing, {
                attempts: 2,
                backoff: 5000,
            });
        }
    }
};
exports.timeoutAutoConfirmation = timeoutAutoConfirmation;
const periodicScheduler = new minitaskscheduler_1.PeriodicTaskScheduler();
const startAutoConfirmationTask = () => {
    periodicScheduler.addTask("check-listings-for-auto-confirmation", exports.timeoutAutoConfirmation, 120000);
    console.log("==== Starting Auto-confirmation task ===== ");
};
exports.startAutoConfirmationTask = startAutoConfirmationTask;
