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

    // Increment XP by 1 (1 XP per minute of watching)
    const amount = req.body.amount !== undefined ? parseFloat(req.body.amount) : 1;

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
