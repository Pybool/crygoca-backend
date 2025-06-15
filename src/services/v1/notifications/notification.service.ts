import { Socket } from "socket.io";
import {
  getAllAdminProfileSockets,
  getUserProfileSockets,
} from "../sockets/socketsStore.service";
import Xrequest from "../../../interfaces/extensions.interface";
import { NotificationModel } from "../../../models/notifications.model";
import { IWalletTransaction } from "../../../models/wallet-transaction.model";
import mailActions, { IEmailCheckoutData } from "../mail/mailservice";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import { formatTimestamp } from "../helpers";

export class NotificationService {
  static async sendNotificationToAdmins(notification: any) {
    try {
      const sockets: Socket[] = getAllAdminProfileSockets();
      if (sockets) {
        console.log(sockets);
        for (let socket of sockets) {
          socket.emit("notifications", JSON.stringify(notification));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async sendNotificationToUser(userId: string, data: {
    hasTransaction: boolean;
    walletTransaction: IWalletTransaction;
    notification: any;
  }) {
    try {
      const socket: any = getUserProfileSockets(userId);
      if (socket) {
        console.log(`Socket for user ${userId} found`);
        socket.emit("notifications", JSON.stringify(data));
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async sendNotification(notification: any): Promise<any> {
    try {
      if (notification) {
        NotificationService.sendNotificationToAdmins(notification);
        return { status: true, message: "Notification sent" };
      } else {
        return {
          status: false,
          message: "No Notification was found that matches the id provided",
        };
      }
    } catch (error: any) {
      console.error(error);
    }
  }

  static async getNotifications(req: Xrequest) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const searchText: string = (req.query.searchText as string) || "";
      const accountId: string = req.accountId as string;

      const skip = (page - 1) * limit;

      // Build the query object
      const query: Record<string, any> = { user: accountId };

      // Add search text filtering if provided
      if (searchText) {
        query.$or = [
          { title: { $regex: searchText, $options: "i" } }, // Example field for text search
          { message: { $regex: searchText, $options: "i" } }, // Adjust to match your schema
          { status: { $regex: searchText, $options: "i" } },
        ];
      }
      // Fetch paginated notifications
      const notifications = await NotificationModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Adjust sorting as per your requirement

      // Count total documents for pagination metadata
      const totalDocuments = await NotificationModel.countDocuments(query);
      const unreadCount = await NotificationModel.countDocuments({
        ...query,
        status: "UNREAD",
      });
      return {
        status: true,
        data: notifications,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalDocuments / limit),
          totalDocuments,
        },
        unreadCount,
      };
    } catch (error: any) {
      throw error;
    }
  }

  static async markNotification(req: Xrequest) {
    try {
      const { notificationId, status } = req.body!;
      if (["READ", "UNREAD"].includes(status) == false) {
        return {
          status: false,
          message: `Invalid notification status "${status}"`,
        };
      }
      const notification = await NotificationModel.findOne({
        _id: notificationId,
      });
      if (!notification) {
        return {
          status: false,
          message: `Failed to mark notification as ${status}`,
        };
      }
      notification.status = status;
      await notification.save();
      return {
        status: true,
        message: `Notification sucessfully marked as ${status}`,
        data: notification,
      };
    } catch (error: any) {
      throw error;
    }
  }

  static async createNewSellerPurchaseNotifications(listingPurchase: any) {
    //Notification for seller
    const userId = listingPurchase.cryptoListing.account._id;
    const verifiedTransaction = await VerifiedTransactions.findOne({
      tx_ref: listingPurchase?.checkOutId,
    });
    await NotificationModel.create({
      user: userId,
      title: `You have a new order "${listingPurchase?.checkOutId}"`,
      message: `${listingPurchase.account.username} purchased ${listingPurchase.units} of ${listingPurchase.cryptoListing.cryptoName} at ${verifiedTransaction!?.data?.currency}${verifiedTransaction!?.data?.amount || 'N/A'}`,
      createdAt: new Date(),
      status: "UNREAD",
      class: "info",
      meta: {
        url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}notifications?uid=${
          listingPurchase._id
        }`,
      },
    });
  
    
  
    if (verifiedTransaction) {
      const email: string = listingPurchase.cryptoListing.account.email;
      const date = formatTimestamp(listingPurchase.createdAt);
      const data: IEmailCheckoutData = {
        checkOutId: listingPurchase?.checkOutId,
        cryptoName: listingPurchase.cryptoListing.cryptoName,
        cryptoCode: listingPurchase.cryptoListing.cryptoCode,
        cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
        units: listingPurchase.units,
        currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
        amount: verifiedTransaction.data.amount,
        walletAddress: listingPurchase.walletAddress,
        buyerUserName: listingPurchase.account.username,
        sellerUserName: listingPurchase.cryptoListing.account.username,
        paymentOption: listingPurchase.paymentOption,
        date,
      };
      mailActions.orders.sendSellerOrderReceivedMail(email, data);
    }
  }
  
  static async createNewBuyerPurchaseNotifications (listingPurchase: any){
    //Notification for buyer
    const userId = listingPurchase.account._id;
    await NotificationModel.create({
      user: userId,
      title: `Your order ${listingPurchase?.checkOutId} was successful`,
      message: `You order "${listingPurchase?.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was successful. The seller has been notified.`,
      createdAt: new Date(),
      status: "UNREAD",
      class: "success",
      meta: {
        url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}notifications?uid=${
          listingPurchase._id
        }`,
      },
    });
  
    const verifiedTransaction = await VerifiedTransactions.findOne({
      tx_ref: listingPurchase?.checkOutId,
    });
    if (verifiedTransaction) {
      const email: string = listingPurchase.account.email;
      const date = listingPurchase.createdAt.toLocaleString("en-US", {
        weekday: "long", // "Monday"
        year: "numeric", // "2024"
        month: "long", // "December"
        day: "numeric", // "1"
        hour: "2-digit", // "08"
        minute: "2-digit", // "45"
        second: "2-digit", // "32"
        hour12: true, // 12-hour format with AM/PM
      });
      const data: IEmailCheckoutData = {
        checkOutId: listingPurchase?.checkOutId,
        cryptoName: listingPurchase.cryptoListing.cryptoName,
        cryptoCode: listingPurchase.cryptoListing.cryptoCode,
        cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
        units: listingPurchase.units,
        currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
        amount: verifiedTransaction.data.amount,
        walletAddress: listingPurchase.walletAddress,
        buyerUserName: listingPurchase.account.username,
        sellerUserName: listingPurchase.cryptoListing.account.username,
        paymentOption: listingPurchase.paymentOption,
        date,
      };
      mailActions.orders.sendBuyerOrderReceivedMail(email, data);
    }
  }

  static async createOrderAutoCompletionNotification(listingPurchase:any){
    const userId = listingPurchase.account._id;
    await NotificationModel.create({
      user: userId,
      title: `Your order ${listingPurchase?.checkOutId} was auto-completed`,
      message: `You order "${listingPurchase?.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was auto completed.`,
      createdAt: new Date(),
      status: "UNREAD",
      class: "success",
      meta: {
        url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}notifications?uid=${
          listingPurchase._id
        }`,
      },
    });

    const verifiedTransaction = await VerifiedTransactions.findOne({
      tx_ref: listingPurchase?.checkOutId,
    });
    if (verifiedTransaction) {
      const email: string = listingPurchase.account.email;
      const date = listingPurchase.createdAt.toLocaleString("en-US", {
        weekday: "long", // "Monday"
        year: "numeric", // "2024"
        month: "long", // "December"
        day: "numeric", // "1"
        hour: "2-digit", // "08"
        minute: "2-digit", // "45"
        second: "2-digit", // "32"
        hour12: true, // 12-hour format with AM/PM
      });
      const data: IEmailCheckoutData = {
        checkOutId: listingPurchase?.checkOutId,
        cryptoName: listingPurchase.cryptoListing.cryptoName,
        cryptoCode: listingPurchase.cryptoListing.cryptoCode,
        cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
        units: listingPurchase.units,
        currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
        amount: verifiedTransaction.data.amount,
        walletAddress: listingPurchase.walletAddress,
        buyerUserName: listingPurchase.account.username,
        sellerUserName: listingPurchase.cryptoListing.account.username,
        paymentOption: listingPurchase.paymentOption,
        date,
      };
      mailActions.orders.sendOrderAutoCompletionMail(email, data);
    }
  }
}
