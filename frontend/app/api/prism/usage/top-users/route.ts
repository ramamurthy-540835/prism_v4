import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";
import { getSession } from "@backend/lib/auth";

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const rows = await queryBigQuery(`
      SELECT
        user_id AS userId,
        task_type AS taskType,
        COUNT(*) AS calls,
        SUM(total_tokens) AS tokens,
        ROUND(SUM(actual_cost_usd), 6) AS spend,
        COUNTIF(status = 'blocked') AS blocked
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      WHERE org_id=@orgId ${user.role === "admin" ? "" : "AND user_id=@userId"}
      GROUP BY userId, taskType
      ORDER BY spend DESC
      LIMIT 20
    `, { orgId: user.orgId, ...(user.role === "admin" ? {} : { userId: user.email }) });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
