import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

const domains = ["Tax & GST", "Income Tax", "Textile Exports", "Property Auctions", "Finance", "Stock Exchange", "Industrial IoT", "Climate/IPCC", "Agriculture", "Careers", "Sales", "Other"];
export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  await ensureSeeded();
  const rows = await queryBigQuery<any>(`SELECT p.*, (p.owner_id=@userId OR @isAdmin) AS can_edit FROM \`${env.projectId}.${env.dataset}.projects\` p
    WHERE p.org_id=@orgId AND (p.visibility='public' OR p.owner_id=@userId OR @isAdmin
      OR EXISTS (SELECT 1 FROM \`${env.projectId}.${env.dataset}.project_members\` m WHERE m.project_id=p.id AND m.user_id=@userId))
      AND (p.approval_status='approved' OR p.approval_status IS NULL OR p.owner_id=@userId OR @isAdmin)
    ORDER BY p.created_at DESC`, { orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  const domain = String(body.domainTag || "");
  const description = String(body.description || "").trim();
  const repositoryUrl = String(body.repositoryUrl || "").trim();
  const visibility = body.visibility === "private" ? "private" : "public";
  if (!name || name.length > 100 || !domains.includes(domain) || description.length > 3000)
    return NextResponse.json({ error: "A valid name, domain tag, and description of at most 3000 characters are required" }, { status: 400 });
  if (repositoryUrl && (repositoryUrl.length > 500 || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(repositoryUrl)))
    return NextResponse.json({ error: "Use a GitHub repository URL or leave it blank" }, { status: 400 });
  await ensureSeeded();
  const projectId = randomUUID();
  const gateId = randomUUID();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45)}-${projectId.slice(0, 8)}`;
  await queryBigQuery(`BEGIN TRANSACTION;
    INSERT INTO \`${env.projectId}.${env.dataset}.projects\` (id,org_id,owner_id,name,slug,description,repository_url,visibility,created_at,domain_tag,approval_status)
      VALUES (@projectId,@orgId,@userId,@name,@slug,@description,@repositoryUrl,@visibility,CURRENT_TIMESTAMP(),@domain,'pending');
    INSERT INTO \`${env.projectId}.${env.dataset}.approval_gates\` (id,org_id,project_id,kind,requested_by,status,created_at)
      VALUES (@gateId,@orgId,@projectId,'project_creation',@userId,'pending',CURRENT_TIMESTAMP());
    COMMIT TRANSACTION;`, { projectId, gateId, orgId: user.orgId, userId: user.id, name, slug, description, repositoryUrl, visibility, domain });
  return NextResponse.json({ id: projectId, status: "pending" }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json();
  const projectId = String(body.projectId || "");
  const description = String(body.description || "").trim();
  const repositoryUrl = String(body.repositoryUrl || "").trim();
  if (!projectId || description.length > 3000) return NextResponse.json({ error: "A project and a brief of at most 3000 characters are required" }, { status: 400 });
  if (repositoryUrl && (repositoryUrl.length > 500 || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(repositoryUrl)))
    return NextResponse.json({ error: "Use a GitHub repository URL or leave it blank" }, { status: 400 });
  await ensureSeeded();
  const projects = await queryBigQuery<{ id: string }>(`SELECT id FROM \`${env.projectId}.${env.dataset}.projects\`
    WHERE id=@projectId AND org_id=@orgId AND (owner_id=@userId OR @isAdmin) LIMIT 1`,
    { projectId, orgId: user.orgId, userId: user.id, isAdmin: user.role === "admin" });
  if (!projects[0]) return NextResponse.json({ error: "Only the project owner or an admin can update its details" }, { status: 403 });
  await queryBigQuery(`UPDATE \`${env.projectId}.${env.dataset}.projects\`
    SET description=@description, repository_url=@repositoryUrl
    WHERE id=@projectId AND org_id=@orgId`, { projectId, orgId: user.orgId, description, repositoryUrl });
  return NextResponse.json({ id: projectId, description, repositoryUrl });
}
