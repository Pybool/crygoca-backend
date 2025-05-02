import { Queue } from "bullmq";
import dotenv from "dotenv";

dotenv.config();

export const transferQueue = new Queue("transfer-queue", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});

export const notificationQueue = new Queue("notification-queue", {
  connection: { host: "127.0.0.1", port: 6379 },
});
