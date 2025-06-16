import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { TransferLog } from "../../models/transferlog.model";
import { notificationQueue } from "./queues";
import { transferERC20, transferNativeETH } from "../services/transfer.service";
import CryptoListingPurchase from "../../models/listingPurchase.model";
import Escrow from "../../models/escrow.model";
import { IChainWallets } from "../../models/accounts-chain-wallets";
import { decryptDataString } from "../../services/v1/helpers";
import mongoose from "mongoose";

dotenv.config();

const depth = Number(process.env.ENC_DEPTH! || '1');

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
  blockchainWallet?: IChainWallets;
}

const getPrivateKey = (blockchainWallet: IChainWallets) => {
  const PRIVATE_KEY = decryptDataString(blockchainWallet.privateKey, depth);
  return PRIVATE_KEY;
};

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
        blockchainWallet,
      } = job.data;
      const privateKey = getPrivateKey(blockchainWallet!);

      try {
        let txHash: string | null = null;

        if (type === "native") {
          const escrowAccount = await Escrow.findOne({ _id: escrowId });
          if (!escrowAccount) {
            throw new Error("No escrow account was found for this listing");
          }
          if (escrowAccount.availableEscrowBalance < Number(amount)) {
            throw new Error(
              "No enough stock at this moment to service this order"
            );
          }
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            txHash = await transferNativeETH(recipient, amount, privateKey);

            if (txHash) {
              const purchase = await CryptoListingPurchase.findOne({
                checkOutId: checkOutId,
              }).session(session);
              if (!purchase) {
                throw new Error("No purchase was found to update");
              }
              purchase.cryptoDispensed = true;
              await purchase.save({ session });

              await TransferLog.create(
                [
                  {
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
                  },
                ],
                { session }
              );

              escrowAccount.availableEscrowBalance -= Number(amount);

              await session.commitTransaction();

              await notificationQueue.add("notify", {
                userId,
                checkOutId,
                recipient,
                symbol,
                amount,
                txHash,
                status: "success",
              });
              console.log(`✅ Sent ${amount} ${symbol} to ${recipient}`);
            }
          } catch (error: any) {
            console.log(error);
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        }

        if (type === "erc20") {
          if (!tokenAddress || decimals === undefined)
            throw new Error("Missing tokenAddress or decimals");
          const escrowAccount = await Escrow.findOne({ _id: escrowId });
          if (!escrowAccount) {
            throw new Error("No escrow account was found for this listing");
          }
          if (escrowAccount.availableEscrowBalance < Number(amount)) {
            throw new Error(
              "No enough stock at this moment to service this order"
            );
          }
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            txHash = await transferERC20(
              checkOutId,
              tokenAddress,
              recipient,
              amount,
              decimals,
              privateKey
            );

            if (txHash) {
              const purchase = await CryptoListingPurchase.findOne({
                checkOutId: checkOutId,
              }).session(session);
              if (!purchase) {
                throw new Error("No purchase was found to update");
              }
              purchase.cryptoDispensed = true;
              await purchase.save({ session });

              await TransferLog.create(
                [
                  {
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
                  },
                ],
                { session }
              );

              escrowAccount.availableEscrowBalance -= Number(amount);

              await session.commitTransaction();

              await notificationQueue.add("notify", {
                userId,
                checkOutId,
                recipient,
                symbol,
                amount,
                txHash,
                status: "success",
              });
              console.log(`✅ Sent ${amount} ${symbol} to ${recipient}`);
            }
          } catch (error: any) {
            console.log(error);
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        }
      } catch (err: any) {
        console.log(err);
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
      connection: { host: process.env.CRYGOCA_REDIS_HOST!, port: 6379 },
      concurrency: 2,
      // settings: { retryProcessDelay: 5000 },
    }
  );
};

//To solve the issue of knowing how much gasFee a wallet holds

// 1: Accumulate the gasFee somehwhere in database;

// 2: Each time a transfer is about to be made, substract the accumulated balance from the Wallet available balance

// 3: The moment we clear out any wallet reset the Accumulated gas fee for the wallet to zero
