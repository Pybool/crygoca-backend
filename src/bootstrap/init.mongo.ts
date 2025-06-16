import mongoose from "mongoose";
import { config as dotenvConfig } from "dotenv";
import logger from "./logger";
import { startCryptoLiveUpdatesWorker } from "../services/v1/tasks/scripts/cryptoLiveUpdates";
import { startExchangeRatesUpdatesWorker } from "../services/v1/tasks/scripts/livecurrencies";
import { startEscrowPayoutNotificationListener } from "../crypto-transfers/sockets/notificationListener";
import { startTransfersWorker } from "../crypto-transfers/bullmq/transfer.processor";
import { startEscrowBalanceWorker } from "../escrow/workers/escrow-balance-worker";
import { updatePlatforms } from "../services/v1/listingsServices/cryptolisting.service";
import { initMetaRelayer } from "../crypto-transfers/services/metaTx";
dotenvConfig();

const mongouri: any = process.env.CRYGOCA_MONGODB_URI;
const startBackgroundTasks = () => {
  startCryptoLiveUpdatesWorker();
  startExchangeRatesUpdatesWorker();
  // startAutoConfirmationTask();
  // startTimeoutAutoCompleteWorker();
  // startFlutterwavePaymentsVerification();
  // startEscrowTransfersListeners();//DEPRECATED
  startEscrowPayoutNotificationListener();
  startTransfersWorker();
  startEscrowBalanceWorker();
};

mongoose
  .connect(mongouri, {
    dbName: process.env.CRYGOCA_DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000, // Optionally ensure server selection timeout matches
  } as mongoose.ConnectOptions)
  .then(async () => {
    logger.info("MongoDB connected Successfully.");
    // updatePlatforms()
    // await initMetaRelayer();
    if (process.env.NODE_ENV == "prod") {
      startBackgroundTasks();
      startEscrowPayoutNotificationListener();
      startTransfersWorker();
      startEscrowBalanceWorker();
    } else {
      // startEscrowTransfersListeners();//DEPRECATED
      startEscrowPayoutNotificationListener();
      startTransfersWorker();
      startEscrowBalanceWorker();
    }
  })
  .catch((err: any) => {
    console.log(err)
    logger.info(err.message)
  });

mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to db");
});

mongoose.connection.on("error", (err) => {
  logger.info(err.message);
});

mongoose.connection.on("disconnected", () => {
  logger.info("Mongoose connection is disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
