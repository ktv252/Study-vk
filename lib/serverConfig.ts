import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";
import { DEFAULT_SERVER_INFO } from "@/lib/serverInfo";

export async function getAllServerConfigs() {
  try {
    const db = await dbConnect();
    if (!db) return [DEFAULT_SERVER_INFO];

    const configs = await ServerConfig.find({}).lean();
    return configs.length ? configs : [DEFAULT_SERVER_INFO];
  } catch (error) {
    console.error("[getAllServerConfigs] Error fetching from DB, using fallback:", error);
    return [DEFAULT_SERVER_INFO];
  }
}
