import { Schema, model, models, Document, Types } from "mongoose";

export type OrderStatus =
  | "PLACED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED"
  | "REJECTED"
  | "DAMAGED"
  | "UNSUCCESSFUL";

export type OrderEventActor = "system" | "vendor" | "buyer" | "admin";

export interface IOrderEvent {
  status: OrderStatus;
  note?: string;
  actor: OrderEventActor;
  createdAt: Date;
}

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
  events?: IOrderEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderEventSchema = new Schema<IOrderEvent>(
  {
    status: { type: String, required: true },
    note: { type: String },
    actor: { type: String, enum: ["system", "vendor", "buyer", "admin"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendorOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productType: { type: String, enum: ["STANDARD"], default: "STANDARD" },
    status: {
      type: String,
      enum: [
        "PLACED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "COMPLETED",
        "DISPUTED",
        "REFUNDED",
        "CANCELLED",
        "REJECTED",
        "DAMAGED",
        "UNSUCCESSFUL",
      ],
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
    events: { type: [OrderEventSchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ vendorId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default models.Order || model<IOrder>("Order", OrderSchema);
