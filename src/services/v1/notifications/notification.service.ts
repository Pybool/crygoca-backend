import { Socket } from "socket.io";
import {
  getAllAdminProfileSockets,
  getUserProfileSockets,
} from "../sockets/socketsStore.service";
import Xrequest from "../../../interfaces/extensions.interface";
import { NotificationModel } from "../../../models/notifications.model";
import { IWalletTransaction } from "../../../models/wallet-transaction.model";

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
}
