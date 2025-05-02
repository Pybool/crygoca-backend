// escrow-balance-worker.ts
import { Worker } from "bullmq";
import { connection } from "../redisConnection";
import {
  dispenseLockedFunds,
  lockEscrowFunds,
  releaseLockedFunds,
  topUpEscrow,
} from "../services/escrow-utils";
import { sendLockedOrderNotification } from "../services/notify-ui";

export const startEscrowBalanceWorker = () => {
  new Worker(
    "escrow-balance-queue",
    async (job) => {
      const {buyerId, escrowId, amount, metaData } = job.data;
      switch (job.name) {
        case "lockEscrowFunds":
          const data = await lockEscrowFunds(escrowId, amount, metaData );
          if(data) sendLockedOrderNotification(buyerId, data)
          break;
        case "topUpEscrow":
          await topUpEscrow(escrowId, amount);
          break;
        case "dispenseLockedFunds":
          await dispenseLockedFunds(escrowId, amount);
          break;
        case "releaseLockedFunds":
          await releaseLockedFunds(escrowId, amount);
          break;
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    },
    { connection }
  );
};
