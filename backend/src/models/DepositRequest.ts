import { Schema, model, models, Document, Types } from "mongoose";

export type DepositStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IDepositRequest extends Document {
  userId: Types.ObjectId;
  amountMinis: number;
  currency?: string;
  paymentMethod: string;
  paymentReference?: string;
  proofUrl?: string;
  note?: string;
  status: DepositStatus;
  adminNote?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  minisCredited?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DepositRequestSchema = new Schema<IDepositRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountMinis: { type: Number, required: true },
    currency: { type: String },
    paymentMethod: { type: String, required: true },
    paymentReference: { type: String },
    proofUrl: { type: String },
    note: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    adminNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    minisCredited: { type: Number },
  },
  { timestamps: true }
);

DepositRequestSchema.index({ userId: 1, createdAt: -1 });
DepositRequestSchema.index({ status: 1, createdAt: -1 });

export default models.DepositRequest || model<IDepositRequest>("DepositRequest", DepositRequestSchema);
