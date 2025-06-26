"use strict";
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
async function saveCryptoQuotes(cryptocurrenciesData) {
    try {
        const response = await axios.post(`${process.env.CRYGOCA_SERVER_URL}/api/v1/update-crypto-quotes`, { data: cryptocurrenciesData }, // Pass the data in the request body
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
}
async function cryptoLiveUpdates(start = 1, limit = 2) {
    try {
        const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${"USD"}&CMC_PRO_API_KEY=${process.env.CMC_PRO_API_KEY}`;
        if (await memCache.get(url)) {
            console.log("Fetching cryptoliveUpdates from cache");
            const result = { status: true, data: await memCache.get(url) };
            process.send?.(result);
            return result;
        }
        else {
            const response = await axios.get(url);
            if (response.status == 200) {
                let responseData = response.data;
                if (responseData?.status?.error_code == 0) {
                    const result = { status: true, data: responseData.data };
                    await saveCryptoQuotes(responseData.data);
                    await memCache.set(url, responseData.data, 3600);
                    process.send?.(result);
                    return result;
                }
                else {
                    process.send?.({ status: false, data: null });
                    return { status: false, data: null };
                }
            }
            process.send?.({ status: false, data: null });
            return { status: false, data: null };
        }
    }
    catch (error) {
        downtimeCounter.convert += 1;
        if (downtimeCounter.convert >= 3) {
            (0, liveCurrencies_service_1.sendDevMail)("cryptoliveUpdates service seems to be having some challenges at the moment.");
            downtimeCounter.convert = 0;
        }
        process.send?.({ status: false, error: error.message });
        return { status: false, error: error.message };
    }
}
exports.cryptoLiveUpdates = cryptoLiveUpdates;
async function getCryptoLiveUpdatesPeriodically() {
    try {
        if (isCronRunning) {
            console.log("Skipping execution: Previous task is still running.");
            return;
        }
        console.log("Crypto task initiated...");
        isCronRunning = true;
        const processTask = async (index) => {
            if (index >= startValues.length) {
                console.log("All tasks completed for this cycle.");
                isCronRunning = false;
                return;
            }
            const start = startValues[index];
            console.log(`Adding task to queue for start value: ${start}`);
            try {
                // Add task to the queue and pass `start` and `limit` as job data
                await liveUpdateEventQueue.add("live-update", { start, limit });
                console.log(`Task added to queue for start value: ${start}`);
                // Move to the next start value
                await processTask(index + 1);
            }
            catch (err) {
                console.error(`Error adding task to queue for start value: ${start}`, err);
                isCronRunning = false; // Unlock in case of an error
            }
        };
        // Start processing tasks from the first index
        await processTask(0);
    }
    catch (error) {
        console.error("Error during periodic queue check:", error);
    }
    finally {
        // Schedule the next execution
        setTimeout(getCryptoLiveUpdatesPeriodically, PERIODIC_INTERVAL);
    }
}
const startCryptoLiveUpdatesWorker = async () => {
    new bullmq_1.Worker(queueName, async (job) => {
        const { start, limit } = job.data;
        console.log(`Worker processing job: start=${start}, limit=${limit}`);
        try {
            const result = await cryptoLiveUpdates(start, limit); // Process the task
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
    }, {
        concurrency: 10,
        connection: redisConnection,
    });
    // Start the periodic execution
    getCryptoLiveUpdatesPeriodically();
};
exports.startCryptoLiveUpdatesWorker = startCryptoLiveUpdatesWorker;
