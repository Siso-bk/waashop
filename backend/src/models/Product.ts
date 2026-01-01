import { Schema, model, models, Document, Types } from "mongoose";

export interface IRewardTier {
  points: number;
  probability: number;
  isTop?: boolean;
}

export type ProductType = "MYSTERY_BOX" | "STANDARD" | "CHALLENGE";
export type ProductStatus = "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE";

export interface IProduct extends Document {
  vendorId: Types.ObjectId;
  name: string;
  description?: string;
  type: ProductType;
  status: ProductStatus;
  priceCoins: number;
  guaranteedMinPoints?: number;
  rewardTiers?: IRewardTier[];
  ticketPriceCoins?: number;
  ticketCount?: number;
  ticketsSold?: number;
  challengeWinnerUserId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RewardTierSchema = new Schema<IRewardTier>(
  {
    points: { type: Number, required: true },
    probability: { type: Number, required: true },
    isTop: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["MYSTERY_BOX", "STANDARD", "CHALLENGE"], default: "MYSTERY_BOX" },
    status: { type: String, enum: ["DRAFT", "PENDING", "ACTIVE", "INACTIVE"], default: "DRAFT" },
    priceCoins: { type: Number, required: true },
    guaranteedMinPoints: { type: Number },
    rewardTiers: { type: [RewardTierSchema], default: undefined },
    ticketPriceCoins: { type: Number },
    ticketCount: { type: Number },
    ticketsSold: { type: Number, default: 0 },
    challengeWinnerUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, type: 1 });

export default models.Product || model<IProduct>("Product", ProductSchema);
