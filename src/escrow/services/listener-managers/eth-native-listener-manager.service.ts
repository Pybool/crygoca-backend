import { DepositIntent } from "../../../models/depositIntent.model";
import mongoose from "mongoose";
import CryptoListing from "../../../models/saleListing.model";
import Escrow from "../../../models/escrow.model";
import { escrowBalanceQueue } from "../../queues/escrow-balance-queue";
import {
  sendActiveListenerNotification,
  sendDeadListenerNotification,
  sendTransferNotification,
} from "../notify-ui";
import mailActions from "../../../services/v1/mail/mailservice";
import { Bytes } from "web3";
import web3 from "../../config/web3";

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type SubscriptionPromise = ReturnType<typeof web3.eth.subscribe>; // PromiEvent<Subscription>
type Subscription = Awaited<SubscriptionPromise>;
type SubscriptionMap = Map<string, Subscription>;

export class ETHNativeListenerManager {
  private subscriptions: SubscriptionMap = new Map();

  // Add a new escrow address to listen on
  async addEscrowAddress(accountId: string, address: string) {
    const normalizedAddress = address.toLowerCase();
    if (this.subscriptions.has(normalizedAddress)) {
      console.log(`Already listening to ${normalizedAddress}`);
      return;
    }

    web3.eth.subscribe(
      "pendingTransactions",
      async (err: any, txHash: Bytes) => {
        if (err) return;
        const tx = await web3.eth.getTransaction(txHash);
        if (!tx || tx.to?.toLowerCase() !== normalizedAddress) return;
        console.log("Pending transaction ", tx);
      }
    );

    const subscription = await web3.eth.subscribe("newBlockHeaders");

    subscription.on("data", async (blockHeader: any) => {
      const block:any = await web3.eth.getBlock(blockHeader.hash, true);
      for (const tx of block.transactions) {
       if (tx.to?.toLowerCase() === normalizedAddress) {
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
                this.removeEscrowAddress(accountId, normalizedAddress);
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
      }

  
    });

    subscription.on("error", (err) => {
      console.error(
        `[ETH Native Listener Manager]: Subscription error for ${normalizedAddress}`,
        err
      );
      // You might want to restart the subscription here or handle errors
    });

    this.subscriptions.set(normalizedAddress, subscription);
    console.log(
      `[ETH Native Listener Manager]: Started listening on escrow address: ${normalizedAddress}`
    );
    sendActiveListenerNotification(accountId, {
      normalizedAddress,
      subscriptionData: subscription.processSubscriptionData as any,
    });
  }

  // Remove an escrow address listener
  async removeEscrowAddress(accountId: string, address: string) {
    const normalizedAddress = address.toLowerCase();
    const subscription = this.subscriptions.get(normalizedAddress);
    if (subscription) {
      await subscription.unsubscribe();
      this.subscriptions.delete(normalizedAddress);
      console.log(
        `[ETH Native Listener Manager]: Stopped listening on escrow address: ${normalizedAddress}`
      );
      sendDeadListenerNotification(accountId, normalizedAddress);
    }
  }

  // Remove all subscriptions to clean up
  async removeAll() {
    for (const [address, subscription] of this.subscriptions) {
      await subscription.unsubscribe();
      console.log(
        `[ETH Native Listener Manager]: Stopped listening on escrow address: ${address}`
      );
    }
    this.subscriptions.clear();
  }
}
