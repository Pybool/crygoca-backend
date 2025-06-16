// escrow-balance-worker.ts
import { Worker } from "bullmq";
import { connection } from "../redisConnection";
import {
  dispenseLockedFunds,
  lockEscrowFunds,
  releaseLockedFunds,
  topUpEscrow,
} from "../services/escrow-utils";
import { sendLockedOrderNotification, sendReleaseLockedFundsNotification, sendTopUpNotification } from "../services/notify-ui";

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
          const topupData = await topUpEscrow(escrowId, amount);
          if(topupData) sendTopUpNotification(buyerId, topupData)
          break;
        case "dispenseLockedFunds":
          await dispenseLockedFunds(escrowId, amount);
          break;
        case "releaseLockedFunds":
          const escrow = await releaseLockedFunds(escrowId, amount, metaData.checkOutId);
          if(escrow) sendReleaseLockedFundsNotification(buyerId, escrow)
          break;
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    },
    { connection }
  );
};
