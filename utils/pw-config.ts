export const PW_CONFIG = {
  baseUrl: (process.env.PW_API || "https://api.penpencil.co").replace(/\/$/, ""),
  organizationId:
    process.env.PW_ORGANIZATION_ID || "5eb393ee95fab7468a79d189",
  referer: process.env.PW_REFERER || "https://www.pw.live/",
  accept: process.env.PW_ACCEPT || "application/json",
  contentType: process.env.PW_CONTENT_TYPE || "application/json",
  clientId: process.env.PW_CLIENT_ID || "system-admin",
  clientSecret: process.env.PW_CLIENT_SECRET || "",
  grantType: process.env.PW_GRANT_TYPE || "password",
  latitude: Number(process.env.PW_LATITUDE || 0),
  longitude: Number(process.env.PW_LONGITUDE || 0),
};

export function requirePwClientSecret() {
  if (!PW_CONFIG.clientSecret) {
    throw new Error("PW_CLIENT_SECRET is not configured");
  }
  return PW_CONFIG.clientSecret;
}
