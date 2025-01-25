import { Queue, Worker, QueueEvents } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";

const redisConnection = REDIS_CONNECTION_CONFIG.generic;

// Create a BullMQ queue
export const paymentVerificationQueue = new Queue("payment-verification-queue", {
    connection: redisConnection,
});

