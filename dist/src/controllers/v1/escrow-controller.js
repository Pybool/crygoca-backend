"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowController = void 0;
const escrow_manager_service_1 = require("../../services/v1/escrow/escrow-manager.service");
const tokens_config_1 = require("../../escrow/config/tokens.config");
const web3_1 = __importDefault(require("../../escrow/config/web3"));
const depositIntent_model_1 = require("../../models/depositIntent.model");
const mongoose_1 = __importDefault(require("mongoose"));
const saleListing_model_1 = __importDefault(require("../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const escrow_balance_queue_1 = require("../../escrow/queues/escrow-balance-queue");
const notify_ui_1 = require("../../escrow/services/notify-ui");
const erc_listener_manager_service_1 = require("../../escrow/services/listener-managers/erc-listener-manager.service");
const eth_native_listener_manager_service_1 = require("../../escrow/services/listener-managers/eth-native-listener-manager.service");
exports.EscrowController = {
    async createDepositIntent(req, res) {
        try {
            const data = req.body;
            if (!data.depositorAddress?.trim()) {
                return res.status(400).json({
                    status: true,
                    message: "Depositor Wallet Address is required",
                });
            }
            const result = await escrow_manager_service_1.EscrowManager.createDepositIntent(req);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error creating deposit intent:", error);
            res.status(500).json({ status: true, message: "Internal server error" });
        }
    },
    async fetchDepositIntents(req, res) {
        try {
            const result = await escrow_manager_service_1.EscrowManager.fetchDepositIntents(req);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Error fetching deposit intent:", error);
            res.status(500).json({ status: true, message: "Internal server error" });
        }
    },
    async lockFundsForOrder(req, res) {
        try {
            const { intentId, listingId, sellerId, buyerId, amount, checkoutId, walletToFund, toPay, selectedBank, } = req.body;
            const result = await escrow_manager_service_1.EscrowManager.lockFundsForOrder({
                intentId,
                listingId,
                sellerId,
                buyerId,
                amount,
                checkoutId,
                walletToFund,
                toPay,
                selectedBank,
            });
            res.status(200).json(result);
        }
        catch (err) {
            res.status(400).json({ message: err.message });
        }
    },
    async releaseFunds(req, res) {
        try {
            const { orderId } = req.params;
            const result = await escrow_manager_service_1.EscrowManager.releaseFunds(orderId);
            res.status(200).json({ success: result });
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    },
    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const result = await escrow_manager_service_1.EscrowManager.cancelOrder(orderId);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    },
    async getOrder(req, res) {
        try {
            const { orderId } = req.params;
            const order = await escrow_manager_service_1.EscrowManager.getOrder(orderId);
            res.status(200).json(order);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
    async getUserBalance(req, res) {
        try {
            const { userId } = req.params;
            const balance = await escrow_manager_service_1.EscrowManager.getUserBalance(userId);
            res.status(200).json(balance);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    },
    async manuallyConfirmDeposit(req, res) {
        const { sender, receivingAddress, amount, tokenSymbol } = req.body;
        if (!sender || !receivingAddress || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const token = tokens_config_1.ERC20_TOKENS.find((t) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase());
        if (!token) {
            return res.status(404).json({ error: "Token not recognized" });
        }
        try {
            const fromBlock = (await web3_1.default.eth.getBlockNumber()) - 5000n; // search past ~5000 blocks
            const logs = await web3_1.default.eth.getPastLogs({
                fromBlock,
                toBlock: "latest",
                address: token.address,
                topics: [
                    web3_1.default.utils.sha3("Transfer(address,address,uint256)"),
                    web3_1.default.utils.padLeft(sender.toLowerCase(), 64),
                    web3_1.default.utils.padLeft(receivingAddress.toLowerCase(), 64),
                ],
            });
            for (let log of logs) {
                const _log = log;
                const decoded = web3_1.default.eth.abi.decodeLog([
                    { type: "address", name: "from", indexed: true },
                    { type: "address", name: "to", indexed: true },
                    { type: "uint256", name: "value" },
                ], _log.data, _log.topics.slice(1));
                const decodedAmount = Number(decoded.value) / 10 ** token.decimals;
                if (Math.abs(decodedAmount - Number(amount)) > 0.00001)
                    continue;
                const filter = {
                    sender: decoded.from.toLowerCase(),
                    tokenAddress: token.address.toLowerCase(),
                    status: "pending",
                    amount: decodedAmount.toString(),
                    receivingAddress: decoded.to?.toLowerCase(),
                };
                const match = await depositIntent_model_1.DepositIntent.findOne(filter);
                if (!match)
                    continue;
                const session = await mongoose_1.default.startSession();
                try {
                    session.startTransaction();
                    match.status = "confirmed";
                    match.txHash = _log.transactionHash;
                    const listing = await saleListing_model_1.default.findOne({
                        _id: match.listing,
                    }).session(session);
                    if (listing) {
                        let escrow;
                        const data = {
                            account: listing.account?.toString(),
                            totalEscrowBalance: decodedAmount,
                            availableEscrowBalance: decodedAmount,
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
                                buyerId: listing.account,
                                escrowId: escrow._id,
                                amount: filter.amount,
                            });
                        }
                        await match.save({ session });
                        await session.commitTransaction();
                        (0, notify_ui_1.sendTransferNotification)(match.account.toString(), match);
                        if (match.tokenAddress !== "native_eth") {
                            await new erc_listener_manager_service_1.ERC20ListenerManager().removeEscrowAddress(match.account.toString(), match.receivingAddress);
                        }
                        else {
                            await new eth_native_listener_manager_service_1.ETHNativeListenerManager().removeEscrowAddress(match.account.toString(), match.receivingAddress);
                        }
                        return res.json({
                            status: true,
                            message: "Deposit confirmed manually.",
                        });
                    }
                }
                catch (err) {
                    await session.abortTransaction();
                    console.error("Manual confirmation error:", err);
                    return res.status(500).json({ error: "Transaction failed" });
                }
                finally {
                    session.endSession();
                }
            }
            return res
                .status(404)
                .json({ status: true, message: "No matching deposit found" });
        }
        catch (error) {
            console.error("Manual deposit lookup error:", error);
            return res.status(500).json({ error: "Server error" });
        }
    },
    async cancelDeposit(req, res) {
        try {
            const { orderId } = req.params;
            const result = await escrow_manager_service_1.EscrowManager.cancelDeposit(orderId);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    },
};
