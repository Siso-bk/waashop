import mongoose from "mongoose";
import { env } from "@/lib/env";

type MongoConnection = {
  isConnected?: number;
};

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongoConnection;
};

const connection = globalWithMongoose.mongoose || { isConnected: 0 };

export const connectDB = async () => {
  if (connection.isConnected) {
    return;
  }

  const db = await mongoose.connect(env.MONGODB_URI, {
    dbName: "waashop",
  });

  connection.isConnected = db.connections[0]?.readyState;
  globalWithMongoose.mongoose = connection;
};

export const withMongoSession = async <T>(
  cb: (session: mongoose.ClientSession | null) => Promise<T>
) => {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    try {
      await session.withTransaction(async () => {
        result = await cb(session);
      });
      if (typeof result === "undefined") {
        throw new Error("Transaction did not return a value");
      }
      return result;
    } catch (error) {
      const message = (error as Error).message || "";
      if (message.includes("Transaction numbers are only allowed on a replica set member")) {
        console.warn("Mongo transactions unsupported, executing without session");
        return cb(null);
      }
      throw error;
    }
  } finally {
    session.endSession();
  }
};
