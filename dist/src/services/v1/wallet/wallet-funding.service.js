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
exports.WalletFundingService = void 0;
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const transfers_queue_1 = require("../tasks/wallet/transfers.queue");
class WalletFundingService {
    static cardTopUpFundWallet(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tx_ref, wallet } = req.body;
                const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
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
                yield (0, transfers_queue_1.addWalletBalanceUpdateJob)("direct-topup", verifiedTransaction.data.amount, meta);
                return {
                    status: true,
                    message: "Please be patient , Wallet top up request is being processed",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.WalletFundingService = WalletFundingService;
