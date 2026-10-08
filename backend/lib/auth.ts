import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

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

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [method, salt, hex] = stored.split("$");
  if (method !== "scrypt" || !salt || !hex) return false;
  try {
    const expected = Buffer.from(hex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === 64 && timingSafeEqual(actual, expected);
  } catch { return false; }
}
