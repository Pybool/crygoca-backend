"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHNativeListenerManager = void 0;
const depositIntent_model_1 = require("../../../models/depositIntent.model");
const mongoose_1 = __importDefault(require("mongoose"));
const saleListing_model_1 = __importDefault(require("../../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../../models/escrow.model"));
const escrow_balance_queue_1 = require("../../queues/escrow-balance-queue");
const notify_ui_1 = require("../notify-ui");
const mailservice_1 = __importDefault(require("../../../services/v1/mail/mailservice"));
const web3_1 = __importDefault(require("../../config/web3"));
class ETHNativeListenerManager {
    constructor() {
        this.subscriptions = new Map();
    }
    // Add a new escrow address to listen on
    async addEscrowAddress(accountId, address) {
        const normalizedAddress = address.toLowerCase();
        if (this.subscriptions.has(normalizedAddress)) {
            console.log(`Already listening to ${normalizedAddress}`);
            return;
        }
        web3_1.default.eth.subscribe("pendingTransactions", async (err, txHash) => {
            if (err)
                return;
            const tx = await web3_1.default.eth.getTransaction(txHash);
            if (!tx || tx.to?.toLowerCase() !== normalizedAddress)
                return;
            console.log("Pending transaction ", tx);
        });
        const subscription = await web3_1.default.eth.subscribe("newBlockHeaders");
        subscription.on("data", async (blockHeader) => {
            const block = await web3_1.default.eth.getBlock(blockHeader.hash, true);
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
                    const match = await depositIntent_model_1.DepositIntent.findOne(filter);
                    if (match) {
                        const session = await mongoose_1.default.startSession();
                        try {
                            session.startTransaction();
                            match.status = "confirmed";
                            match.txHash = tx.hash;
                            match.chainId = tx.chainId;
                            match.blockHash = tx.blockHash;
                            match.blockNumber = tx.blockNumber.toString();
                            const listing = await saleListing_model_1.default.findOne({
                                _id: match.listing,
                            })
                                .populate("account")
                                .populate("cryptoCurrency")
                                .session(session);
                            if (listing) {
                                let escrow;
                                const data = {
                                    account: listing.account?._id.toString(),
                                    totalEscrowBalance: value,
                                    availableEscrowBalance: value,
                                    lockedEscrowBalance: 0,
                                };
                                if (!match.isTopUp) {
                                    escrow = await escrow_model_1.default.create([data], { session });
                                    listing.depositConfirmed = true;
                                    listing.escrow = escrow[0]._id;
                                    await listing.save({ session });
                                }
                                else {
                                    escrow = await escrow_model_1.default.findOne({ _id: listing.escrow });
                                    await escrow_balance_queue_1.escrowBalanceQueue.add("topUpEscrow", {
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
                                (0, notify_ui_1.sendTransferNotification)(match.account.toString(), match);
                                mailservice_1.default.deposits.sendDepositSuccessMail(listing.account.email, { account: listing.account, intent: match });
                            }
                        }
                        catch (error) {
                            console.error("ETH Transaction error: ", error);
                            await session.abortTransaction();
                        }
                        finally {
                            session.endSession();
                        }
                    }
                }
            }
        });
        subscription.on("error", (err) => {
            console.error(`[ETH Native Listener Manager]: Subscription error for ${normalizedAddress}`, err);
            // You might want to restart the subscription here or handle errors
        });
        this.subscriptions.set(normalizedAddress, subscription);
        console.log(`[ETH Native Listener Manager]: Started listening on escrow address: ${normalizedAddress}`);
        (0, notify_ui_1.sendActiveListenerNotification)(accountId, {
            normalizedAddress,
            subscriptionData: subscription.processSubscriptionData,
        });
    }
    // Remove an escrow address listener
    async removeEscrowAddress(accountId, address) {
        const normalizedAddress = address.toLowerCase();
        const subscription = this.subscriptions.get(normalizedAddress);
        if (subscription) {
            await subscription.unsubscribe();
            this.subscriptions.delete(normalizedAddress);
            console.log(`[ETH Native Listener Manager]: Stopped listening on escrow address: ${normalizedAddress}`);
            (0, notify_ui_1.sendDeadListenerNotification)(accountId, normalizedAddress);
        }
    }
    // Remove all subscriptions to clean up
    async removeAll() {
        for (const [address, subscription] of this.subscriptions) {
            await subscription.unsubscribe();
            console.log(`[ETH Native Listener Manager]: Stopped listening on escrow address: ${address}`);
        }
        this.subscriptions.clear();
    }
}
exports.ETHNativeListenerManager = ETHNativeListenerManager;
