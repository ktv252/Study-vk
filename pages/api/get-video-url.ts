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
  const { batchId, subjectId, childId } = req.query;

  try {
    const PW_API = process.env.PW_API;
    if (!PW_API) {
      return res.status(500).json({ success: false, message: "PW_API is not configured" });
    }
    await dbConnect();

    const user = await authenticateUser(req, res);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // --- Verification Check ---
    const ServerConfigModel = (await import("@/models/ServerConfig")).default;
    const config: any = await ServerConfigModel.findOne({ _id: 1 }).lean();

    if (config?.verificationEnabled) {
      const now = new Date();
      const u = user as any;
      const expiresAt = u.shortnerExpiresAt ? new Date(u.shortnerExpiresAt) : null;

      if (!expiresAt || expiresAt < now) {
        return res.status(402).json({
          success: false,
          message: "Verification required",
          verificationRequired: true,
          verificationUrl: "/api/shortner/generate"
        });
      }
    }
    // --------------------------

    if (!batchId || !subjectId || !childId) {
      return res.status(400).json({
        message: "`batchId`, `subjectId`, and `childId` are required",
      });
    }

    const batch = await Batch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const tokensToTry = [...batch.enrolledTokens];
    if (tokensToTry.length === 0) {
      return res.status(403).json({
        success: false,
        message: "This Batch is currently unavailable (no active seed accounts). Please contact admin.",
      });
    }

    let lastErrorResponse: any = null;

    for (const token of tokensToTry) {
      // Proceed if we have at least an accessToken. randomId can be generated if missing.
      if (!token.accessToken) {
        continue;
      }

      // If tokenStatus is explicitly false, we might want to skip it if it was marked failing by refresh cycle.
      if (token.tokenStatus === false) {
        continue;
      }

      const effectiveRandomId = token.randomId || (await import("uuid")).v4();

      try {
        const url = `${PW_API}/v1/videos/video-url-details?type=BATCHES&videoContainerType=DASH&reqType=query&childId=${childId}&parentId=${batchId}&clientVersion=201`;
        const headers = getVideoHeaders(token.accessToken, effectiveRandomId);
        const response = await axios.get(url, { headers });

        if (response.data?.success === false) {
          console.warn(`Token for owner ${token.ownerId} returned failure response:`, response.data.message);
          lastErrorResponse = response.data;
          continue;
        }

        return res.status(200).json(response.data);
      } catch (error: any) {
        const status = error.response?.status;
        lastErrorResponse = error.response?.data || { message: error.message };

        if (status === 401) {
          console.warn(
            `Token for owner ${token.ownerId} failed for batch ${batchId} with 401. Removing it.`
          );

          await Batch.updateOne(
            { _id: batch._id },
            {
              $pull: {
                enrolledTokens: { ownerId: token.ownerId },
              },
            }
          );

          if (token.ownerId) {
            await User.updateOne(
              { _id: token.ownerId },
              { $pull: { enrolledBatches: { batchId: String(batchId) } } }
            );
          }
          continue;
        } else {
          console.warn(
            `Token for owner ${token.ownerId} failed for batch ${batchId} with status ${status}. Trying next token if available.`
          );
          // For other errors (403, 429, 500 etc), we continue to try other tokens in the pool
          continue;
        }
      }
    }

    return res.status(403).json({
      success: false,
      message:
        lastErrorResponse?.message || 
        "This Batch is unavailable. Please contact admin to add this batch.",
    });
  } catch (error: any) {
    console.error("Outer error in get-video-url:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred",
    });
  }
}
