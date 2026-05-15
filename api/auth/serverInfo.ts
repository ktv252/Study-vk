import type { NextApiRequest, NextApiResponse } from "next";
import { getServerInfoInternal } from "@/lib/serverInfo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const serverInfo = await getServerInfoInternal();
  
  if (!serverInfo) {
    return res.status(404).json({ error: "Server config not found" });
  }

  return res.status(200).json(serverInfo);
}
