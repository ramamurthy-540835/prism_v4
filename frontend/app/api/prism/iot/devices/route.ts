import { NextResponse } from "next/server";
import { createHash, randomBytes, randomUUID } from "crypto";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";

const validId = (value: string) => /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId") || "";
  if (!projectId) return NextResponse.json({ error: "Project required" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\` p
    WHERE p.id=@projectId AND p.org_id=@orgId AND p.domain_tag='Industrial IoT'
      AND (p.owner_id=@userId OR @isAdmin OR EXISTS
        (SELECT 1 FROM \`${env.projectId}.${env.dataset}.project_members\` m WHERE m.project_id=p.id AND m.user_id=@userId)) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Project unavailable" }, { status: 403 });
  const devices = await queryBigQuery(`SELECT id,device_id,active,created_at FROM \`${env.projectId}.${env.dataset}.iot_device_keys\`
    WHERE project_id=@projectId AND org_id=@orgId ORDER BY created_at DESC`, { projectId, orgId: user.orgId });
  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json();
  const projectId = String(body.projectId || "");
  const deviceId = String(body.deviceId || "").trim();
  if (!projectId || !validId(deviceId)) return NextResponse.json({ error: "Valid project and device ID required" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\`
    WHERE id=@projectId AND org_id=@orgId AND domain_tag='Industrial IoT'
      AND (owner_id=@userId OR @isAdmin) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Only the project owner or an admin can register devices" }, { status: 403 });
  const key = `prism_iot_${randomBytes(32).toString("base64url")}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const id = randomUUID();
  await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.iot_device_keys\`
    (id,org_id,project_id,device_id,key_hash,active,created_at,created_by)
    VALUES (@id,@orgId,@projectId,@deviceId,@keyHash,TRUE,CURRENT_TIMESTAMP(),@userId)`,
    { id, orgId: user.orgId, projectId, deviceId, keyHash, userId: user.id });
  return NextResponse.json({ id, deviceId, key, message: "Save this key now. It is shown only once." }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json();
  const projectId = String(body.projectId || "");
  const deviceKeyId = String(body.deviceKeyId || "");
  if (!projectId || !deviceKeyId) return NextResponse.json({ error: "Project and device key required" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\`
    WHERE id=@projectId AND org_id=@orgId AND domain_tag='Industrial IoT'
      AND (owner_id=@userId OR @isAdmin) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Only the project owner or an admin can revoke devices" }, { status: 403 });
  await queryBigQuery(`UPDATE \`${env.projectId}.${env.dataset}.iot_device_keys\` SET active=FALSE
    WHERE id=@deviceKeyId AND project_id=@projectId AND org_id=@orgId`, { deviceKeyId, projectId, orgId: user.orgId });
  return NextResponse.json({ revoked: true });
}
