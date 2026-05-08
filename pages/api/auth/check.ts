import type { NextApiRequest, NextApiResponse } from "next";
import { jwtVerify } from "jose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ authenticated: false, message: "Method not allowed" });
  }

  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_jwt_secret_for_development");
    await jwtVerify(token, secret);
    return res.status(200).json({ authenticated: true });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
