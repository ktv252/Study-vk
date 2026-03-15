import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '@/lib/mongodb';
import User from "@/models/User";
import { authenticateUser } from "@/utils/authenticateUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();
    let currentUserRank = -1;
    let currentUserData = null;

    try {
      const user = await authenticateUser(req, res);
      if (user) {
        // Find current user's rank
        const count = await User.countDocuments({ xp: { $gt: user.xp } });
        currentUserRank = count + 1;
        currentUserData = {
          _id: user._id,
          UserName: user.UserName,
          photoUrl: user.photoUrl || "",
          xp: user.xp || 0
        };
      }
    } catch (authError) {
      // Not authenticated, just skip rank info
    }

    // Get top 5 users by XP
    const topUsers = await User.find({})
      .sort({ xp: -1 })
      .limit(5)
      .select("UserName photoUrl xp")
      .lean();

    const ServerConfig = (await import("@/models/ServerConfig")).default;
    const config = await ServerConfig.findById(1);

    return res.status(200).json({ 
      success: true, 
      leaderboard: topUsers,
      userRank: currentUserRank,
      userData: currentUserData,
      lastResetDate: config?.xpLastResetDate || new Date()
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
