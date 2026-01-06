import { Schema, model, models, Document, Types } from "mongoose";

export interface IRewardTier {
  minis: number;
  probability: number;
  isTop?: boolean;
}

export type ProductType = "MYSTERY_BOX" | "STANDARD" | "CHALLENGE" | "JACKPOT_PLAY";
export type ProductStatus = "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE";

export interface IProduct extends Document {
  vendorId: Types.ObjectId;
  name: string;
  description?: string;
  imageUrl?: string;
  type: ProductType;
  status: ProductStatus;
  categories?: string[];
  priceMinis: number;
  guaranteedMinMinis?: number;
  rewardTiers?: IRewardTier[];
  boxTotalTries?: number;
  boxTriesSold?: number;
  boxFundingMinis?: number;
  boxPoolRemaining?: number;
  jackpotWinOdds?: number;
  jackpotPoolMinis?: number;
  jackpotSeedPercent?: number;
  jackpotPlatformPercent?: number;
  jackpotVendorPercent?: number;
  jackpotLastWinAt?: Date;
  ticketPriceMinis?: number;
  ticketCount?: number;
  ticketsSold?: number;
  challengeWinnerUserId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const RewardTierSchema = new Schema<IRewardTier>(
  {
    minis: { type: Number, required: true },
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
  imageUrl: { type: String },
  type: { type: String, enum: ["MYSTERY_BOX", "STANDARD", "CHALLENGE", "JACKPOT_PLAY"], default: "MYSTERY_BOX" },
    status: { type: String, enum: ["DRAFT", "PENDING", "ACTIVE", "INACTIVE"], default: "DRAFT" },
    categories: { type: [String], default: [] },
    priceMinis: { type: Number, required: true },
    guaranteedMinMinis: { type: Number },
    rewardTiers: { type: [RewardTierSchema], default: undefined },
    boxTotalTries: { type: Number },
    boxTriesSold: { type: Number, default: 0 },
    boxFundingMinis: { type: Number },
    boxPoolRemaining: { type: Number },
    jackpotWinOdds: { type: Number },
    jackpotPoolMinis: { type: Number, default: 0 },
    jackpotSeedPercent: { type: Number },
    jackpotPlatformPercent: { type: Number },
    jackpotVendorPercent: { type: Number },
    jackpotLastWinAt: { type: Date },
    ticketPriceMinis: { type: Number },
    ticketCount: { type: Number },
    ticketsSold: { type: Number, default: 0 },
    challengeWinnerUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, type: 1 });

export default models.Product || model<IProduct>("Product", ProductSchema);
