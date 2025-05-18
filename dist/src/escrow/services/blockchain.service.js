"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToETH = exports.listenToERC20 = void 0;
const web3_1 = __importDefault(require("../config/web3"));
const dotenv_1 = __importDefault(require("dotenv"));
const tokens_config_1 = require("../config/tokens.config");
const depositIntent_model_1 = require("../../models/depositIntent.model");
const notify_ui_1 = require("./notify-ui");
const saleListing_model_1 = __importDefault(require("../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const mongoose_1 = __importDefault(require("mongoose")); // ✅ added mongoose
const escrow_balance_queue_1 = require("../queues/escrow-balance-queue");
const mailservice_1 = __importDefault(require("../../services/v1/mail/mailservice"));
dotenv_1.default.config();
const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS?.toLowerCase();
const listenToERC20 = async () => {
    console.log("Starting erc20 listener");
    const ERC20_TRANSFER_TOPIC = web3_1.default.utils.sha3("Transfer(address,address,uint256)");
    const subscription = await web3_1.default.eth.subscribe("logs", {
        address: tokens_config_1.ERC20_TOKENS.map((token) => token.address),
        topics: [
            ERC20_TRANSFER_TOPIC,
            null,
            web3_1.default.utils.padLeft(ESCROW_ADDRESS, 64),
        ],
    });
    subscription.on("data", async (log) => {
        const token = tokens_config_1.ERC20_TOKENS.find((t) => t.address.toLowerCase() === log.address.toLowerCase());
        if (!token)
            return;
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
        console.log("Match ", match);
        if (match) {
            const session = await mongoose_1.default.startSession();
            try {
                session.startTransaction();
                match.status = "confirmed";
                match.chainId = log.address;
                match.blockHash = log.blockHash;
                match.blockNumber = log.blockNumber.toString();
                match.txHash = log.transactionHash; // ✅ fixed from decoded.hash to log.transactionHash
                const listing = await saleListing_model_1.default.findOne({
                    _id: match.listing,
                })
                    .populate("account")
                    .populate("listing")
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
                        console.log({
                            buyerId: listing.account?._id?.toString(),
                            escrowId: escrow._id,
                            amount: filter.amount,
                        });
                        await escrow_balance_queue_1.escrowBalanceQueue.add("topUpEscrow", {
                            buyerId: listing.account?._id?.toString(),
                            escrowId: escrow._id,
                            amount: filter.amount,
                        });
                    }
                    await match.save({ session });
                }
                await session.commitTransaction();
                console.log(`ERC20 deposit confirmed for ${match.intentId}`);
                (0, notify_ui_1.sendTransferNotification)(match.account.toString(), match);
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
};
exports.listenToERC20 = listenToERC20;
const listenToETH = async () => {
    web3_1.default.eth.subscribe("pendingTransactions", async (err, txHash) => {
        if (err)
            return;
        const tx = await web3_1.default.eth.getTransaction(txHash);
        if (!tx || tx.to?.toLowerCase() !== ESCROW_ADDRESS)
            return;
        console.log("Pending transaction ", tx);
    });
    (await web3_1.default.eth.subscribe("newBlockHeaders")).on("data", async (blockHeader) => {
        const block = await web3_1.default.eth.getBlock(blockHeader.hash, true);
        block.transactions.forEach(async (tx) => {
            if (tx.to?.toLowerCase() === ESCROW_ADDRESS) {
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
                    console.log("Match ", match);
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
                            .populate("listing")
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
        });
    });
};
exports.listenToETH = listenToETH;
