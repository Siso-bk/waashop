import { Schema, model, models, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  feeMysteryBox: number;
  feeChallenge: number;
  feePromoCard: number;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    feeMysteryBox: { type: Number, default: 0 },
    feeChallenge: { type: Number, default: 0 },
    feePromoCard: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.PlatformSettings || model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);
