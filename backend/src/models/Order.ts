import { Schema, model, models, Document, Types } from "mongoose";

export type OrderStatus =
  | "PLACED"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

export interface IOrder extends Document {
  buyerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  vendorOwnerId: Types.ObjectId;
  productId: Types.ObjectId;
  productType: "STANDARD";
  status: OrderStatus;
  amountMinis: number;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  notes?: string;
  trackingCode?: string;
  placedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  disputedAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;
  escrowReleased: boolean;
  disputeId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendorOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productType: { type: String, enum: ["STANDARD"], default: "STANDARD" },
    status: {
      type: String,
      enum: ["PLACED", "SHIPPED", "DELIVERED", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"],
      default: "PLACED",
    },
    amountMinis: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    shippingName: { type: String },
    shippingPhone: { type: String },
    shippingAddress: { type: String },
    notes: { type: String },
    trackingCode: { type: String },
    placedAt: { type: Date, default: Date.now },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
    disputedAt: { type: Date },
    refundedAt: { type: Date },
    cancelledAt: { type: Date },
    escrowReleased: { type: Boolean, default: false },
    disputeId: { type: Schema.Types.ObjectId, ref: "OrderDispute" },
  },
  { timestamps: true }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ vendorId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default models.Order || model<IOrder>("Order", OrderSchema);
