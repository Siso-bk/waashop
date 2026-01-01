import { Schema, model, models, Document, Types } from "mongoose";

export type NotificationStatus = "UNREAD" | "READ";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String },
    meta: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["UNREAD", "READ"], default: "UNREAD" },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, status: 1 });

export default models.Notification || model<INotification>("Notification", NotificationSchema);
