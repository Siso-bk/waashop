import { Schema, model, models, Document, Types } from "mongoose";

export type PurchaseStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface IPurchase extends Document {
  purchaseId: string;
  userId: Types.ObjectId;
  boxId: string;
  priceCoins: number;
  rewardCoins?: number;
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
    priceCoins: { type: Number, required: true },
    rewardCoins: { type: Number },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "PENDING" },
  },
  { timestamps: true }
);

PurchaseSchema.index({ userId: 1, createdAt: -1 });
PurchaseSchema.virtual("priceMinis")
  .get(function (this: IPurchase) {
    return this.priceCoins;
  })
  .set(function (this: IPurchase, value: number) {
    this.priceCoins = value;
  });
PurchaseSchema.virtual("rewardMinis")
  .get(function (this: IPurchase) {
    return this.rewardCoins;
  })
  .set(function (this: IPurchase, value: number) {
    this.rewardCoins = value;
  });

export default models.Purchase || model<IPurchase>("Purchase", PurchaseSchema);
