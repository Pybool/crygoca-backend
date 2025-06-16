"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addJob = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
// const connection = redisClient.generic;
// Create a queue instance
const eventQueue = new bullmq_1.Queue("events", { connection: connection_1.connection });
/**
 * Adds a job to the events queue.
 * @param {Object} data - The data to process in the job.
 */
async function addJob(data) {
    try {
        const job = await eventQueue.add("event-job", data, {
            attempts: 3, // Retry 3 times
            backoff: { type: "fixed", delay: 5000 }, // Retry delay of 5 seconds
        });
        console.log(`Job added with ID: ${job.id}`);
    }
    catch (error) {
        console.error("Failed to add job:", error.message);
    }
}
exports.addJob = addJob;
