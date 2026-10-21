import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { bigquery, queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";
import { parseIotReading } from "@backend/lib/iot";

const timestamp = (value: unknown) => typeof value === "object" && value !== null && "value" in value
  ? String((value as { value: unknown }).value) : String(value || "");

export async function POST(req: Request) {
  const key = req.headers.get("x-prism-device-key") || "";
  if (!/^prism_iot_[A-Za-z0-9_-]{40,60}$/.test(key))
    return NextResponse.json({ error: "Valid device key required" }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 16_384) return NextResponse.json({ error: "Reading is too large" }, { status: 413 });
  let reading;
  try { reading = parseIotReading(JSON.parse(raw)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid reading" }, { status: 400 }); }
  await ensureSeeded();
  const keyHash = createHash("sha256").update(key).digest("hex");
  const devices = await queryBigQuery<{ org_id: string; project_id: string; device_id: string }>(
    `SELECT k.org_id,k.project_id,k.device_id FROM \`${env.projectId}.${env.dataset}.iot_device_keys\` k
     JOIN \`${env.projectId}.${env.dataset}.projects\` p ON p.id=k.project_id AND p.org_id=k.org_id
     WHERE k.key_hash=@keyHash AND k.active=TRUE AND p.domain_tag='Industrial IoT'
       AND (p.approval_status='approved' OR p.approval_status IS NULL) LIMIT 1`, { keyHash });
  const device = devices[0];
  if (!device) return NextResponse.json({ error: "Device key is inactive or project unavailable" }, { status: 403 });
  const id = randomUUID();
  await bigquery().dataset(env.dataset).table("iot_readings").insert([{
    id, org_id: device.org_id, project_id: device.project_id, device_id: device.device_id,
    plant_id: reading.plantId, line_id: reading.lineId, observed_at: reading.observedAt,
    received_at: new Date().toISOString(), signals_json: JSON.stringify(reading.signals)
  }]);
  return NextResponse.json({ id, status: "accepted", observedAt: reading.observedAt }, { status: 202 });
}

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const projectId = params.get("projectId") || "";
  const plantId = params.get("plantId") || "";
  if (!projectId || (plantId && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(plantId)))
    return NextResponse.json({ error: "Valid project and plant ID required" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\` p
    WHERE p.id=@projectId AND p.org_id=@orgId AND p.domain_tag='Industrial IoT'
      AND (p.owner_id=@userId OR @isAdmin OR EXISTS
        (SELECT 1 FROM \`${env.projectId}.${env.dataset}.project_members\` m WHERE m.project_id=p.id AND m.user_id=@userId)) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Project unavailable" }, { status: 403 });
  const rows = await queryBigQuery<{ id: string; device_id: string; plant_id: string; line_id: string; observed_at: unknown; received_at: unknown; signals_json: string }>(
    `SELECT id,device_id,plant_id,line_id,observed_at,received_at,signals_json
     FROM \`${env.projectId}.${env.dataset}.iot_readings\`
     WHERE org_id=@orgId AND project_id=@projectId AND (@plantId='' OR plant_id=@plantId)
     ORDER BY observed_at DESC LIMIT 50`, { orgId: user.orgId, projectId, plantId });
  return NextResponse.json(rows.map((row) => ({
    id: row.id, deviceId: row.device_id, plantId: row.plant_id, lineId: row.line_id,
    observedAt: timestamp(row.observed_at), receivedAt: timestamp(row.received_at),
    signals: JSON.parse(row.signals_json || "{}")
  })), { headers: { "Cache-Control": "no-store" } });
}
