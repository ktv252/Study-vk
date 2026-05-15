import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";

export const DEFAULT_SERVER_INFO = {
  webName: process.env.NEXT_PUBLIC_APP_NAME || "PowerStudy",
  sidebarLogoUrl: "/logo.png",
  sidebarTitle: "PowerStudy",
  tg_channel: "PwQuantum",
  tg_username: "PwQuantum",
  isDirectLoginOpen: true,
  tg_bot: "PWRAUTHBOT",
  shortner_servers: []
};

export async function getServerInfoInternal() {
  try {
    const db = await dbConnect();
    if (!db) return DEFAULT_SERVER_INFO;

    // If not connected, wait briefly but don't block forever
    if (db.connection.readyState !== 1) {
       for (let i = 0; i < 10; i++) {
         await new Promise(resolve => setTimeout(resolve, 100));
         if (db.connection.readyState === 1) break;
       }
    }

    // If still not connected, use fallbacks silently
    if (db.connection.readyState !== 1) {
       return DEFAULT_SERVER_INFO;
    }

    const rawConfig = await ServerConfig.findOne({ _id: 1 }).lean() as any;
    if (!rawConfig) {
      console.warn("[getServerInfoInternal] Server config not found in database. Using fallbacks.");
      return DEFAULT_SERVER_INFO;
    }

    // Manual reconstruction to ensure no hidden properties, toJSON methods, or Mongoose proxies remain
    return {
      webName: String(rawConfig.webName || DEFAULT_SERVER_INFO.webName),
      sidebarLogoUrl: String(rawConfig.sidebarLogoUrl || DEFAULT_SERVER_INFO.sidebarLogoUrl),
      sidebarTitle: String(rawConfig.sidebarTitle || DEFAULT_SERVER_INFO.sidebarTitle),
      tg_channel: String(rawConfig.tg_channel || DEFAULT_SERVER_INFO.tg_channel),
      tg_username: String(rawConfig.tg_username || DEFAULT_SERVER_INFO.tg_username),
      isDirectLoginOpen: Boolean(rawConfig.isDirectLoginOpen ?? DEFAULT_SERVER_INFO.isDirectLoginOpen),
      tg_bot: String(rawConfig.tg_bot || DEFAULT_SERVER_INFO.tg_bot),
      shortner_servers: Array.isArray(rawConfig.shortner_servers) 
        ? rawConfig.shortner_servers.map((s: any) => ({
            name: String(s.name),
            enabled: Boolean(s.enabled),
            api_url: String(s.api_url),
            api_key: String(s.api_key)
            // Explicitly NOT including _id here
          }))
        : DEFAULT_SERVER_INFO.shortner_servers
    };
  } catch (error) {
    console.error("[getServerInfoInternal] Error fetching from DB, using fallbacks:", error);
    return DEFAULT_SERVER_INFO;
  }
}
