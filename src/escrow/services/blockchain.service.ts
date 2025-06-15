import web3 from "../config/web3";
import { AbiItem } from "web3-utils";
import dotenv from "dotenv";
import { Bytes } from "web3";
import { ERC20_TOKENS } from "../config/tokens.config";
import { DepositIntent } from "../../models/depositIntent.model";
import { sendTransferNotification } from "./notify-ui";
import CryptoListing from "../../models/saleListing.model";
import Escrow from "../../models/escrow.model";
import mongoose from "mongoose"; // ✅ added mongoose
import { escrowBalanceQueue } from "../queues/escrow-balance-queue";
import mailActions from "../../services/v1/mail/mailservice";

dotenv.config();

const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS?.toLowerCase();

export const listenToERC20 = async () => {
  console.log("Starting ERC20 listener");
  const ERC20_TRANSFER_TOPIC = web3.utils.sha3(
    "Transfer(address,address,uint256)"
  )!;

  const subscription = await web3.eth.subscribe("logs", {
    address: ERC20_TOKENS.map((token) => token.address),
    topics: [
      ERC20_TRANSFER_TOPIC,
      null,
      web3.utils.padLeft(ESCROW_ADDRESS!, 64),
    ] as any,
  });

  subscription.on("data", async (log) => {
    const token = ERC20_TOKENS.find(
      (t) => t.address.toLowerCase() === log.address.toLowerCase()
    );
    if (!token) return;

    
    
  });
};

export const listenToETH = async () => {
  web3.eth.subscribe("pendingTransactions", async (err: any, txHash: Bytes) => {
    if (err) return;
    const tx = await web3.eth.getTransaction(txHash);
    if (!tx || tx.to?.toLowerCase() !== ESCROW_ADDRESS) return;
    console.log("Pending transaction ", tx);
  });

  (await web3.eth.subscribe("newBlockHeaders"))
  .on(
    "data",
    async (blockHeader: any) => {
      const block = await web3.eth.getBlock(blockHeader.hash, true);

      block.transactions.forEach(async (tx: any) => {
        if (tx.to?.toLowerCase() === ESCROW_ADDRESS) {
          const value = Number(tx.value) / 10 ** 18;
          const filter = {
            sender: tx.from.toLowerCase(),
            tokenAddress: "native_eth",
            status: "pending",
            amount: value,
            receivingAddress: tx.to?.toLowerCase(),
          };

          const match = await DepositIntent.findOne(filter);
          if (match) {
            console.log("Match ", match);
            const session = await mongoose.startSession();
            try {
              session.startTransaction();

              match.status = "confirmed";
              match.txHash = tx.hash;
              match.chainId = tx.chainId;
              match.blockHash = tx.blockHash;
              match.blockNumber = tx.blockNumber.toString();

              const listing: any = await CryptoListing.findOne({
                _id: match.listing,
              })
                .populate("account")
                .populate("cryptoCurrency")
                .session(session);
              if (listing) {
                let escrow: any;
                const data = {
                  account: listing.account?._id.toString(),
                  totalEscrowBalance: value,
                  availableEscrowBalance: value,
                  lockedEscrowBalance: 0,
                };

                if (!match.isTopUp) {
                  escrow = await Escrow.create([data], { session });
                  listing.depositConfirmed = true;
                  listing.escrow = escrow[0]._id;
                  await listing.save({ session });
                } else {
                  escrow = await Escrow.findOne({ _id: listing.escrow });
                  await escrowBalanceQueue.add("topUpEscrow", {
                    buyerId: listing.account?._id.toString(),
                    escrowId: escrow._id,
                    amount: filter.amount,
                  });
                }
                await match.save({ session });
                await session.commitTransaction();
                console.log(`ETH deposit confirmed for ${match.intentId}`);
                console.log("💸 Escrow deposit detected!", tx);
                sendTransferNotification(match.account.toString(), match);
                mailActions.deposits.sendDepositSuccessMail(
                  listing.account.email,
                  { account: listing.account, intent: match }
                );
              }
            } catch (error) {
              console.error("ETH Transaction error: ", error);
              await session.abortTransaction();
            } finally {
              session.endSession();
            }
          }
        }
      });
    }
  );
};
