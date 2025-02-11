import {
  IuserDetails,
  IWalletTransaction,
  WalletTransaction,
} from "../../../models/wallet-transaction.model";
import { NotificationModel } from "../../../models/notifications.model";
import mailActions from "../mail/mailservice";
import { NotificationService } from "../notifications/notification.service";
import { IWallet } from "../../../models/wallet.model";
import { formatTimestamp } from "../helpers";

export class WalletNotificationService {
  public static async createCreditNotification(
    wallet:IWallet,
    walletTransaction: IWalletTransaction,
    isReversal: boolean = false
  ) {
    //Notification for credit alert
    if (typeof walletTransaction.user !== "object") {
      throw new Error("User is not populated!");
    }
    const reversalMsg = isReversal ? "reversal " : "";

    const user: IuserDetails = walletTransaction.user as IuserDetails;
    const notification: any = await NotificationModel.create({
      user: user._id,
      title: `Credit Alert! ${
        user.geoData.currency.symbol
      }${walletTransaction.amount.toFixed(2)} ${reversalMsg} on your wallet`,
      message: `Hi ${user.firstname}\n\nWe wish to inform you that a ${reversalMsg}credit transaction occured on your wallet`,
      createdAt: new Date(),
      status: "UNREAD",
      class: "success",
      meta: {
        url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}/notifications?uid=${
          walletTransaction._id
        }`,
      },
    });

    walletTransaction.createdAt = formatTimestamp(walletTransaction.createdAt)
    
    mailActions.wallet.sendCreditAlertMail(user.email, { walletTransaction, wallet });
    WalletNotificationService.sendSocketNotification(user._id, {
      hasTransaction: true,
      walletTransaction,
      notification,
      wallet
    });
    return notification;
  }

  public static async createDebitNotification(
    wallet:IWallet,
    walletTransaction: IWalletTransaction,
    isReversal: boolean = false
  ) {
    //Notification for debit alert
    if (typeof walletTransaction.user !== "object") {
      throw new Error("User is not populated!");
    }
    const reversalMsg = isReversal ? "reversal " : "";
    const user: IuserDetails = walletTransaction.user as IuserDetails;
    const notification: any = await NotificationModel.create({
      user: user._id,
      title: `Debit Alert! ${
        user.geoData.currency.symbol
      }${walletTransaction.amount.toFixed(2)} ${reversalMsg} on your wallet`,
      message: `Hi ${user.firstname}\n\nWe wish to inform you that a ${reversalMsg}debit transaction occured on your wallet`,
      createdAt: new Date(),
      status: "UNREAD",
      class: "error",
      meta: {
        url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}/notifications?uid=${
          walletTransaction._id
        }`,
      },
    });

    walletTransaction.createdAt = formatTimestamp(walletTransaction.createdAt)

    mailActions.wallet.sendDebitAlertMail(user.email, { walletTransaction, wallet });
    await WalletNotificationService.sendSocketNotification(user._id, {
      hasTransaction: true,
      walletTransaction,
      notification,
      wallet
    });
    return notification;
  }

  private static async sendSocketNotification(
    accountId: string,
    data: {
      hasTransaction: boolean;
      walletTransaction: IWalletTransaction;
      notification: any;
      wallet:IWallet
    }
  ) {
    await NotificationService.sendNotificationToUser(
      accountId.toString(),
      data
    );
  }
}
