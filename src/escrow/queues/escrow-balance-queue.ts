// escrow-balance-queue.ts
import { Queue } from "bullmq";
import { connection } from "../redisConnection";

export const escrowBalanceQueue = new Queue("escrow-balance-queue", { connection });
