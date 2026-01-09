import { Schema, model, models, Document, Types } from "mongoose";

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IWithdrawalRequest extends Document {
  userId: Types.ObjectId;
  amountMinis: number;
  payoutMethod: string;
  payoutMethodKey?: string;
  payoutMethodType?: string;
  payoutAddress?: string;
  accountName?: string;
  payoutBankName?: string;
  payoutAccountNumber?: string;
  payoutPhone?: string;
  payoutNetwork?: string;
  note?: string;
  status: WithdrawalStatus;
  adminNote?: string;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountMinis: { type: Number, required: true },
    payoutMethod: { type: String, required: true },
    payoutMethodKey: { type: String },
    payoutMethodType: { type: String },
    payoutAddress: { type: String },
    accountName: { type: String },
    payoutBankName: { type: String },
    payoutAccountNumber: { type: String },
    payoutPhone: { type: String },
    payoutNetwork: { type: String },
    note: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    adminNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

export default models.WithdrawalRequest ||
  model<IWithdrawalRequest>("WithdrawalRequest", WithdrawalRequestSchema);
