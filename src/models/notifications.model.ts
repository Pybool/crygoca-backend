import mongoose, { Schema, Document } from "mongoose";

interface NotificationMeta {
  url: string;
  recordId?: string;
}

interface NotificationDocument extends Document {
  user: any;
  title: string;
  message: string;
  createdAt: Date;
  status: string;
  class: string;
  meta: NotificationMeta;
}

const NotificationSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: false,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ["UNREAD", "READ"],
    default: "UNREAD",
  },
  class: {
    type: String,
    required: true,
    enum: ["error", "info", "success", "warning"],
  },
  meta: {
    url: {
      type: String,
      required: true,
    },
  },
});

export const NotificationModel = mongoose.model<NotificationDocument>(
  "Notification",
  NotificationSchema
);
