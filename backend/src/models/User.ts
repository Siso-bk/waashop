import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  minisBalance: number;
  lastTopWinAt?: Date | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    username: String,
    email: { type: String },
    coinsBalance: { type: Number, default: 0, alias: "minisBalance" },
    lastTopWinAt: { type: Date },
    roles: { type: [String], default: ["customer"] },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

export default models.User || model<IUser>("User", UserSchema);
