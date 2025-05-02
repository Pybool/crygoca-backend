import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
const hre = require("hardhat");

import { TransferLog } from "../../models/transferlog.model";
import { notificationQueue } from "./queues";
import { transferERC20, transferNativeETH } from "../services/transfer.service";
import CryptoListingPurchase from "../../models/listingPurchase.model";
import Escrow from "../../models/escrow.model";

dotenv.config();

interface TransferJobData {
  userId: string;
  escrowId: string;
  checkOutId: string;
  recipient: string;
  type: "native" | "erc20";
  symbol: string;
  amount: string;
  tokenAddress?: string;
  decimals?: number;
}

export const startTransfersWorker = () => {
  new Worker(
    "transfer-queue",
    async (job: Job<TransferJobData>) => {
      const {
        userId,
        escrowId,
        checkOutId,
        recipient,
        type,
        amount,
        symbol,
        tokenAddress,
        decimals,
      } = job.data;
      const [signer] = await hre.ethers.getSigners();
      console.log("job.data ", job.data);

      try {
        let txHash = "";

        if (type === "native") {
          txHash = await transferNativeETH(recipient, amount, signer);
        }

        if (type === "erc20") {
          if (!tokenAddress || decimals === undefined)
            throw new Error("Missing tokenAddress or decimals");
          const escrowAccount = await Escrow.findOne({ _id: escrowId });
          if (!escrowAccount) {
            throw new Error("No escrow accout was found for this listing");
          }
          if (escrowAccount.availableEscrowBalance < Number(amount)) {
            throw new Error(
              "No enough stock at this moment to service this order"
            );
          }
          txHash = await transferERC20(
            checkOutId,
            tokenAddress,
            recipient,
            amount,
            decimals,
            signer
          );

          if (txHash?.trim()) {
            const purchase = await CryptoListingPurchase.findOne({
              checkOutId: checkOutId,
            });
            if (!purchase) {
              throw new Error("No purchase was found to update");
            }
            purchase.cryptoDispensed = true;
            await purchase.save();
  
            await TransferLog.create({
              account: userId,
              escrow: escrowId,
              checkOutId,
              recipient,
              symbol,
              amount,
              tokenAddress,
              type,
              txHash,
              status: "success",
            });
  
            escrowAccount.availableEscrowBalance -= Number(amount);
  
            await notificationQueue.add("notify", {
              userId,
              checkOutId,
              recipient,
              symbol,
              amount,
              txHash,
              status: "success",
            });
          }
        }

        

        console.log(`✅ Sent ${amount} ${symbol} to ${recipient}`);
      } catch (err: any) {
        console.error(`❌ Transfer failed: ${err.message}`);

        await TransferLog.create({
          account: userId,
          escrow: escrowId,
          checkOutId,
          recipient,
          symbol,
          amount,
          tokenAddress,
          type,
          txHash: "",
          status: "failed",
          error: err.message,
        });

        await notificationQueue.add("notify", {
          userId,
          checkOutId,
          recipient,
          symbol,
          amount,
          status: "failed",
          error: err.message,
        });

        throw err;
      }
    },
    {
      connection: { host: "127.0.0.1", port: 6379 },
      concurrency: 2,
      // settings: { retryProcessDelay: 5000 },
    }
  );
};
