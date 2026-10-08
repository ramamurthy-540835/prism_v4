import { NextResponse } from "next/server";
import { createSession, getSession, sessionCookie } from "@backend/lib/auth";

export async function GET(req: Request) {
  const user = getSession(req);
  return NextResponse.json({ user }, { status: user ? 200 : 401 });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const adminEmail = process.env.PRISM_ADMIN_EMAIL || "ai@nelture.ai";
  const secret = process.env.DEMO_ADMIN_PASSWORD;
  if (!secret || String(email).toLowerCase() !== adminEmail.toLowerCase() || String(password) !== secret)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const user = { id: adminEmail, email: adminEmail, role: "admin" as const, orgId: "naturelabs" };
  const response = NextResponse.json({ user });
  response.cookies.set(sessionCookie, createSession(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
