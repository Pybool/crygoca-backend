import { Worker } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";

const redisConnection = REDIS_CONNECTION_CONFIG.generic;

// import { processQueue } from "./path-to-your-script"; // Import your processQueue logic

// Create a BullMQ worker
const worker = new Worker(
  "payment-verification-queue", // Queue name
  async (job) => {
    console.log(`Processing job: ${job.name}`);

    // Call your queue processing logic
    // await processQueue();
  },
  { connection: redisConnection }
);

// Handle worker events
worker.on("completed", (job:any) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job:any, err) => {
  console.error(`Job failed: ${job.id}`, err);
});
console.log("done")