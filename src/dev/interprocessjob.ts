import { Queue, Worker, QueueEvents } from "bullmq";
import { connection } from "./connection";
// const connection = redisClient.generic;

// Create a queue instance
const eventQueue = new Queue("events", { connection });

/**
 * Adds a job to the events queue.
 * @param {Object} data - The data to process in the job.
 */
export async function addJob(data: any) {
  try {
    const job = await eventQueue.add("event-job", data, {
      attempts: 3, // Retry 3 times
      backoff: { type: "fixed", delay: 5000 }, // Retry delay of 5 seconds
    });
    console.log(`Job added with ID: ${job.id}`);
  } catch (error:any) {
    console.error("Failed to add job:", error.message);
  }
}

