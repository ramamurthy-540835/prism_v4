import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const rows = await queryBigQuery(`
      SELECT
        userId,
        taskType,
        COUNT(*) AS calls,
        SUM(inputTokens + outputTokens) AS tokens,
        ROUND(SUM(costUsd), 6) AS spend,
        COUNTIF(decision = 'stop') AS blocked
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      GROUP BY userId, taskType
      ORDER BY spend DESC
      LIMIT 20
    `);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
