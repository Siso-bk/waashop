import { connectDB } from "@/lib/db";
import MysteryBox from "@/models/MysteryBox";
import Ledger from "@/models/Ledger";
import { IUser } from "@/models/User";

export const getActiveBoxes = async () => {
  await connectDB();
  const boxes = await MysteryBox.find({ isActive: true }).lean();
  return boxes;
};

export const getBoxByBoxId = async (boxId: string) => {
  await connectDB();
  return MysteryBox.findOne({ boxId, isActive: true }).lean();
};

export const getRecentLedger = async (user: IUser, limit = 50) => {
  await connectDB();
  return Ledger.find({ userId: user._id }).sort({ createdAt: -1 }).limit(limit).lean();
};
