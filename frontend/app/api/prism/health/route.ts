import { NextResponse } from "next/server";
import { queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await queryBigQuery(`SELECT 1 AS ok FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\` LIMIT 1`);
    let tableCount = 0;
    try {
      const [countRow] = await queryBigQuery(
        `SELECT COUNT(*) AS tableCount FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.TABLES\``
      );
      tableCount = Number(countRow?.tableCount ?? 0);
    } catch {}
    return NextResponse.json({ status: "ok", project: env.projectId, dataset: env.dataset, tableCount });
  } catch (e) {
    return NextResponse.json(
      {
        status: "degraded",
        project: env.projectId,
        dataset: env.dataset,
        message: "PRISM UI is running, but the configured BigQuery dataset is unavailable.",
        error: String((e as any)?.message ?? e),
      },
      { status: 200 }
    );
  }
}
