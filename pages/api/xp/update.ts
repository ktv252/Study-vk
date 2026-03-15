import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser } from "@/utils/authenticateUser";
import dbConnect from '@/lib/mongodb';
import User from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authUser = await authenticateUser(req, res);
    await dbConnect();

    // Fetch user to check last update time
    const user = await User.findById(authUser._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Server-side throttle: Only allow XP update once every 50 seconds
    const now = new Date();
    const lastUpdate = user.lastXpUpdate ? new Date(user.lastXpUpdate) : new Date(0);
    const secondsSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;

    // We use 50s instead of 60s to account for slight network jitter
    if (secondsSinceLastUpdate < 50) {
      return res.status(200).json({ 
        success: true, 
        xp: user.xp,
        message: "Throttled: Updated too recently" 
      });
    }

    // Increment XP by 1
    const amount = req.body.amount !== undefined ? parseFloat(req.body.amount) : 1;

    user.xp = (user.xp || 0) + amount;
    user.lastXpUpdate = now;
    await user.save();

    return res.status(200).json({ success: true, xp: user.xp });
  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
}
