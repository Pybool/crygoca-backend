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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
const logger_1 = __importDefault(require("./logger"));
const livecurrencies_1 = require("../services/v1/tasks/scripts/livecurrencies");
const rollback_service_1 = require("../services/v1/wallet/rollback.service");
(0, dotenv_1.config)();
const mongouri = process.env.CRYGOCA_MONGODB_URI;
logger_1.default.info("MONGO_URI: " + mongouri);
logger_1.default.info("DATABASE NAME " + process.env.CRYGOCA_DATABASE_NAME);
mongoose_1.default
    .connect(mongouri, {
    dbName: process.env.CRYGOCA_DATABASE_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000, // Optionally ensure server selection timeout matches
})
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('MongoDB connected Successfully.');
    if (process.env.NODE_ENV == 'dev' || process.env.NODE_ENV == 'prod') {
        // startCryptoLiveUpdatesWorker();
        (0, livecurrencies_1.startExchangeRatesUpdatesWorker)();
    }
    (0, rollback_service_1.processRollbacks)();
}))
    .catch((err) => logger_1.default.info(err.message));
mongoose_1.default.connection.on('connected', () => {
    logger_1.default.info('Mongoose connected to db');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.default.info(err.message);
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.default.info('Mongoose connection is disconnected');
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connection.close();
    process.exit(0);
}));
