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
const fetchRates = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, isTask = false) {
    return new Promise((resolve, reject) => {
        // if (memCache.get("live-currencies") && !isTask) {
        //   resolve(memCache.get("live-currencies"));
        // } else {
        console.log("Fetching rates ", url);
        rp(url)
            .then(function (response) {
            var _a;
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
                    symbol: ((_a = $(pairRow).find('td[aria-label="Symbol"]').find("a")) === null || _a === void 0 ? void 0 : _a.text()) ||
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
});
exports.fetchRates = fetchRates;
function getExchangeCurrenciesPeriodically() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = "https://ng.investing.com/currencies/streaming-forex-rates-majors";
            const isSTreaming = "true";
            yield liveUpdateEventQueue.add("exchange-currencies", { url, isSTreaming });
        }
        catch (error) {
            console.error("Error during periodic queue check:", error);
        }
        finally {
            // Schedule the next execution
            setTimeout(getExchangeCurrenciesPeriodically, PERIODIC_INTERVAL);
        }
    });
}
const startExchangeRatesUpdatesWorker = () => __awaiter(void 0, void 0, void 0, function* () {
    new bullmq_1.Worker(queueName, (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { url, isStreaming } = job.data;
        try {
            yield (0, exports.fetchRates)(url, isStreaming); // Process the task
        }
        catch (error) {
            console.error(`Error processing job for : ${url}`, error);
        }
    }), {
        concurrency: 10,
        connection: redisConnection,
    });
    // Start the periodic execution
    getExchangeCurrenciesPeriodically();
});
exports.startExchangeRatesUpdatesWorker = startExchangeRatesUpdatesWorker;
