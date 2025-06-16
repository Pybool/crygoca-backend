"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransactions = void 0;
const wallet_transactions_service_1 = require("../../services/v1/wallet/wallet-transactions.service");
const fetchTransactions = async (req, res) => {
    try {
        const walletTransactions = await wallet_transactions_service_1.WalletTransactionService.fetchTransactions(req);
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
};
exports.fetchTransactions = fetchTransactions;
