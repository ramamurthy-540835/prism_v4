import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const [row] = await queryBigQuery(`
      SELECT
        ROUND(COALESCE(SUM(costUsd), 0), 6) AS total_spend,
        COALESCE(SUM(inputTokens + outputTokens), 0) AS total_tokens,
        COUNT(DISTINCT userId) AS active_users,
        COUNTIF(decision = 'stop') AS blocked_calls
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    `);
    return NextResponse.json(row ?? { total_spend: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 });
  } catch {
    return NextResponse.json({ total_spend: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 });
  }
}
