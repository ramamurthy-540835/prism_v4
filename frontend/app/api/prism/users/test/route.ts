import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { getSession, hashPassword } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";

function admin(req: Request) {
  const user = getSession(req);
  return user?.role === "admin" ? user : null;
}

export async function GET(req: Request) {
  const user = admin(req);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  await ensureSeeded();
  const rows = await queryBigQuery(`SELECT id,email,name,active,created_at FROM \`${env.projectId}.${env.dataset}.users\`
    WHERE org_id=@orgId AND is_test_user=TRUE ORDER BY created_at DESC`, { orgId: user.orgId });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = admin(req);
  if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 100)
    return NextResponse.json({ error: "Enter a valid name and email" }, { status: 400 });
  if (email === (process.env.PRISM_ADMIN_EMAIL || "ai@nelture.ai").toLowerCase())
    return NextResponse.json({ error: "Use a different email from the admin account" }, { status: 400 });
  await ensureSeeded();
  const existing = await queryBigQuery(`SELECT id FROM \`${env.projectId}.${env.dataset}.users\` WHERE LOWER(email)=@email LIMIT 1`, { email });
  if (existing.length) return NextResponse.json({ error: "This email already has an account" }, { status: 409 });
  const password = randomBytes(18).toString("base64url");
  const id = randomUUID();
  await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.users\`
    (id,email,password_hash,name,role,org_id,created_at,is_test_user,active)
    VALUES (@id,@email,@passwordHash,@name,'member',@orgId,CURRENT_TIMESTAMP(),TRUE,TRUE)`,
    { id, email, passwordHash: hashPassword(password), name, orgId: user.orgId });
  return NextResponse.json({ id, email, name, password }, { status: 201 });
}
