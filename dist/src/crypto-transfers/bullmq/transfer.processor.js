"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTransfersWorker = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
const hre = require("hardhat");
const transferlog_model_1 = require("../../models/transferlog.model");
const queues_1 = require("./queues");
const transfer_service_1 = require("../services/transfer.service");
const listingPurchase_model_1 = __importDefault(require("../../models/listingPurchase.model"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
dotenv_1.default.config();
const startTransfersWorker = () => {
    new bullmq_1.Worker("transfer-queue", async (job) => {
        const { userId, escrowId, checkOutId, recipient, type, amount, symbol, tokenAddress, decimals, } = job.data;
        const [signer] = await hre.ethers.getSigners();
        console.log("job.data ", job.data);
        try {
            let txHash = "";
            if (type === "native") {
                txHash = await (0, transfer_service_1.transferNativeETH)(recipient, amount, signer);
            }
            if (type === "erc20") {
                if (!tokenAddress || decimals === undefined)
                    throw new Error("Missing tokenAddress or decimals");
                const escrowAccount = await escrow_model_1.default.findOne({ _id: escrowId });
                if (!escrowAccount) {
                    throw new Error("No escrow accout was found for this listing");
                }
                if (escrowAccount.availableEscrowBalance < Number(amount)) {
                    throw new Error("No enough stock at this moment to service this order");
                }
                txHash = await (0, transfer_service_1.transferERC20)(checkOutId, tokenAddress, recipient, amount, decimals, signer);
                if (txHash?.trim()) {
                    const purchase = await listingPurchase_model_1.default.findOne({
                        checkOutId: checkOutId,
                    });
                    if (!purchase) {
                        throw new Error("No purchase was found to update");
                    }
                    purchase.cryptoDispensed = true;
                    await purchase.save();
                    await transferlog_model_1.TransferLog.create({
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
                    await queues_1.notificationQueue.add("notify", {
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
        }
        catch (err) {
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
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 2,
        // settings: { retryProcessDelay: 5000 },
    });
};
exports.startTransfersWorker = startTransfersWorker;
