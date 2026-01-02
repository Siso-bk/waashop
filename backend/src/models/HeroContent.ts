import { Schema, model, models, Document } from "mongoose";

export interface IHeroContent extends Document {
  slug: string;
  tagline: string;
  headline: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  primaryCtaAuthedLabel?: string;
  primaryCtaAuthedHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaAuthedLabel?: string;
  secondaryCtaAuthedHref?: string;
  backgroundClass?: string;
  textClass?: string;
  cards?: {
    id: string;
    tagline?: string;
    title: string;
    body: string;
    order?: number;
    imageUrl?: string;
    overlayOpacity?: number;
    ctaLabel?: string;
    ctaHref?: string;
    status?: "DRAFT" | "PUBLISHED";
    enabled?: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const HeroContentSchema = new Schema<IHeroContent>(
  {
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, default: "" },
    headline: { type: String, default: "" },
    description: { type: String, default: "" },
    primaryCtaLabel: { type: String, default: "Sign in" },
    primaryCtaHref: { type: String, default: "/login" },
    primaryCtaAuthedLabel: { type: String },
    primaryCtaAuthedHref: { type: String },
    secondaryCtaLabel: { type: String },
    secondaryCtaHref: { type: String },
    secondaryCtaAuthedLabel: { type: String },
    secondaryCtaAuthedHref: { type: String },
    backgroundClass: { type: String },
    textClass: { type: String },
    cards: [
      {
        id: { type: String, required: true },
        tagline: { type: String },
        title: { type: String, required: true },
        body: { type: String, required: true },
        order: { type: Number },
        imageUrl: { type: String },
        overlayOpacity: { type: Number },
        ctaLabel: { type: String },
        ctaHref: { type: String },
        status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "PUBLISHED" },
        enabled: { type: Boolean },
      },
    ],
  },
  { timestamps: true }
);

export default models.HeroContent || model<IHeroContent>("HeroContent", HeroContentSchema);
