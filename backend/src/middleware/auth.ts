import { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../services/auth";
import User, { IUser } from "../models/User";
import Vendor, { IVendor } from "../models/Vendor";
import { connectDB } from "../lib/db";
import { env } from "../config/env";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userDoc?: IUser;
      vendorDoc?: IVendor | null;
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
    const user = await authenticateToken(token);
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

const authenticateToken = async (token: string): Promise<IUser | null> => {
  try {
    const payload = verifySessionToken(token);
    await connectDB();
    return User.findById(payload.userId).exec();
  } catch (err) {
    if (!env.PAI_BASE_URL) {
      throw err;
    }
    return authenticatePaiToken(token);
  }
};

type PaiProfile = {
  id: string;
  email?: string;
  name?: string;
};

const authenticatePaiToken = async (token: string): Promise<IUser | null> => {
  const response = await fetch(`${env.PAI_BASE_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("PAI token invalid");
  }
  const profile = (await response.json()) as PaiProfile;
  const email = profile.email;
  if (!email) {
    throw new Error("PAI user missing email");
  }
  await connectDB();
  let user = await User.findOne({ email }).exec();
  if (!user) {
    user = new User({
      email,
      telegramId: `pai:${profile.id}`,
      firstName: profile.name,
      coinsBalance: 0,
      pointsBalance: 0,
      roles: ["customer"],
    });
    await user.save();
  }
  return user;
};

export const requireRole =
  (role: string) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.userDoc;
    if (!user || !user.roles?.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

export const loadVendor = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  await connectDB();
  const vendor = await Vendor.findOne({ ownerUserId: req.userId }).exec();
  req.vendorDoc = vendor;
  next();
};

export const requireApprovedVendor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const vendor = req.vendorDoc;
  if (!vendor) {
    return res.status(403).json({ error: "Vendor profile required" });
  }
  if (vendor.status !== "APPROVED") {
    return res.status(403).json({ error: `Vendor status: ${vendor.status}` });
  }
  next();
};
