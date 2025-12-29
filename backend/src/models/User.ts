import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  coinsBalance: number;
  pointsBalance: number;
  lastTopWinAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    username: String,
    coinsBalance: { type: Number, default: 0 },
    pointsBalance: { type: Number, default: 0 },
    lastTopWinAt: { type: Date },
  },
  { timestamps: true }
);

export default models.User || model<IUser>("User", UserSchema);
