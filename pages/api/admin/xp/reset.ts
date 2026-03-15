import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devilboy@Supreme#Sattu@123_&^%$#@!1234567890";

function verifyAdminTokenFromCookie(req: NextApiRequest) {
  const token = req.cookies.admin_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && (decoded as any).admin) return decoded;
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const admin = verifyAdminTokenFromCookie(req);
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    const { userId, resetAll } = req.body;

    if (resetAll) {
      // Reset all users XP
      await User.updateMany({}, { $set: { xp: 0 } });
      const ServerConfig = (await import("@/models/ServerConfig")).default;
      await ServerConfig.findByIdAndUpdate(1, { xpLastResetDate: new Date() });
      
      return res.status(200).json({ success: true, message: "All users' XP reset successfully" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { xp: 0 }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "User XP reset successfully" });
  } catch (err: any) {
    console.error("Admin XP Reset Error:", err);
    return res.status(500).json({ message: "Server error", err: err.message });
  }
}
