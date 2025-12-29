import { Schema, model, models, Document } from "mongoose";

export interface IRewardTier {
  points: number;
  probability: number;
  isTop?: boolean;
}

export interface IMysteryBox extends Document {
  boxId: string;
  name: string;
  priceCoins: number;
  guaranteedMinPoints: number;
  rewardTiers: IRewardTier[];
  isActive: boolean;
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

const MysteryBoxSchema = new Schema<IMysteryBox>(
  {
    boxId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    priceCoins: { type: Number, required: true },
    guaranteedMinPoints: { type: Number, required: true },
    rewardTiers: { type: [RewardTierSchema], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MysteryBoxSchema.index({ isActive: 1 });

export default models.MysteryBox || model<IMysteryBox>("MysteryBox", MysteryBoxSchema);
