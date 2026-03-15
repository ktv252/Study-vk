// pages/api/getEnrolledBatches.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";
import dbConnect from '@/lib/mongodb';
import UserModel from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authUser = await authenticateUser(req, res); // just decodes JWT
    await dbConnect(); // ensure DB connection

    const user: any = await UserModel.findById(authUser._id).lean().exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Gather IDs from user enrollment
    const userBatches = user.enrolledBatches || [];
    const userBatchIds = userBatches.map((b: any) => b.batchId);

    // Fetch details for Enrolled batches from local DB
    // This avoids N+1 API calls on the client side
    const Batch = (await import("@/models/Batch")).default;
    const allDetailedBatches = await Batch.find({
      batchId: { $in: userBatchIds }
    })
      .select("batchId batchName batchImage startDate endDate language batchPrice byName BatchType _id") // select only needed fields
      .sort({ createdAt: -1 })
      .lean();

    // Map to a consistent format
    const formattedBatches = allDetailedBatches.map((b: any) => ({
      _id: b._id.toString(),
      batchId: b.batchId,
      name: b.batchName,
      batchName: b.batchName, // provide both for compatibility
      batchImage: b.batchImage,
      startDate: b.startDate,
      endDate: b.endDate,
      language: b.language,
      batchPrice: b.batchPrice,
      byName: b.byName,
      isFree: b.BatchType === "FREE"
    }));

    return res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        name: user.UserName,
        phoneNumber: user.phoneNumber,
        telegramId: user.telegramId,
        PhotoUrl: user.photoUrl,
        tag: user.tag ?? null,
        xp: user.xp || 0,
      },
      enrolledBatches: formattedBatches,
    });

  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
}
