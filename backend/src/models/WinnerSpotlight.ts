import { Schema, model, models, Document, Types } from "mongoose";

export type WinnerType = "CHALLENGE" | "MYSTERY_BOX";

export interface IWinnerSpotlight extends Document {
  winnerType: WinnerType;
  productId?: Types.ObjectId;
  winnerUserId?: Types.ObjectId;
  winnerName: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  status: "PENDING" | "PUBLISHED";
}

const WinnerSpotlightSchema = new Schema<IWinnerSpotlight>(
  {
    winnerType: { type: String, enum: ["CHALLENGE", "MYSTERY_BOX"], required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    winnerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    winnerName: { type: String, required: true },
    headline: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    status: { type: String, enum: ["PENDING", "PUBLISHED"], default: "PUBLISHED" },
  },
  { timestamps: true }
);

export default models.WinnerSpotlight || model<IWinnerSpotlight>("WinnerSpotlight", WinnerSpotlightSchema);
