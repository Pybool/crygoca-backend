"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExchangeRatesUpdatesWorker = exports.fetchRates = void 0;
const cheerio = require("cheerio");
const rp = require("request-promise");
const cache_1 = require("../../../../middlewares/cache");
const liveCurrencies_service_1 = require("../../conversions/liveCurrencies.service");
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const memCache = new cache_1.Cache();
const PERIODIC_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
const redisConnection = connection_1.default.generic;
const queueName = "live-currencies";
const liveUpdateEventQueue = new bullmq_1.Queue(queueName, {
    connection: redisConnection,
});
const fetchRates = async (url, isTask = false) => {
    return new Promise((resolve, reject) => {
        // if (memCache.get("live-currencies") && !isTask) {
        //   resolve(memCache.get("live-currencies"));
        // } else {
        console.log("Fetching rates ", url);
        rp(url)
            .then(function (response) {
            const dom = response; //.data;
            const $ = cheerio.load(dom);
            // Select only the first table element using `eq(0)`:
            const firstTable = $("table").eq(0);
            // If you need the table body rows from the first table:
            const pairRows = firstTable.find("tbody tr");
            const results = [];
            for (const pairRow of pairRows) {
                // console.log(
                //   "NSME ",
                //   $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text()
                // );
                const rate = {
                    name: $(pairRow)
                        .find("td:nth-child(2)")
                        .find("span.text-ellipsis")
                        .text() || "",
                    bid: $(pairRow).find("td:nth-child(3)").find("span").text(),
                    ask: $(pairRow).find("td:nth-child(4)").find("span").text(),
                    high: $(pairRow).find("td:nth-child(5)").text(),
                    low: $(pairRow).find("td:nth-child(6)").text(),
                    change: $(pairRow).find("td:nth-child(7)").text() || "",
                    percentChange: $(pairRow).find("td:nth-child(8)").text() || "",
                    symbol: $(pairRow).find('td[aria-label="Symbol"]').find("a")?.text() ||
                        "",
                };
                results.push(rate);
            }
            if (results[0].name === "") {
                (0, liveCurrencies_service_1.sendDevMail)("Crygoca live exchange rates service seems to be having problems at the moment");
            }
            const _response = {
                status: true,
                data: results,
            };
            memCache.set("live-currencies", _response, 120);
            resolve(_response);
        })
            .catch((error) => {
            console.log(error);
            resolve({
                status: false,
                data: null,
                error: error,
            });
        });
        // }
    });
};
exports.fetchRates = fetchRates;
async function getExchangeCurrenciesPeriodically() {
    try {
        const url = "https://ng.investing.com/currencies/streaming-forex-rates-majors";
        const isSTreaming = "true";
        await liveUpdateEventQueue.add("exchange-currencies", { url, isSTreaming });
    }
    catch (error) {
        console.error("Error during periodic queue check:", error);
    }
    finally {
        // Schedule the next execution
        setTimeout(getExchangeCurrenciesPeriodically, PERIODIC_INTERVAL);
    }
}
const startExchangeRatesUpdatesWorker = async () => {
    new bullmq_1.Worker(queueName, async (job) => {
        const { url, isStreaming } = job.data;
        try {
            await (0, exports.fetchRates)(url, isStreaming); // Process the task
        }
        catch (error) {
            console.error(`Error processing job for : ${url}`, error);
        }
    }, {
        concurrency: 10,
        connection: redisConnection,
    });
    // Start the periodic execution
    getExchangeCurrenciesPeriodically();
};
exports.startExchangeRatesUpdatesWorker = startExchangeRatesUpdatesWorker;
