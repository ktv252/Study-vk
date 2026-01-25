import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import ServerConfig from "@/models/ServerConfig";
import dbConnect from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).send("Missing token");

    await dbConnect();

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (!decoded.userId || decoded.purpose !== 'verification') throw new Error("Invalid token");

        const config = await ServerConfig.findOne({ _id: 1 });
        const durationHours = config?.verificationDuration || 36;

        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        await User.updateOne({ _id: decoded.userId }, { shortnerExpiresAt: expiresAt });

        // Redirect to study page
        res.redirect('/study?verified=true');
    } catch (error) {
        res.status(400).send("Verification failed or expired. Please try again.");
    }
}
