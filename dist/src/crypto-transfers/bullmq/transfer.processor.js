"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    new bullmq_1.Worker("transfer-queue", (job) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, escrowId, checkOutId, recipient, type, amount, symbol, tokenAddress, decimals, } = job.data;
        const [signer] = yield hre.ethers.getSigners();
        console.log("job.data ", job.data);
        try {
            let txHash = "";
            if (type === "native") {
                txHash = yield (0, transfer_service_1.transferNativeETH)(recipient, amount, signer);
            }
            if (type === "erc20") {
                if (!tokenAddress || decimals === undefined)
                    throw new Error("Missing tokenAddress or decimals");
                const escrowAccount = yield escrow_model_1.default.findOne({ _id: escrowId });
                if (!escrowAccount) {
                    throw new Error("No escrow accout was found for this listing");
                }
                if (escrowAccount.availableEscrowBalance < Number(amount)) {
                    throw new Error("No enough stock at this moment to service this order");
                }
                txHash = yield (0, transfer_service_1.transferERC20)(checkOutId, tokenAddress, recipient, amount, decimals, signer);
                if (txHash === null || txHash === void 0 ? void 0 : txHash.trim()) {
                    const purchase = yield listingPurchase_model_1.default.findOne({
                        checkOutId: checkOutId,
                    });
                    if (!purchase) {
                        throw new Error("No purchase was found to update");
                    }
                    purchase.cryptoDispensed = true;
                    yield purchase.save();
                    yield transferlog_model_1.TransferLog.create({
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
                    yield queues_1.notificationQueue.add("notify", {
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
            yield transferlog_model_1.TransferLog.create({
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
            yield queues_1.notificationQueue.add("notify", {
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
    }), {
        connection: { host: "127.0.0.1", port: 6379 },
        concurrency: 2,
        // settings: { retryProcessDelay: 5000 },
    });
};
exports.startTransfersWorker = startTransfersWorker;
