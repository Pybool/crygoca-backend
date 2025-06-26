"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20ListenerManager = void 0;
const tokens_config_1 = require("../../config/tokens.config");
const depositIntent_model_1 = require("../../../models/depositIntent.model");
const mongoose_1 = __importDefault(require("mongoose"));
const saleListing_model_1 = __importDefault(require("../../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../../models/escrow.model"));
const escrow_balance_queue_1 = require("../../queues/escrow-balance-queue");
const notify_ui_1 = require("../notify-ui");
const mailservice_1 = __importDefault(require("../../../services/v1/mail/mailservice"));
const web3_1 = __importDefault(require("../../config/web3"));
const ERC20_TRANSFER_TOPIC = web3_1.default.utils.sha3("Transfer(address,address,uint256)");
const subscriptions = new Map();
class ERC20ListenerManager {
    // Add a new escrow address to listen on
    async addEscrowAddress(accountId, address) {
        const normalizedAddress = address.toLowerCase();
        if (subscriptions.has(normalizedAddress)) {
            console.log(`[ERC20 Listener Manager]: Already listening to ${normalizedAddress}`);
            return;
        }
        const subscription = await web3_1.default.eth.subscribe("logs", {
            address: tokens_config_1.ERC20_TOKENS.map((token) => token.address),
            topics: [
                ERC20_TRANSFER_TOPIC,
                null,
                web3_1.default.utils.padLeft(normalizedAddress, 64),
            ],
        });
        subscription.on("data", async (log) => {
            const token = tokens_config_1.ERC20_TOKENS.find((t) => t.address.toLowerCase() === log.address.toLowerCase());
            if (!token)
                return;
            if (log.topics[2].toLowerCase() !==
                web3_1.default.utils.padLeft(normalizedAddress, 64).toLowerCase()) {
                return; // filter out other escrow addresses
            }
            const decoded = web3_1.default.eth.abi.decodeLog([
                { type: "address", name: "from", indexed: true },
                { type: "address", name: "to", indexed: true },
                { type: "uint256", name: "value" },
            ], log.data, log.topics.slice(1));
            const value = Number(decoded.value) / 10 ** token.decimals;
            const filter = {
                sender: decoded.from.toLowerCase(),
                tokenAddress: token.address?.toLowerCase(),
                status: "pending",
                amount: value.toString(),
                receivingAddress: decoded.to?.toLowerCase(),
            };
            const match = await depositIntent_model_1.DepositIntent.findOne(filter);
            if (match) {
                const _accountId = match.account.toString();
                const session = await mongoose_1.default.startSession();
                try {
                    session.startTransaction();
                    match.status = "confirmed";
                    match.chainId = token.chainId.toString();
                    match.blockHash = log.blockHash;
                    match.blockNumber = log.blockNumber.toString();
                    match.txHash = log.transactionHash;
                    const listing = await saleListing_model_1.default.findOne({
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
                        let escrow;
                        if (!match.isTopUp) {
                            escrow = await escrow_model_1.default.create([data], { session });
                            listing.escrow = escrow[0]?._id;
                            listing.depositConfirmed = true;
                            await listing.save({ session });
                        }
                        else {
                            escrow = await escrow_model_1.default.findOne({ _id: listing.escrow });
                            await escrow_balance_queue_1.escrowBalanceQueue.add("topUpEscrow", {
                                buyerId: listing.account?._id?.toString(),
                                escrowId: escrow._id,
                                amount: filter.amount,
                            });
                        }
                        await match.save({ session });
                    }
                    await session.commitTransaction();
                    this.removeEscrowAddress(accountId, normalizedAddress);
                    (0, notify_ui_1.sendTransferNotification)(_accountId, match);
                    console.log(`📦 ERC20 (${token.symbol}) deposit: from ${decoded.from} → ${decoded.to} | amount: ${value}`);
                    mailservice_1.default.deposits.sendDepositSuccessMail(listing.account.email, {
                        account: listing.account,
                        intent: match,
                    });
                }
                catch (error) {
                    console.error("ERC20 Transaction error: ", error);
                    await session.abortTransaction();
                }
                finally {
                    session.endSession();
                }
            }
        });
        subscription.on("error", (err) => {
            console.error(`[ERC20 Listener Manager]: Subscription error for ${normalizedAddress}`, err);
            // You might want to restart the subscription here or handle errors
            (0, notify_ui_1.sendDeadListenerNotification)(accountId, normalizedAddress);
        });
        subscriptions.set(normalizedAddress, subscription);
        console.log(`[ERC20 Listener Manager]: Started listening on escrow address: ${normalizedAddress}`);
        (0, notify_ui_1.sendActiveListenerNotification)(accountId, {
            normalizedAddress,
            subscriptionData: subscription.processSubscriptionData,
        });
    }
    // Remove an escrow address listener
    async removeEscrowAddress(accountId, address) {
        const normalizedAddress = address.toLowerCase();
        const subscription = subscriptions.get(normalizedAddress);
        if (subscription) {
            await subscription.unsubscribe();
            subscriptions.delete(normalizedAddress);
            console.log(`[ERC20 Listener Manager]: Stopped listening on escrow address: ${normalizedAddress}`);
            (0, notify_ui_1.sendDeadListenerNotification)(accountId, normalizedAddress);
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
            console.log(`[ERC20 Listener Manager]: Stopped listening on escrow address: ${address}`);
        }
        subscriptions.clear();
    }
}
exports.ERC20ListenerManager = ERC20ListenerManager;
