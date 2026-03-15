import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '@/lib/mongodb';
import User from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Get top 5 users by XP
    const topUsers = await User.find({})
      .sort({ xp: -1 })
      .limit(5)
      .select("UserName photoUrl xp")
      .lean();

    return res.status(200).json({ success: true, leaderboard: topUsers });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
}
