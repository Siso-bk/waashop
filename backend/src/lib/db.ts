import mongoose from "mongoose";
import { env } from "../config/env";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(env.MONGODB_URI, { dbName: "waashop" });
  isConnected = true;
};

export const withMongoSession = async <T>(fn: (session: mongoose.ClientSession | null) => Promise<T>) => {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    try {
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      if (typeof result === "undefined") {
        throw new Error("Transaction returned no result");
      }
      return result;
    } catch (err) {
      const message = (err as Error).message || "";
      if (message.includes("Transaction numbers are only allowed")) {
        console.warn("Transactions unsupported, executing without session");
        return fn(null);
      }
      throw err;
    }
  } finally {
    session.endSession();
  }
};
