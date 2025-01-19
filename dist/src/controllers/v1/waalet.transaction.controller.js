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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransactions = void 0;
const wallet_transactions_service_1 = require("../../services/v1/wallet/wallet-transactions.service");
const fetchTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const walletTransactions = yield wallet_transactions_service_1.WalletTransactionService.fetchTransactions(req);
        if (!walletTransactions) {
            return res.status(400).json({
                status: false,
                message: "Failed to create your walletTransactions, please ensure you have updated preferred currency in profile section or try again later!",
            });
        }
        return res.status(200).json({
            status: true,
            message: "WalletTransactions fetched successfully",
            data: walletTransactions,
        });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.fetchTransactions = fetchTransactions;
