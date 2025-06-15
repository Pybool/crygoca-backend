import { ERC20_TOKENS } from "../../config/tokens.config";
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
import web3 from "../../config/web3";

const ERC20_TRANSFER_TOPIC = web3.utils.sha3(
  "Transfer(address,address,uint256)"
)!;

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type SubscriptionPromise = ReturnType<typeof web3.eth.subscribe>; // PromiEvent<Subscription>
type Subscription = Awaited<SubscriptionPromise>;
type SubscriptionMap = Map<string, Subscription>;
const subscriptions: SubscriptionMap = new Map();

export class ERC20ListenerManager {
  // Add a new escrow address to listen on
  async addEscrowAddress(accountId: string, address: string) {
    const normalizedAddress = address.toLowerCase();
    if (subscriptions.has(normalizedAddress)) {
      console.log(
        `[ERC20 Listener Manager]: Already listening to ${normalizedAddress}`
      );
      return;
    }

    const subscription = await web3.eth.subscribe("logs", {
      address: ERC20_TOKENS.map((token) => token.address),
      topics: [
        ERC20_TRANSFER_TOPIC,
        null,
        web3.utils.padLeft(normalizedAddress!, 64),
      ] as any,
    });

    subscription.on("data", async (log) => {
      const token = ERC20_TOKENS.find(
        (t) => t.address.toLowerCase() === log.address.toLowerCase()
      );
      if (!token) return;

      if (
        log.topics[2].toLowerCase() !==
        web3.utils.padLeft(normalizedAddress, 64).toLowerCase()
      ) {
        return; // filter out other escrow addresses
      }

      const decoded: any = web3.eth.abi.decodeLog(
        [
          { type: "address", name: "from", indexed: true },
          { type: "address", name: "to", indexed: true },
          { type: "uint256", name: "value" },
        ],
        log.data,
        log.topics.slice(1)
      );

      const value = Number(decoded.value) / 10 ** token.decimals;
      const filter = {
        sender: decoded.from.toLowerCase(),
        tokenAddress: token.address?.toLowerCase(),
        status: "pending",
        amount: value.toString(),
        receivingAddress: decoded.to?.toLowerCase(),
      };
      const match = await DepositIntent.findOne(filter);
      console.log("Match ", match);
      if (match) {
        const _accountId = match.account.toString();
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          match.status = "confirmed";
          match.chainId = token.chainId.toString();
          match.blockHash = log.blockHash;
          match.blockNumber = log.blockNumber!.toString();
          match.txHash = log.transactionHash; // ✅ fixed from decoded.hash to log.transactionHash

          const listing: any = await CryptoListing.findOne({
            _id: match.listing,
          })
            .populate("account")
            .populate("cryptoCurrency")
            .session(session);

          if (listing) {
            const data = {
              account: listing.account?._id?.toString(),
              totalEscrowBalance: value,
              availableEscrowBalance: value,
              lockedEscrowBalance: 0,
            };
            let escrow: any;
            if (!match.isTopUp) {
              escrow = await Escrow.create([data], { session });
              listing.escrow = escrow[0]?._id;
              listing.depositConfirmed = true;
              await listing.save({ session });
            } else {
              escrow = await Escrow.findOne({ _id: listing.escrow });
              console.log({
                buyerId: listing.account?._id?.toString(),
                escrowId: escrow._id,
                amount: filter.amount,
              });
              await escrowBalanceQueue.add("topUpEscrow", {
                buyerId: listing.account?._id?.toString(),
                escrowId: escrow._id,
                amount: filter.amount,
              });
            }
            await match.save({ session });
          }

          await session.commitTransaction();
          this.removeEscrowAddress(accountId, normalizedAddress);
          console.log(`ERC20 deposit confirmed for ${match.intentId}`);
          sendTransferNotification(_accountId, match);
          console.log(
            `📦 ERC20 (${token.symbol}) deposit: from ${decoded.from} → ${decoded.to} | amount: ${value}`
          );
          mailActions.deposits.sendDepositSuccessMail(listing.account.email, {
            account: listing.account,
            intent: match,
          });
        } catch (error) {
          console.error("ERC20 Transaction error: ", error);
          await session.abortTransaction();
        } finally {
          session.endSession();
        }
      }
    });

    subscription.on("error", (err) => {
      console.error(
        `[ERC20 Listener Manager]: Subscription error for ${normalizedAddress}`,
        err
      );
      // You might want to restart the subscription here or handle errors
      sendDeadListenerNotification(accountId, normalizedAddress);
    });

    subscriptions.set(normalizedAddress, subscription);
    console.log(
      `[ERC20 Listener Manager]: Started listening on escrow address: ${normalizedAddress}`
    );
    sendActiveListenerNotification(accountId, {
      normalizedAddress,
      subscriptionData: subscription.processSubscriptionData as any,
    });
  }

  // Remove an escrow address listener
  async removeEscrowAddress(accountId: string, address: string) {
    const normalizedAddress = address.toLowerCase();
    const subscription = subscriptions.get(normalizedAddress);
    if (subscription) {
      await subscription.unsubscribe();
      subscriptions.delete(normalizedAddress);
      console.log(
        `[ERC20 Listener Manager]: Stopped listening on escrow address: ${normalizedAddress}`
      );
      sendDeadListenerNotification(accountId, normalizedAddress);
      return {
        status: true,
        message: "Subscription killed",
        data: normalizedAddress,
      };
    }
    return { status: false, message: "No Subscription found", data: null };
  }

  // Remove all subscriptions to clean up
  async removeAll() {
    for (const [address, subscription] of subscriptions) {
      await subscription.unsubscribe();
      console.log(
        `[ERC20 Listener Manager]: Stopped listening on escrow address: ${address}`
      );
    }
    subscriptions.clear();
  }
}
