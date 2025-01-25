import Xrequest from "../../../interfaces/extensions.interface";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import { addWalletBalanceUpdateJob } from "../tasks/wallet/transfers.queue";
import { ItopUps, WalletService } from "./wallet.service";

export class WalletFundingService {
  public static async cardTopUpFundWallet(req: Xrequest) {
    try {
      const { tx_ref, wallet } = req.body!;
      const verifiedTransaction = await VerifiedTransactions.findOne({
        tx_ref: tx_ref,
      });
      if (!verifiedTransaction) {
        return {
          status: false,
          message: "No verified transaction found for request",
        };
      }
      const meta: ItopUps = {
        walletAccountNo: wallet.walletAccountNo,
        operationType: "credit",
        verifiedTransactionId: verifiedTransaction._id,
      };

      await addWalletBalanceUpdateJob(
        "direct-topup",
        verifiedTransaction.data.amount,
        meta
      );
      return {
        status: true,
        message: "Please be patient , Wallet top up request is being processed",
      };

    } catch (error: any) {
      throw error;
    }
  }
}
