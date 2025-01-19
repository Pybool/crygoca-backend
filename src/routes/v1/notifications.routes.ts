import express, { Response } from "express";
import { decode, decodeExt } from "../../middlewares/jwt";
import Xrequest from "../../interfaces/extensions.interface";
import { NotificationService } from "../../services/v1/notifications/notification.service";

const notificationRouter = express.Router();
notificationRouter.get(
  "/fetch-notifications",
  decode,
  async (req: Xrequest, res: Response) => {
    try {
      const result = await NotificationService.getNotifications(req);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error?.message,
      });
    }
  }
);

notificationRouter.put(
    "/mark-notification",
    decode,
    async (req: Xrequest, res: Response) => {
      try {
        const result = await NotificationService.markNotification(req);
        return res.status(200).json(result);
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          message: "Failed to mark notification",
          error: error?.message,
        });
      }
    }
  );

export default notificationRouter;
