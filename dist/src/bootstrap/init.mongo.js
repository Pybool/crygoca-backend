"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
const cryptoLiveUpdates_1 = require("../services/v1/tasks/scripts/cryptoLiveUpdates");
const livecurrencies_1 = require("../services/v1/tasks/scripts/livecurrencies");
const notificationListener_1 = require("../crypto-transfers/sockets/notificationListener");
const transfer_processor_1 = require("../crypto-transfers/bullmq/transfer.processor");
const escrow_balance_worker_1 = require("../escrow/workers/escrow-balance-worker");
(0, dotenv_1.config)();
const mongouri = process.env.CRYGOCA_MONGODB_URI;
const startBackgroundTasks = () => {
    (0, cryptoLiveUpdates_1.startCryptoLiveUpdatesWorker)();
    (0, livecurrencies_1.startExchangeRatesUpdatesWorker)();
    // startAutoConfirmationTask();
    // startTimeoutAutoCompleteWorker();
    // startFlutterwavePaymentsVerification();
    // startEscrowTransfersListeners();//DEPRECATED
    (0, notificationListener_1.startEscrowPayoutNotificationListener)();
    (0, transfer_processor_1.startTransfersWorker)();
    (0, escrow_balance_worker_1.startEscrowBalanceWorker)();
};
mongoose_1.default
    .connect(mongouri, {
    dbName: process.env.CRYGOCA_DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000, // Optionally ensure server selection timeout matches
})
    .then(async () => {
    logger_1.default.info("MongoDB connected Successfully.");
    // updatePlatforms()
    // await initMetaRelayer();
    if (process.env.NODE_ENV == "prod") {
        startBackgroundTasks();
        (0, notificationListener_1.startEscrowPayoutNotificationListener)();
        (0, transfer_processor_1.startTransfersWorker)();
        (0, escrow_balance_worker_1.startEscrowBalanceWorker)();
    }
    else {
        // startEscrowTransfersListeners();//DEPRECATED
        (0, notificationListener_1.startEscrowPayoutNotificationListener)();
        (0, transfer_processor_1.startTransfersWorker)();
        (0, escrow_balance_worker_1.startEscrowBalanceWorker)();
    }
})
    .catch((err) => {
    console.log(err);
    logger_1.default.info(err.message);
});
mongoose_1.default.connection.on("connected", () => {
    logger_1.default.info("Mongoose connected to db");
});
mongoose_1.default.connection.on("error", (err) => {
    logger_1.default.info(err.message);
});
mongoose_1.default.connection.on("disconnected", () => {
    logger_1.default.info("Mongoose connection is disconnected");
});
process.on("SIGINT", async () => {
    await mongoose_1.default.connection.close();
    process.exit(0);
});
