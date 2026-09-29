import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";

export const dynamic = "force-dynamic";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const rows = await queryBigQuery(
      `SELECT * FROM \`${env.projectId}.${env.dataset}.${env.budgetsTable}\``
    );
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}
