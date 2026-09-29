import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";

export const dynamic = "force-dynamic";
import { queryBigQuery } from "@backend/lib/bigquery";

let _plansCache: any = null;
let _plansCachedAt = 0;
const PLANS_TTL = 10 * 60 * 1000;

export async function GET() {
  if (_plansCache && Date.now() - _plansCachedAt < PLANS_TTL) {
    return NextResponse.json(_plansCache);
  }

  try {
    const rows = await queryBigQuery(
      `SELECT * FROM \`${env.projectId}.${env.dataset}.${env.plansTable}\` ORDER BY planId`
    );
    _plansCache = rows;
    _plansCachedAt = Date.now();
    return NextResponse.json(rows);
  } catch {
    if (_plansCache) return NextResponse.json(_plansCache);
    return NextResponse.json([]);
  }
}
