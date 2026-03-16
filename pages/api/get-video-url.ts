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
  const { batchId, subjectId, childId, videoContainerType = "DASH" } = req.query;

  try {
    const PW_API = process.env.PW_API;
    await dbConnect();

    const user = await authenticateUser(req, res);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

    for (const token of tokensToTry) {
      if (!token.accessToken || !token.randomId) {
        continue;
      }

      try {
        const url = `${PW_API}/v1/videos/video-url-details?type=BATCHES&videoContainerType=${videoContainerType}&reqType=query&childId=${childId}&parentId=${batchId}&clientVersion=201`;
        const headers = getVideoHeaders(token.accessToken, token.randomId);
        const response = await axios.get(url, { headers });

        return res.status(200).json(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.warn(
            `Token for owner ${token.ownerId} failed for batch ${batchId}. Attempting refresh...`
          );

          // Try to refresh the token if we have a refresh token
          let refreshed = false;
          if (token.refreshToken) {
            try {
              const refreshResponse = await axios.post(`${PW_API}/v3/oauth/token`, {
                refresh_token: token.refreshToken,
                grant_type: "refresh_token",
                client_id: "system-admin",
                client_secret: "KjPXuAVfC5xbmgreETNMaL7z",
              }, {
                headers: {
                  "client-id": "5eb393ee95fab7468a79d189",
                  "client-type": "WEB",
                  "client-version": "2.1.1",
                }
              });

              if (refreshResponse.data?.success && refreshResponse.data?.data) {
                const newData = refreshResponse.data.data;
                const newAccessToken = newData.access_token;
                const newRefreshToken = newData.refresh_token;

                // Update in User model
                await User.updateOne(
                  { _id: token.ownerId },
                  {
                    ActualToken: newAccessToken,
                    ActualRefresh: newRefreshToken,
                  }
                );

                // Update in ALL batches that use this owner's token
                await Batch.updateMany(
                  { "enrolledTokens.ownerId": token.ownerId },
                  {
                    $set: {
                      "enrolledTokens.$[elem].accessToken": newAccessToken,
                      "enrolledTokens.$[elem].refreshToken": newRefreshToken,
                      "enrolledTokens.$[elem].updatedAt": new Date(),
                      "enrolledTokens.$[elem].tokenStatus": true,
                    },
                  },
                  { arrayFilters: [{ "elem.ownerId": token.ownerId }] }
                );

                console.log(`Successfully refreshed token for owner ${token.ownerId}`);
                refreshed = true;

                // Retry original request with new token
                const retryUrl = `${PW_API}/v1/videos/video-url-details?type=BATCHES&videoContainerType=${videoContainerType}&reqType=query&childId=${childId}&parentId=${batchId}&clientVersion=201`;
                const retryHeaders = getVideoHeaders(newAccessToken, token.randomId || "");
                const retryResponse = await axios.get(retryUrl, { headers: retryHeaders });
                return res.status(200).json(retryResponse.data);
              }
            } catch (refreshErr: any) {
              console.error(`Token refresh failed for owner ${token.ownerId}:`, refreshErr.message);
            }
          }

          if (!refreshed) {
            console.warn(`Token for owner ${token.ownerId} finally failed. Removing from pool.`);
            await Batch.updateOne(
              { _id: batch._id },
              {
                $pull: {
                  enrolledTokens: { ownerId: token.ownerId },
                },
              }
            );
            // WE DO NOT pull from User.enrolledBatches anymore to keep it permanent/visible
          }
          continue;
        } else {
          const status = error.response?.status || 500;
          return res.status(status).json({
            success: false,
            message:
              error.response?.data?.message ||
              error.message ||
              "Something went wrong",
          });
        }
      }
    }

    return res.status(403).json({
      success: false,
      message:
        "This Batch is unavailable. Please logout and login again to fix this.",
    });
  } catch (error: any) {
    console.error("Outer error in get-video-url:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred",
    });
  }
}
