import { Schema, model, models, Document } from "mongoose";

export interface IHighlightCard {
  key: string;
  eyebrow?: string;
  title: string;
  description?: string;
  guestCtaLabel?: string;
  guestCtaHref?: string;
  authedCtaLabel?: string;
  authedCtaHref?: string;
  backgroundClass?: string;
  textClass?: string;
  borderClass?: string;
}

export interface IHomeHighlights extends Document {
  slug: string;
  cards: IHighlightCard[];
  createdAt: Date;
  updatedAt: Date;
}

const HighlightCardSchema = new Schema<IHighlightCard>(
  {
    key: { type: String, required: true },
    eyebrow: String,
    title: { type: String, required: true },
    description: String,
    guestCtaLabel: String,
    guestCtaHref: String,
    authedCtaLabel: String,
    authedCtaHref: String,
    backgroundClass: String,
    textClass: String,
    borderClass: String,
  },
  { _id: false }
);

const HomeHighlightsSchema = new Schema<IHomeHighlights>(
  {
    slug: { type: String, required: true, unique: true },
    cards: { type: [HighlightCardSchema], default: [] },
  },
  { timestamps: true }
);

export default models.HomeHighlights || model<IHomeHighlights>("HomeHighlights", HomeHighlightsSchema);
