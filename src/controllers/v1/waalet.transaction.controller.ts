import Xrequest from "../../interfaces/extensions.interface";
import { Request, Response } from "express";
import { IWalletTransaction } from "../../models/wallet-transaction.model";
import { ITransactionResponse, WalletTransactionService } from "../../services/v1/wallet/wallet-transactions.service";

export const fetchTransactions = async (req: Xrequest, res: Response) => {
  try {
    const walletTransactions: ITransactionResponse | null | undefined =
      await WalletTransactionService.fetchTransactions(req);
    if (!walletTransactions) {
      return res.status(400).json({
        status: false,
        message:
          "Failed to create your walletTransactions, please ensure you have updated preferred currency in profile section or try again later!",
      });
    }
    return res.status(200).json({
      status: true,
      message: "WalletTransactions fetched successfully",
      data: walletTransactions,
    });
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};
