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
exports.startCryptoLiveUpdatesWorker = exports.cryptoLiveUpdates = void 0;
const axios = require("axios");
const dotenv_1 = require("dotenv");
const cache_1 = require("../../../../middlewares/cache");
const liveCurrencies_service_1 = require("../../conversions/liveCurrencies.service");
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const events_1 = require("events");
const redisConnection = connection_1.default.generic;
const eventEmitter = new events_1.EventEmitter();
const queueName = "crypto-live-updates";
(0, dotenv_1.config)({ path: `.env` });
const memCache = new cache_1.Cache();
let downtimeCounter = { convert: 0 };
const PERIODIC_INTERVAL = 60 * 60 * 1000; // 60 minute in milliseconds
const startValues = [1, 5001, 10001]; // Start values
const limit = 5000;
let isCronRunning = false; // Lock mechanism to prevent overlapping
const liveUpdateEventQueue = new bullmq_1.Queue(queueName, {
    connection: redisConnection,
});
function saveCryptoQuotes(cryptocurrenciesData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.post(`${process.env.CRYGOCA_SERVER_URL}/api/v1/update-crypto-quotes`, { data: cryptocurrenciesData }, // Pass the data in the request body
            {
                headers: {
                    "Content-Type": "application/json", // Specify JSON content type
                },
            });
            console.log("Crypto quotes updated successfully:", response.data);
        }
        catch (error) {
            // Handle errors and log useful details
            if (error.response) {
                console.error("Error response from server:", error.response.data);
                console.error("Status code:", error.response.status);
            }
            else if (error.request) {
                console.error("No response received from server:", error.request);
            }
            else {
                console.error("Error during request setup:", error.message);
            }
        }
    });
}
function cryptoLiveUpdates() {
    return __awaiter(this, arguments, void 0, function* (start = 1, limit = 2) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${"USD"}&CMC_PRO_API_KEY=${process.env.CMC_PRO_API_KEY}`;
            console.log("URL ", url);
            if (yield memCache.get(url)) {
                console.log("Fetching cryptoliveUpdates from cache");
                const result = { status: true, data: yield memCache.get(url) };
                (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, result);
                return result;
            }
            else {
                const response = yield axios.get(url);
                if (response.status == 200) {
                    let responseData = response.data;
                    if (((_b = responseData === null || responseData === void 0 ? void 0 : responseData.status) === null || _b === void 0 ? void 0 : _b.error_code) == 0) {
                        console.log("responseData ", responseData);
                        const result = { status: true, data: responseData.data };
                        yield saveCryptoQuotes(responseData.data);
                        yield memCache.set(url, responseData.data, 3600);
                        (_c = process.send) === null || _c === void 0 ? void 0 : _c.call(process, result);
                        return result;
                    }
                    else {
                        (_d = process.send) === null || _d === void 0 ? void 0 : _d.call(process, { status: false, data: null });
                        return { status: false, data: null };
                    }
                }
                (_e = process.send) === null || _e === void 0 ? void 0 : _e.call(process, { status: false, data: null });
                return { status: false, data: null };
            }
        }
        catch (error) {
            downtimeCounter.convert += 1;
            if (downtimeCounter.convert >= 3) {
                (0, liveCurrencies_service_1.sendDevMail)("cryptoliveUpdates service seems to be having some challenges at the moment.");
                downtimeCounter.convert = 0;
            }
            (_f = process.send) === null || _f === void 0 ? void 0 : _f.call(process, { status: false, error: error.message });
            return { status: false, error: error.message };
        }
    });
}
exports.cryptoLiveUpdates = cryptoLiveUpdates;
function getCryptoLiveUpdatesPeriodically() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (isCronRunning) {
                console.log("Skipping execution: Previous task is still running.");
                return;
            }
            console.log("Crypto task initiated...");
            isCronRunning = true;
            const processTask = (index) => __awaiter(this, void 0, void 0, function* () {
                if (index >= startValues.length) {
                    console.log("All tasks completed for this cycle.");
                    isCronRunning = false;
                    return;
                }
                const start = startValues[index];
                console.log(`Adding task to queue for start value: ${start}`);
                try {
                    // Add task to the queue and pass `start` and `limit` as job data
                    yield liveUpdateEventQueue.add("live-update", { start, limit });
                    console.log(`Task added to queue for start value: ${start}`);
                    // Move to the next start value
                    yield processTask(index + 1);
                }
                catch (err) {
                    console.error(`Error adding task to queue for start value: ${start}`, err);
                    isCronRunning = false; // Unlock in case of an error
                }
            });
            // Start processing tasks from the first index
            yield processTask(0);
        }
        catch (error) {
            console.error("Error during periodic queue check:", error);
        }
        finally {
            // Schedule the next execution
            setTimeout(getCryptoLiveUpdatesPeriodically, PERIODIC_INTERVAL);
        }
    });
}
const startCryptoLiveUpdatesWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    new bullmq_1.Worker(queueName, (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { start, limit } = job.data;
        console.log(`Worker processing job: start=${start}, limit=${limit}`);
        try {
            const result = yield cryptoLiveUpdates(start, limit); // Process the task
            if (result.status === true) {
                console.log(`Task succeeded for start value: ${start}`);
            }
            else {
                console.error(`Task failed for start value: ${start}`);
            }
        }
        catch (error) {
            console.error(`Error processing job for start value: ${start}`, error);
        }
    }), {
        concurrency: 10,
        connection: redisConnection,
    });
    // Start the periodic execution
    getCryptoLiveUpdatesPeriodically();
});
exports.startCryptoLiveUpdatesWorker = startCryptoLiveUpdatesWorker;
