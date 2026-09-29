import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const rows = await queryBigQuery(`
      SELECT
        DATE(timestamp) AS day,
        modelId,
        ROUND(SUM(costUsd), 6) AS spend_usd,
        SUM(inputTokens + outputTokens) AS tokens
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY day, modelId
      ORDER BY day
    `);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
