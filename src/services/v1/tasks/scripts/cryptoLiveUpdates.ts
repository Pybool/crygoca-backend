const axios = require("axios");
import { config as dotenvConfig } from "dotenv";
import { Cache } from "../../../../middlewares/cache";
import { sendDevMail } from "../../conversions/liveCurrencies.service";
import { Queue, Worker, QueueEvents } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";
import { EventEmitter } from "events";

const redisConnection = REDIS_CONNECTION_CONFIG.generic;
const eventEmitter = new EventEmitter();
const queueName = "crypto-live-updates";
dotenvConfig({ path: `.env` });
const memCache = new Cache();
let downtimeCounter = { convert: 0 };
const PERIODIC_INTERVAL = 60 * 60 * 1000; // 60 minute in milliseconds
const startValues: any[] = [1, 5001, 10001]; // Start values
const limit = 5000;
let isCronRunning = false; // Lock mechanism to prevent overlapping
const liveUpdateEventQueue = new Queue(queueName, {
  connection: redisConnection,
});

async function saveCryptoQuotes(cryptocurrenciesData: any[]): Promise<void> {
  try {
    const response = await axios.post(
      `${process.env.CRYGOCA_SERVER_URL}/api/v1/update-crypto-quotes`,
      { data: cryptocurrenciesData }, // Pass the data in the request body
      {
        headers: {
          "Content-Type": "application/json", // Specify JSON content type
        },
      }
    );

    console.log("Crypto quotes updated successfully:", response.data);
  } catch (error: any) {
    // Handle errors and log useful details
    if (error.response) {
      console.error("Error response from server:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("No response received from server:", error.request);
    } else {
      console.error("Error during request setup:", error.message);
    }
  }
}

export async function cryptoLiveUpdates(start: number = 1, limit: number = 2) {
  try {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${"USD"}&CMC_PRO_API_KEY=${
      process.env.CMC_PRO_API_KEY as string
    }`;

    if (await memCache.get(url)) {
      console.log("Fetching cryptoliveUpdates from cache");
      const result = { status: true, data: await memCache.get(url) };
      process.send?.(result);
      return result;
    } else {
      const response = await axios.get(url);

      if (response.status == 200) {
        let responseData: any = response.data;
        if (responseData?.status?.error_code == 0) {
          const result = { status: true, data: responseData.data };
          await saveCryptoQuotes(responseData.data);
          await memCache.set(url, responseData.data, 3600);
          process.send?.(result);
          return result;
        } else {
          process.send?.({ status: false, data: null });
          return { status: false, data: null };
        }
      }
      process.send?.({ status: false, data: null });
      return { status: false, data: null };
    }
  } catch (error: any) {
    downtimeCounter.convert += 1;
    if (downtimeCounter.convert >= 3) {
      sendDevMail(
        "cryptoliveUpdates service seems to be having some challenges at the moment."
      );
      downtimeCounter.convert = 0;
    }
    process.send?.({ status: false, error: error.message });
    return { status: false, error: error.message };
  }
}

async function getCryptoLiveUpdatesPeriodically() {
  try {
    if (isCronRunning) {
      console.log("Skipping execution: Previous task is still running.");
      return;
    }

    console.log("Crypto task initiated...");
    isCronRunning = true;
    const processTask = async (index: number): Promise<void> => {
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
      } catch (err) {
        console.error(
          `Error adding task to queue for start value: ${start}`,
          err
        );
        isCronRunning = false; // Unlock in case of an error
      }
    };

    // Start processing tasks from the first index
    await processTask(0);
  } catch (error) {
    console.error("Error during periodic queue check:", error);
  } finally {
    // Schedule the next execution
    setTimeout(getCryptoLiveUpdatesPeriodically, PERIODIC_INTERVAL);
  }
}

export const startCryptoLiveUpdatesWorker = async () => {
  new Worker(
    queueName,
    async (job) => {
      const { start, limit } = job.data;
      console.log(`Worker processing job: start=${start}, limit=${limit}`);

      try {
        const result = await cryptoLiveUpdates(start, limit); // Process the task
        if (result.status === true) {
          console.log(`Task succeeded for start value: ${start}`);
        } else {
          console.error(`Task failed for start value: ${start}`);
        }
      } catch (error) {
        console.error(`Error processing job for start value: ${start}`, error);
      }
    },
    {
      concurrency: 10,
      connection: redisConnection,
    }
  );
  // Start the periodic execution
  getCryptoLiveUpdatesPeriodically();
};

