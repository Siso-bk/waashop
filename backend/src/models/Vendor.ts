import { Schema, model, models, Document, Types } from "mongoose";

export type VendorStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface IVendor extends Document {
  ownerUserId: Types.ObjectId;
  name: string;
  description?: string;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

VendorSchema.index({ status: 1, createdAt: -1 });

export default models.Vendor || model<IVendor>("Vendor", VendorSchema);
