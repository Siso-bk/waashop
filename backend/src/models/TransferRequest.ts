import { Schema, model, models, Document, Types } from "mongoose";

export type TransferStatus = "PENDING" | "COMPLETED" | "REJECTED";

export interface ITransferRequest extends Document {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientHandle: string;
  amountMinis: number;
  feeMinis: number;
  status: TransferStatus;
  note?: string;
  adminNote?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransferRequestSchema = new Schema<ITransferRequest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientHandle: { type: String, required: true },
    amountMinis: { type: Number, required: true },
    feeMinis: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "REJECTED"], default: "PENDING" },
    note: { type: String },
    adminNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

TransferRequestSchema.index({ senderId: 1, createdAt: -1 });
TransferRequestSchema.index({ recipientId: 1, createdAt: -1 });
TransferRequestSchema.index({ status: 1, createdAt: -1 });

export default models.TransferRequest ||
  model<ITransferRequest>("TransferRequest", TransferRequestSchema);
