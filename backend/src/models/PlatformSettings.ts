import { Schema, model, models, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  feeMysteryBox: number;
  feeChallenge: number;
  feePromoCard: number;
  feeTopWinnerPercent: number;
  transferLimitMinis: number;
  transferFeePercent: number;
  shopTabs?: {
    key: string;
    label: string;
    order?: number;
    enabled?: boolean;
  }[];
}

const DEFAULT_SHOP_TABS = [
  { key: "mystery-boxes", label: "Mystery boxes", order: 0, enabled: true },
  { key: "products", label: "Products", order: 1, enabled: true },
  { key: "challenges", label: "Challenges", order: 2, enabled: true },
  { key: "coming-soon", label: "Coming soon", order: 3, enabled: true },
];

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    feeMysteryBox: { type: Number, default: 0 },
    feeChallenge: { type: Number, default: 0 },
    feePromoCard: { type: Number, default: 0 },
    feeTopWinnerPercent: { type: Number, default: 10 },
    transferLimitMinis: { type: Number, default: 5000 },
    transferFeePercent: { type: Number, default: 2 },
    shopTabs: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: DEFAULT_SHOP_TABS,
    },
  },
  { timestamps: true }
);

export default models.PlatformSettings || model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);
