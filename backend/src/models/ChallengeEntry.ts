import { Schema, model, models, Document, Types } from "mongoose";

export interface IChallengeEntry extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  ticketNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeEntrySchema = new Schema<IChallengeEntry>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticketNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

ChallengeEntrySchema.index({ productId: 1, ticketNumber: 1 }, { unique: true });

export default models.ChallengeEntry || model<IChallengeEntry>("ChallengeEntry", ChallengeEntrySchema);
