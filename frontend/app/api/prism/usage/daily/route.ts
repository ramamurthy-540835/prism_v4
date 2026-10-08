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
        DATE(event_ts) AS day,
        model_id AS modelId,
        ROUND(SUM(actual_cost_usd), 6) AS spend_usd,
        SUM(total_tokens) AS tokens
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      WHERE org_id=@orgId AND DATE(event_ts) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      ${user.role === "admin" ? "" : "AND user_id=@userId"}
      GROUP BY day, modelId
      ORDER BY day
    `, { orgId: user.orgId, ...(user.role === "admin" ? {} : { userId: user.email }) });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
