import { createHmac, timingSafeEqual } from "crypto";

export type SessionUser = { id: string; email: string; role: "admin" | "member"; orgId: string };
const cookieName = "prism_session";
const signingKey = () => process.env.PRISM_SESSION_SECRET || process.env.DEMO_ADMIN_PASSWORD || "";

export function createSession(user: SessionUser) {
  if (!signingKey()) throw new Error("Session signing secret is not configured");
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 86400_000 })).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function getSession(req: Request): SessionUser | null {
  const cookie = req.headers.get("cookie")?.split("; ").find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!cookie || !signingKey()) return null;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", signingKey()).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp < Date.now() || !data.id || !data.orgId) return null;
    return { id: String(data.id), email: String(data.email), role: data.role === "admin" ? "admin" : "member", orgId: String(data.orgId) };
  } catch { return null; }
}

export const sessionCookie = cookieName;
