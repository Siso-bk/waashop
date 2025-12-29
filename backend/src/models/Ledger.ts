import { Schema, model, models, Document, Types } from "mongoose";

export interface ILedger extends Document {
  userId: Types.ObjectId;
  deltaCoins: number;
  deltaPoints: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const LedgerSchema = new Schema<ILedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deltaCoins: { type: Number, default: 0 },
    deltaPoints: { type: Number, default: 0 },
    reason: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LedgerSchema.index({ userId: 1, createdAt: -1 });

export default models.Ledger || model<ILedger>("Ledger", LedgerSchema);
