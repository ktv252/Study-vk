import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser } from "@/utils/authenticateUser";
import ServerConfig from "@/models/ServerConfig";
import dbConnect from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

    await dbConnect();
    const user = await authenticateUser(req, res);
    if (!user) {
        // If checking status, return unauth. If verifying, this endpoint is for generation, so yes unauth.
        return res.status(401).json({ message: "Unauthorized" });
    }

    const config = await ServerConfig.findOne({ _id: 1 });
    if (!config?.verificationEnabled) {
        return res.status(200).json({ verified: true, message: "Verification not required" });
    }

    // Check if already verified
    if (user.shortnerExpiresAt && new Date(user.shortnerExpiresAt) > new Date()) {
        return res.status(200).json({ verified: true, message: "Already verified" });
    }

    const servers = config.shortner_servers.filter(s => s.enabled);
    if (servers.length === 0) {
        return res.status(200).json({ verified: true, message: "No shortener servers available" });
    }

    const server = servers[Math.floor(Math.random() * servers.length)];

    // Generate token
    const token = jwt.sign({
        userId: user._id,
        purpose: 'verification',
        iat: Math.floor(Date.now() / 1000)
    }, JWT_SECRET, { expiresIn: '1h' });

    // Construct callback URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/api/shortner/verify?token=${token}`;

    // Call shortener
    try {
        // Standard AdLinkFly / similar API: api_url?api=KEY&url=URL
        const apiUrl = `${server.api_url}?api=${server.api_key}&url=${encodeURIComponent(callbackUrl)}&format=text`;
        const response = await fetch(apiUrl);
        const text = await response.text();

        // If format=text, response is just the URL. If it fails, it might be JSON error.
        // Let's try to parse as JSON first in case verify format param is ignored
        try {
            const json = JSON.parse(text);
            if (json.shortenedUrl) {
                return res.status(200).json({ verified: false, url: json.shortenedUrl });
            }
            if (json.status === 'error') {
                throw new Error(json.message);
            }
        } catch (e) {
            // Not JSON, assume text is the URL if it starts with http
            if (text.startsWith('http')) {
                return res.status(200).json({ verified: false, url: text.trim() });
            }
        }

        console.warn("Shortener raw response:", text);
        return res.status(500).json({ message: "Failed to generate short link", details: text });

    } catch (error: any) {
        console.error("Shortener error:", error);
        return res.status(500).json({ message: "Error contacting shortener service", error: error.message });
    }
}
