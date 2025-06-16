"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletFundingService = void 0;
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const transfers_queue_1 = require("../tasks/wallet/transfers.queue");
class WalletFundingService {
    static async cardTopUpFundWallet(req) {
        try {
            const { tx_ref, wallet } = req.body;
            const verifiedTransaction = await verifiedtransactions_model_1.default.findOne({
                tx_ref: tx_ref,
            });
            if (!verifiedTransaction) {
                return {
                    status: false,
                    message: "No verified transaction found for request",
                };
            }
            const meta = {
                walletAccountNo: wallet.walletAccountNo,
                operationType: "credit",
                verifiedTransactionId: verifiedTransaction._id,
            };
            await (0, transfers_queue_1.addWalletBalanceUpdateJob)("direct-topup", verifiedTransaction.data.amount, meta);
            return {
                status: true,
                message: "Please be patient , Wallet top up request is being processed",
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.WalletFundingService = WalletFundingService;
