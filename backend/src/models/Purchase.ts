import { Schema, model, models, Document, Types } from "mongoose";

export type PurchaseStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface IPurchase extends Document {
  purchaseId: string;
  userId: Types.ObjectId;
  boxId: string;
  priceMinis: number;
  rewardMinis?: number;
  status: PurchaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    purchaseId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    boxId: { type: String, required: true },
    priceCoins: { type: Number, required: true, alias: "priceMinis" },
    rewardCoins: { type: Number, alias: "rewardMinis" },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
  },
  { timestamps: true }
);

PurchaseSchema.index({ userId: 1, createdAt: -1 });

export default models.Purchase || model<IPurchase>("Purchase", PurchaseSchema);
