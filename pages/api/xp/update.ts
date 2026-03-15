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

    // Default increment is 1/6th of an XP (since we update every 10 seconds to reach 1 XP/min)
    const amount = req.body.amount !== undefined ? parseFloat(req.body.amount) : 0.16666666666666666;

    // Increment XP
    const updatedUser = await User.findByIdAndUpdate(
      authUser._id,
      { $inc: { xp: amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, xp: updatedUser.xp });
  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
}
