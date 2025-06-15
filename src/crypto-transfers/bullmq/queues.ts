import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();
const CRYGOCA_REDIS_HOST = process.env.CRYGOCA_REDIS_HOST!;

export const transferQueue = new Queue("transfer-queue", {
  connection: {
    host: CRYGOCA_REDIS_HOST,
    port: 6379,
  },
});

export const notificationQueue = new Queue("notification-queue", {
  connection: { host: CRYGOCA_REDIS_HOST, port: 6379 },
});
