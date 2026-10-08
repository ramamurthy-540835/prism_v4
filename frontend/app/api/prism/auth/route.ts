import { NextResponse } from "next/server";
import { createSession, getSession, sessionCookie, verifyPassword } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";

export async function GET(req: Request) {
  const user = getSession(req);
  return NextResponse.json({ user }, { status: user ? 200 : 401 });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const adminEmail = process.env.PRISM_ADMIN_EMAIL || "ai@nelture.ai";
  const secret = process.env.DEMO_ADMIN_PASSWORD;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const suppliedPassword = String(password || "");
  let user;
  if (secret && normalizedEmail === adminEmail.toLowerCase() && suppliedPassword === secret) {
    user = { id: adminEmail, email: adminEmail, role: "admin" as const, orgId: "naturelabs" };
  } else if (normalizedEmail && suppliedPassword) {
    await ensureSeeded();
    const rows = await queryBigQuery<{ id: string; email: string; role: string; org_id: string; password_hash: string }>(
      `SELECT id,email,role,org_id,password_hash FROM \`${env.projectId}.${env.dataset}.users\`
       WHERE LOWER(email)=@email AND is_test_user=TRUE AND active=TRUE LIMIT 1`, { email: normalizedEmail });
    const account = rows[0];
    if (account && verifyPassword(suppliedPassword, account.password_hash))
      user = { id: account.id, email: account.email, role: "member" as const, orgId: account.org_id };
  }
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ user });
  response.cookies.set(sessionCookie, createSession(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
