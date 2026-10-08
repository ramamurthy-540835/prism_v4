import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { getSession } from "@backend/lib/auth";

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  await ensureSeeded();
  const requestedUser = new URL(req.url).searchParams.get("userId");
  if (requestedUser && requestedUser !== user.email && user.role !== "admin")
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const filter = user.role === "admin" ? (requestedUser ? "AND user_id=@userId" : "") : "AND user_id=@userId";
  const rows = await queryBigQuery(`SELECT event_ts AS createdAt,user_id AS userId,persona,task_type AS taskType,
      provider,model_id AS modelId,status,cost_usd AS actualCostUsd,input_tokens AS inputTokens,
      output_tokens AS outputTokens,route_rule AS routeRule,route_reason AS routeReason,fallback_reason AS fallbackReason,
      project_id AS projectId,run_id AS runId
    FROM \`${env.projectId}.${env.dataset}.execution_logs\` WHERE tenant=@tenant ${filter}
    ORDER BY event_ts DESC LIMIT 100`, { tenant: user.orgId, ...(filter ? { userId: requestedUser || user.email } : {}) });
  return NextResponse.json(rows);
}
