import { Schema, model, models, Document, Types } from "mongoose";

export type DisputeStatus = "PENDING" | "RESOLVED";
export type DisputeResolution = "REFUND" | "RELEASE" | "REJECTED";

export interface IOrderDispute extends Document {
  orderId: Types.ObjectId;
  buyerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  status: DisputeStatus;
  reason: string;
  description?: string;
  resolution?: DisputeResolution;
  adminNote?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderDisputeSchema = new Schema<IOrderDispute>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    status: { type: String, enum: ["PENDING", "RESOLVED"], default: "PENDING" },
    reason: { type: String, required: true },
    description: { type: String },
    resolution: { type: String, enum: ["REFUND", "RELEASE", "REJECTED"] },
    adminNote: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

OrderDisputeSchema.index({ orderId: 1 });
OrderDisputeSchema.index({ status: 1, createdAt: -1 });

export default models.OrderDispute || model<IOrderDispute>("OrderDispute", OrderDisputeSchema);
