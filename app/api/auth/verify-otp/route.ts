import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Batch from "@/models/Batch";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import ServerConfig from "@/models/ServerConfig";
import crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.LOG_CHANNEL_ID!;
const BASE_URL = process.env.PW_API;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ACCESS_EXPIRES_SECONDS = Number(process.env.JWT_ACCESS_EXPIRES_SECONDS || 3600);
const JWT_REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 15);

async function sendTelegramLog(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err: any) {
    console.error("Failed to send Telegram log:", err);
  }
}

function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/[^\d+]/g, "");
  return phone.startsWith("+") ? phone : "+91" + phone;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneNumber = body.phoneNumber || body.username;
    const otp = body.otp;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, message: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const db = await dbConnect();
    if (!db) {
       return NextResponse.json({ success: false, message: "Database connection failed." }, { status: 503 });
    }

    const config = await ServerConfig.findById(1);
    const isDirectLogin = config?.isDirectLoginOpen ?? false;

    let user = await User.findOne({ phoneNumber: normalizedPhone });

    if (!isDirectLogin && !user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const randomId = uuidv4();
    const response = await fetch(`${BASE_URL}/v3/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Randomid: randomId,
      },
      body: JSON.stringify({
        username: phoneNumber,
        otp: otp,
        client_id: "system-admin",
        client_secret: "KjPXuAVfC5xbmgreETNMaL7z",
        grant_type: "password",
        organizationId: "5eb393ee95fab7468a79d189",
        latitude: 0,
        longitude: 0,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.data) {
      return NextResponse.json({ success: false, message: "OTP verification failed!", data }, { status: 401 });
    }

    if (!user && isDirectLogin) {
      const userImage = data.data.user.imageId;
      user = await User.create({
        UserName: (data.data.user.firstName + " " + (data.data.user.lastName || "")).trim(),
        phoneNumber: normalizedPhone,
        telegramId: null,
        photoUrl: userImage?.baseUrl && userImage?.key ? userImage.baseUrl + userImage.key : null,
        tag: "user",
        tagExpiry: null,
        hasLoggedIn: false,
        enrolledBatches: [],
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Failed to load or create user" }, { status: 500 });
    }

    const realAccessToken = data.data.access_token;
    const realRefreshToken = data.data.refresh_token;

    user.ActualToken = realAccessToken;
    user.ActualRefresh = realRefreshToken;
    user.randomId = randomId; 
    await user.save();
    // --- Batch Sync Logic Start ---
    async function fetchPurchasedBatches(accessToken: string, amount: string) {
      const rid = uuidv4();
      const response = await fetch(
        `${BASE_URL}/batch-service/v1/batches/purchased-batches?page=1&type=ALL&amount=${amount}`,
        {
          method: "GET",
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Bearer ${accessToken}`,
            "client-id": "5eb393ee95fab7468a79d189",
            "client-type": "WEB",
            "client-version": "1.1.1",
            randomid: rid,
          },
        }
      );
      const resData = await response.json().catch(() => ({}));
      if (!resData.success || !Array.isArray(resData.data)) return [];
      return resData.data.map((item: any) => item.batch || item);
    }

    const { getBatchInfo } = await import("@/lib/batch");

    // Fetch both PAID and FREE batches
    const [paidBatches, freeBatches] = await Promise.all([
      fetchPurchasedBatches(realAccessToken, "paid"),
      fetchPurchasedBatches(realAccessToken, "free")
    ]);
    const allBatches = [...paidBatches, ...freeBatches];

    for (const batch of allBatches) {
      const batchDetails = await getBatchInfo(batch._id, "details");
      const batchDoc = {
        batchId: batch._id,
        batchName: batchDetails?.name || batch.name || "Unknown Batch",
        batchPrice: batchDetails?.fee?.total || 0,
        batchImage:
          batchDetails?.iosPreviewImageUrl ||
          (batchDetails?.previewImage?.baseUrl &&
          batchDetails?.previewImage?.key
            ? batchDetails.previewImage.baseUrl + batchDetails.previewImage.key
            : ""),
        template: batchDetails?.template || "NORMAL",
        BatchType: batchDetails?.fee?.total > 0 ? "PAID" : "FREE",
        language: batchDetails?.language || "English",
        byName: batchDetails?.byName || "Unknown",
        startDate: batchDetails?.startDate || "",
        endDate: batchDetails?.endDate || "",
        batchStatus: !(batchDetails?.isBlocked || batch.isBlocked),
      };
      
      const enrolledToken = {
        ownerId: user._id,
        accessToken: realAccessToken,
        refreshToken: realRefreshToken,
        tokenStatus: true,
        randomId,
        updatedAt: new Date(),
      };

      const existingBatch = await Batch.findOne({ batchId: batch._id });
      if (!existingBatch) {
        await Batch.create({ ...batchDoc, enrolledTokens: [enrolledToken] });
      } else {
        const tokenIdx = existingBatch.enrolledTokens.findIndex(
          (t: any) => t.ownerId.toString() === user!._id.toString()
        );
        if (tokenIdx !== -1) {
          existingBatch.enrolledTokens[tokenIdx] = enrolledToken;
        } else {
          existingBatch.enrolledTokens.push(enrolledToken);
        }
        Object.assign(existingBatch, batchDoc);
        await existingBatch.save();
      }
    }
    // --- Batch Sync Logic End ---

    const updateResult = await Batch.updateMany(
      { "enrolledTokens.ownerId": user._id },
      {
        $set: {
          "enrolledTokens.$[elem].accessToken": realAccessToken,
          "enrolledTokens.$[elem].refreshToken": realRefreshToken,
          "enrolledTokens.$[elem].updatedAt": new Date(),
          "enrolledTokens.$[elem].randomId": randomId,
          "enrolledTokens.$[elem].tokenStatus": true,
        },
      },
      {
        arrayFilters: [{ "elem.ownerId": user._id }],
      }
    );

    const payload = {
      userId: user._id,
      name: user.UserName,
      telegramId: user.telegramId,
      PhotoUrl: user.photoUrl,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_SECONDS,
    });

    let refreshToken = "";
    while (true) {
      refreshToken = crypto.randomBytes(64).toString("hex");
      if (!(await User.findOne({ refreshToken }))) break;
    }

    user.refreshToken = refreshToken;
    user.hasLoggedIn = true;
    await user.save();

    const res = NextResponse.json({
      success: true,
      message: "OTP verified",
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.UserName,
        telegramId: user.telegramId,
        photoUrl: user.photoUrl,
      },
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("accessToken", accessToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      maxAge: 60 * 60 * 24 * 15,
      sameSite: isProd ? "none" : "lax",
    });
    res.cookies.set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      maxAge: 60 * 60 * 24 * JWT_REFRESH_EXPIRES_DAYS,
      sameSite: isProd ? "none" : "lax",
    });

    return res;
  } catch (err: any) {
    console.error("OTP Verification Error:", err);
    return NextResponse.json({ success: false, message: "Server error", err: err.message }, { status: 500 });
  }
}
