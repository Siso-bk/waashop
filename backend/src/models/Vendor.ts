import { Schema, model, models, Document, Types } from "mongoose";

export type VendorStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface IVendor extends Document {
  ownerUserId: Types.ObjectId;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerHandle?: string;
  businessType?: "INDIVIDUAL" | "COMPANY";
  country?: string;
  city?: string;
  businessAddress?: string;
  website?: string;
  logoUrl?: string;
  categories?: string[];
  fulfillmentMethod?: "SHIPPING" | "DIGITAL" | "SERVICE";
  processingTime?: "SAME_DAY" | "1_3_DAYS" | "3_7_DAYS" | "7_14_DAYS";
  returnsPolicy?: string;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    ownerHandle: { type: String },
    businessType: { type: String, enum: ["INDIVIDUAL", "COMPANY"] },
    country: { type: String },
    city: { type: String },
    businessAddress: { type: String },
    website: { type: String },
    logoUrl: { type: String },
    categories: [{ type: String }],
    fulfillmentMethod: { type: String, enum: ["SHIPPING", "DIGITAL", "SERVICE"] },
    processingTime: { type: String, enum: ["SAME_DAY", "1_3_DAYS", "3_7_DAYS", "7_14_DAYS"] },
    returnsPolicy: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

VendorSchema.index({ status: 1, createdAt: -1 });

export default models.Vendor || model<IVendor>("Vendor", VendorSchema);
