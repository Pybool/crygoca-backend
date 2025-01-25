import { Queue, Worker, QueueEvents, JobType } from "bullmq";
import REDIS_CONNECTION_CONFIG from "../../../../redis/connection";
import { ItopUps, WalletService } from "../../wallet/wallet.service";

const redisConnection = REDIS_CONNECTION_CONFIG.generic;
// Define the wallet queue
const walletQueue = new Queue("wallet-operations", {
  connection: redisConnection,
});

// Listen to queue events (optional, for debugging and monitoring)
const queueEvents = new QueueEvents("wallet-operations", {
  connection: redisConnection,
});

queueEvents.on("completed", ({ jobId }) => {
  console.log(`Job ${jobId} completed successfully.`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed with reason: ${failedReason}`);
});

// Add a job to the queue for wallet operations
export async function addWalletBalanceUpdateJob(
  type:
    | "wallet-transfer"
    | "direct-topup"
    | "payout-topup"
    | "wallet-withdrawal",
  amount: number,
  meta: ItopUps | null,
  transferId?: string, // Concantenation of wallets AccountNo
  debitDetails?: { walletAccountNo: string; currency: string; amount: number },
  creditDetails?: { walletAccountNo: string; currency: string; amount: number },
  saveBeneficiary?: boolean
) {
  await walletQueue.add(type, {
    type,
    amount,
    meta,
    debitDetails,
    creditDetails,
    transferId,
    saveBeneficiary,
  });
  console.log("Wallet job added to the queue.");
}

export async function getQueueJobsByStatus(
  status: JobType = "failed",
  uuid: string | null = null
) {
  try {
    const existingJobs = await walletQueue.getJobs([status]);
    if (!uuid) {
      return existingJobs;
    } else {
      const duplicateJob = existingJobs.find(
        (job) => job.data?.meta?.verifiedTransactionId === uuid
      );
      return duplicateJob;
    }
  } catch {
    return null;
  }
}

// Add a job to the queue for wallet operations
export async function addWalletWithdrawalJob(
  type: "wallet-to-bank-withdrawal",
  data: any,
  hash: string,
  accountId: string
) {
  await walletQueue.add(type, {
    type,
    withdrawalData: data,
    hash,
    accountId,
  });
  console.log("Wallet withdrawal job added to the queue.");
}

// Define a worker to process wallet jobs
const worker = new Worker(
  "wallet-operations",
  async (job) => {
    const {
      debitDetails,
      creditDetails,
      amount,
      meta,
      type,
      saveBeneficiary,
      withdrawalData,
      hash,
      accountId,
    } = job.data;

    if (type === "wallet-to-bank-withdrawal") {
      return await WalletService.processToLocalBankWithdrawal(
        type,
        withdrawalData,
        hash,
        accountId
      );
    } else {
      await WalletService.updateWalletBalance(
        type,
        amount,
        meta,
        debitDetails,
        creditDetails,
        saveBeneficiary
      );
    }
  },
  {
    concurrency: 5, // Number of jobs to process concurrently
    connection: redisConnection, // Redis connection details
  }
);

worker.on("completed", (job: any) => {
  console.log(`Processed job with ID: ${job.id}`);
});

worker.on("failed", (job: any, err) => {
  console.error(`Job with ID ${job.id} failed: ${err.message}`);
});
