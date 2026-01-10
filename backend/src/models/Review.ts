import { Schema, model, models, Document, Types } from "mongoose";

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  title?: string;
  body?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    body: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export default models.Review || model<IReview>("Review", ReviewSchema);
