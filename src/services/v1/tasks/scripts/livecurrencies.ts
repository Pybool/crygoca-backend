const cheerio = require("cheerio");
const rp = require("request-promise");
import ejs from "ejs";
import { Cache } from "../../../../middlewares/cache";
import sendMail from "../../mail/mailtrigger";
import juice from "juice";
import { sendDevMail } from "../../conversions/liveCurrencies.service";
import { Queue, Worker, QueueEvents } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";
import { EventEmitter } from "events";
const memCache = new Cache();

const PERIODIC_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
const redisConnection = REDIS_CONNECTION_CONFIG.generic;
const queueName = "live-currencies";
const liveUpdateEventQueue = new Queue(queueName, {
  connection: redisConnection,
});


export const fetchRates = async (url: string, isTask = false) => {
  return new Promise((resolve: any, reject: any) => {
    // if (memCache.get("live-currencies") && !isTask) {
    //   resolve(memCache.get("live-currencies"));
    // } else {
    console.log("Fetching rates ", url)
    rp(url)
      .then(function (response: { data: any }) {
        const dom = response; //.data;
        const $ = cheerio.load(dom);
        // Select only the first table element using `eq(0)`:
        const firstTable = $("table").eq(0);

        // If you need the table body rows from the first table:
        const pairRows = firstTable.find("tbody tr");
        const results: {
          name: string;
          bid: number;
          ask: number;
          high: number;
          low: number;
          change: string;
          percentChange: string;
          symbol: string;
        }[] = [];
        for (const pairRow of pairRows) {
          // console.log(
          //   "NSME ",
          //   $(pairRow).find("td:nth-child(2)").find("span.text-ellipsis").text()
          // );
          const rate = {
            name:
              $(pairRow)
                .find("td:nth-child(2)")
                .find("span.text-ellipsis")
                .text() || "",
            bid: $(pairRow).find("td:nth-child(3)").find("span").text(),
            ask: $(pairRow).find("td:nth-child(4)").find("span").text(),
            high: $(pairRow).find("td:nth-child(5)").text(),
            low: $(pairRow).find("td:nth-child(6)").text(),
            change: $(pairRow).find("td:nth-child(7)").text() || "",
            percentChange: $(pairRow).find("td:nth-child(8)").text() || "",
            symbol:
              $(pairRow).find('td[aria-label="Symbol"]')!.find("a")?.text() ||
              "",
          };
          results.push(rate);
        }
        if (results[0].name === "") {
          sendDevMail(
            "Crygoca live exchange rates service seems to be having problems at the moment"
          );
        }
        const _response: { status: boolean; data: any } = {
          status: true,
          data: results,
        };

        memCache.set("live-currencies", _response, 120);
        resolve(_response);
      })
      .catch((error: any) => {
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

async function getExchangeCurrenciesPeriodically() {
  try {
    const url = "https://ng.investing.com/currencies/streaming-forex-rates-majors"
    const isSTreaming = "true"
    await liveUpdateEventQueue.add("exchange-currencies", { url, isSTreaming })
  } catch (error) {
    console.error("Error during periodic queue check:", error);
  } finally {
    // Schedule the next execution
    setTimeout(getExchangeCurrenciesPeriodically, PERIODIC_INTERVAL);
  }
}

export const startExchangeRatesUpdatesWorker = async () => {
  new Worker(
    queueName,
    async (job) => {
      const { url, isStreaming } = job.data;
      try {
        await fetchRates(url, isStreaming); // Process the task
      } catch (error) {
        console.error(`Error processing job for : ${url}`, error);
      }
    },
    {
      concurrency: 10,
      connection: redisConnection,
    }
  );
  // Start the periodic execution
  getExchangeCurrenciesPeriodically();
};
