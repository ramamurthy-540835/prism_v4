import { NextResponse } from "next/server";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function POST(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { projectId, email } = await req.json();
  const memberEmail = String(email || "").trim().toLowerCase();
  if (!projectId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail)) return NextResponse.json({ error: "Valid project and email required" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<any>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\`
    WHERE id=@projectId AND org_id=@orgId AND (owner_id=@userId OR @isAdmin) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Only the project owner or an admin can add members" }, { status: 403 });
  const members = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.users\`
    WHERE LOWER(email)=@email AND org_id=@orgId AND active=TRUE LIMIT 1`, { email: memberEmail, orgId: user.orgId });
  if (!members[0]) return NextResponse.json({ error: "Add this person as a test user first" }, { status: 404 });
  await queryBigQuery(`MERGE \`${env.projectId}.${env.dataset}.project_members\` T
    USING (SELECT @projectId AS project_id,@userId AS user_id,@orgId AS org_id) S
    ON T.project_id=S.project_id AND T.user_id=S.user_id
    WHEN NOT MATCHED THEN INSERT (project_id,user_id,org_id,created_at) VALUES (S.project_id,S.user_id,S.org_id,CURRENT_TIMESTAMP())`,
    { projectId, userId: members[0].id, orgId: user.orgId });
  return NextResponse.json({ ok: true });
}
