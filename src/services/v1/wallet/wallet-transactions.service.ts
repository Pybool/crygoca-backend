import mongoose from "mongoose";
import Xrequest from "../../../interfaces/extensions.interface";
import {
  IWalletTransaction,
  WalletTransaction,
} from "../../../models/wallet-transaction.model";
import { WalletService } from "./wallet.service";
import { IWallet } from "../../../models/wallet.model";

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalDocuments: number;
}

export interface ITransactionResponse {
  wallet: IWallet | null | undefined;
  transactions: IWalletTransaction[]; // Replace with the type of your transactions if it's custom
  pagination: IPagination;
}

export class WalletTransactionService {
  public static async fetchTransactions(req: Xrequest) {
    try {
      // Extract query parameters
      let wallet:IWallet | null | undefined = null;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const searchText: string = (req.query.searchText as string) || "";
      const typeFilter: string = (req.query.type as string) || "";
      const operationTypeFilter: string =
        (req.query.operationType as string) || "";

      const accountId: string = req.accountId as string;
      const walletResponse = await WalletService.getWallet(new mongoose.Types.ObjectId(accountId));
      if(walletResponse.status){
        wallet = walletResponse.data;
      }
      const skip = (page - 1) * limit;

      // Build the query object
      const query: Record<string, any> = { user: accountId };

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
      const transactions = await WalletTransaction.find(query)
        .skip(skip)
        .limit(limit)
        .sort({createdAt: -1})
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
      const totalDocuments = await WalletTransaction.countDocuments(query);

      // Build the response with pagination metadata
      const response:ITransactionResponse = {
        transactions,
        wallet,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDocuments / limit),
          totalDocuments,
        },
      };

      return response;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to fetch transactions");
    }
  }
}
