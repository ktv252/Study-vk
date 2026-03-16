import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import Batch from "@/models/Batch";
import { getVideoHeaders } from "@/utils/auth";
import dbConnect from "@/lib/mongodb";
import { authenticateUser } from "@/utils/authenticateUser";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Normalize query parameters
  const bId = Array.isArray(batchId) ? batchId[0] : batchId;
  const sId = Array.isArray(subjectId) ? subjectId[0] : subjectId;
  const cId = Array.isArray(childId) ? childId[0] : childId;
  const vType = Array.isArray(videoContainerType) ? videoContainerType[0] : videoContainerType;

  try {
    const PW_API = process.env.PW_API;
    await dbConnect();

    const user = await authenticateUser(req, res);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (!bId || !sId || !cId) {
      return res.status(400).json({
        message: "`batchId`, `subjectId`, and `childId` are required",
      });
    }

    const batch = await Batch.findOne({ batchId: bId });

    if (!batch) {
      console.warn(`Batch not found in DB: ${bId}`);
      return res.status(404).json({ message: "Batch not found" });
    }

    // Prioritize current user's token
    const enrolledTokens = batch.enrolledTokens || [];
    const ownToken = enrolledTokens.find(
      (t: any) => t.ownerId && t.ownerId.toString() === user._id.toString()
    );
    const otherTokens = enrolledTokens.filter(
      (t: any) => !t.ownerId || t.ownerId.toString() !== user._id.toString()
    );

    const tokensToTry = ownToken ? [ownToken, ...otherTokens] : otherTokens;

    if (tokensToTry.length === 0) {
      console.warn(`No tokens available for batch ${bId}`);
    }

    let lastError: any = null;

    for (const token of tokensToTry) {
      if (!token.accessToken || !token.randomId) continue;

      try {
        const url = `${PW_API}/v1/videos/video-url-details?type=BATCHES&videoContainerType=${vType}&reqType=query&childId=${cId}&parentId=${bId}&clientVersion=201`;
        const headers = getVideoHeaders(token.accessToken, token.randomId);
        const response = await axios.get(url, { headers });

        if (response.data?.success) {
          return res.status(200).json(response.data);
        }
        lastError = response.data;
      } catch (error: any) {
        lastError = error;
        if (error.response?.status === 401) {
          console.warn(`Token 401 for owner ${token.ownerId} on batch ${bId}. Cleaning up.`);

          await Batch.updateOne(
            { _id: batch._id },
            { $pull: { enrolledTokens: { ownerId: token.ownerId } } }
          );

          if (token.ownerId) {
            await User.updateOne(
              { _id: token.ownerId },
              { $pull: { enrolledBatches: { batchId: String(bId) } } }
            );
          }
        } else {
          console.error(`PW API Error (${error.response?.status || 500}) for batch ${bId}:`, error.message);
        }
        continue;
      }
    }

    return res.status(403).json({
      success: false,
      message: lastError?.response?.data?.message || lastError?.message || "This Batch is unavailable. Please contact admin.",
      debug: { tokensTried: tokensToTry.length }
    });
  } catch (error: any) {
    console.error("Critical error in get-video-url:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred",
    });
  }
}
