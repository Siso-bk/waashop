import { Schema, model, models, Document, Types } from "mongoose";

export type PromoCardStatus = "PENDING" | "ACTIVE" | "REJECTED";

export interface IPromoCard extends Document {
  vendorId: Types.ObjectId;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  status: PromoCardStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCardSchema = new Schema<IPromoCard>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    title: { type: String, required: true },
    description: { type: String },
    ctaLabel: { type: String },
    ctaHref: { type: String },
    imageUrl: { type: String },
    status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

PromoCardSchema.index({ status: 1, createdAt: -1 });

export default models.PromoCard || model<IPromoCard>("PromoCard", PromoCardSchema);
