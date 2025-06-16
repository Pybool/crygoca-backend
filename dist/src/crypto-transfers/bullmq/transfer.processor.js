"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTransfersWorker = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
const transferlog_model_1 = require("../../models/transferlog.model");
const queues_1 = require("./queues");
const transfer_service_1 = require("../services/transfer.service");
const listingPurchase_model_1 = __importDefault(require("../../models/listingPurchase.model"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const helpers_1 = require("../../services/v1/helpers");
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const depth = Number(process.env.ENC_DEPTH || '1');
const getPrivateKey = (blockchainWallet) => {
    const PRIVATE_KEY = (0, helpers_1.decryptDataString)(blockchainWallet.privateKey, depth);
    return PRIVATE_KEY;
};
const startTransfersWorker = () => {
    new bullmq_1.Worker("transfer-queue", async (job) => {
        const { userId, escrowId, checkOutId, recipient, type, amount, symbol, tokenAddress, decimals, blockchainWallet, } = job.data;
        const privateKey = getPrivateKey(blockchainWallet);
        try {
            let txHash = null;
            if (type === "native") {
                const escrowAccount = await escrow_model_1.default.findOne({ _id: escrowId });
                if (!escrowAccount) {
                    throw new Error("No escrow account was found for this listing");
                }
                if (escrowAccount.availableEscrowBalance < Number(amount)) {
                    throw new Error("No enough stock at this moment to service this order");
                }
                const session = await mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    txHash = await (0, transfer_service_1.transferNativeETH)(recipient, amount, privateKey);
                    if (txHash) {
                        const purchase = await listingPurchase_model_1.default.findOne({
                            checkOutId: checkOutId,
                        }).session(session);
                        if (!purchase) {
                            throw new Error("No purchase was found to update");
                        }
                        purchase.cryptoDispensed = true;
                        await purchase.save({ session });
                        await transferlog_model_1.TransferLog.create([
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
                        ], { session });
                        escrowAccount.availableEscrowBalance -= Number(amount);
                        await session.commitTransaction();
                        await queues_1.notificationQueue.add("notify", {
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
                }
                catch (error) {
                    console.log(error);
                    await session.abortTransaction();
                    throw error;
                }
                finally {
                    session.endSession();
                }
            }
            if (type === "erc20") {
                if (!tokenAddress || decimals === undefined)
                    throw new Error("Missing tokenAddress or decimals");
                const escrowAccount = await escrow_model_1.default.findOne({ _id: escrowId });
                if (!escrowAccount) {
                    throw new Error("No escrow account was found for this listing");
                }
                if (escrowAccount.availableEscrowBalance < Number(amount)) {
                    throw new Error("No enough stock at this moment to service this order");
                }
                const session = await mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    txHash = await (0, transfer_service_1.transferERC20)(checkOutId, tokenAddress, recipient, amount, decimals, privateKey);
                    if (txHash) {
                        const purchase = await listingPurchase_model_1.default.findOne({
                            checkOutId: checkOutId,
                        }).session(session);
                        if (!purchase) {
                            throw new Error("No purchase was found to update");
                        }
                        purchase.cryptoDispensed = true;
                        await purchase.save({ session });
                        await transferlog_model_1.TransferLog.create([
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
                        ], { session });
                        escrowAccount.availableEscrowBalance -= Number(amount);
                        await session.commitTransaction();
                        await queues_1.notificationQueue.add("notify", {
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
                }
                catch (error) {
                    console.log(error);
                    await session.abortTransaction();
                    throw error;
                }
                finally {
                    session.endSession();
                }
            }
        }
        catch (err) {
            console.log(err);
            console.error(`❌ Transfer failed: ${err.message}`);
            await transferlog_model_1.TransferLog.create({
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
            await queues_1.notificationQueue.add("notify", {
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
    }, {
        connection: { host: process.env.CRYGOCA_REDIS_HOST, port: 6379 },
        concurrency: 2,
        // settings: { retryProcessDelay: 5000 },
    });
};
exports.startTransfersWorker = startTransfersWorker;
//To solve the issue of knowing how much gasFee a wallet holds
// 1: Accumulate the gasFee somehwhere in database;
// 2: Each time a transfer is about to be made, substract the accumulated balance from the Wallet available balance
// 3: The moment we clear out any wallet reset the Accumulated gas fee for the wallet to zero
