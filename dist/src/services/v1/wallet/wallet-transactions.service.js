"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_transaction_model_1 = require("../../../models/wallet-transaction.model");
const wallet_service_1 = require("./wallet.service");
class WalletTransactionService {
    static async fetchTransactions(req) {
        try {
            // Extract query parameters
            let wallet = null;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const searchText = req.query.searchText || "";
            const typeFilter = req.query.type || "";
            const operationTypeFilter = req.query.operationType || "";
            const accountId = req.accountId;
            const walletResponse = await wallet_service_1.WalletService.getWallet(new mongoose_1.default.Types.ObjectId(accountId));
            if (walletResponse.status) {
                wallet = walletResponse.data;
            }
            const skip = (page - 1) * limit;
            // Build the query object
            const query = { user: accountId };
            if (typeFilter) {
                query.type = typeFilter;
            }
            if (operationTypeFilter) {
                query.operationType = operationTypeFilter;
            }
            // Add search text filter if needed
            if (searchText) {
                query.$or = [{ type: searchText }, { operationType: searchText }];
            }
            // Query transactions with filters and pagination
            const transactions = await wallet_transaction_model_1.WalletTransaction.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate({
                path: "payout",
                model: "Payout", // Ensure the model name matches
                populate: {
                    path: "cryptoListingPurchase",
                    model: "cryptolistingpurchase",
                    populate: {
                        path: "cryptoListing",
                        model: "cryptolisting",
                        populate: {
                            path: "cryptoCurrency",
                            model: "cryptocurrencies",
                        },
                    },
                },
            })
                .exec();
            // Count total documents for pagination metadata
            const totalDocuments = await wallet_transaction_model_1.WalletTransaction.countDocuments(query);
            // Build the response with pagination metadata
            const response = {
                transactions,
                wallet,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalDocuments / limit),
                    totalDocuments,
                },
            };
            return response;
        }
        catch (error) {
            console.error("Error fetching transactions:", error);
            throw new Error("Failed to fetch transactions");
        }
    }
}
exports.WalletTransactionService = WalletTransactionService;
