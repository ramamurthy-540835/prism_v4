import { NextResponse } from "next/server";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  await ensureSeeded();
  return NextResponse.json(await queryBigQuery(`SELECT g.*,p.name AS project_name,p.domain_tag FROM \`${env.projectId}.${env.dataset}.approval_gates\` g
    JOIN \`${env.projectId}.${env.dataset}.projects\` p ON p.id=g.project_id
    WHERE g.org_id=@orgId AND g.status='pending' ORDER BY g.created_at`, { orgId: user.orgId }));
}

export async function POST(req: Request) {
  const user = getSession(req);
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const { gateId, decision } = await req.json();
  if (!gateId || !["approved", "rejected"].includes(decision)) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  await ensureSeeded();
  await queryBigQuery(`BEGIN TRANSACTION;
    UPDATE \`${env.projectId}.${env.dataset}.approval_gates\` SET status=@decision,decided_by=@adminId,decided_at=CURRENT_TIMESTAMP()
      WHERE id=@gateId AND org_id=@orgId AND status='pending';
    UPDATE \`${env.projectId}.${env.dataset}.projects\` SET approval_status=@decision
      WHERE id IN (SELECT project_id FROM \`${env.projectId}.${env.dataset}.approval_gates\` WHERE id=@gateId AND decided_by=@adminId);
    COMMIT TRANSACTION;`, { decision, adminId: user.id, gateId, orgId: user.orgId });
  return NextResponse.json({ ok: true });
}
