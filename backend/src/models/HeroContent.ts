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
  },
  { timestamps: true }
);

export default models.HeroContent || model<IHeroContent>("HeroContent", HeroContentSchema);
