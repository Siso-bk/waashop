import { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../services/auth";
import User, { IUser } from "../models/User";
import { connectDB } from "../lib/db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userDoc?: IUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = verifySessionToken(token);
    await connectDB();
    const user = await User.findById(payload.userId).exec();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.userId = user._id.toString();
    req.userDoc = user;
    next();
  } catch (error) {
    console.error("Auth middleware error", error);
    res.status(401).json({ error: "Invalid session" });
  }
};
