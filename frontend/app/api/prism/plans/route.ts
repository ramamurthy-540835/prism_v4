import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { ensureSeeded } from "@backend/lib/bootstrap";

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
    await ensureSeeded();
    const rows = await queryBigQuery(
      `SELECT * FROM \`${env.projectId}.${env.dataset}.${env.plansTable}\` WHERE planId IN ('starter','team','enterprise') AND status='active' ORDER BY planId`
    );
    _plansCache = rows;
    _plansCachedAt = Date.now();
    return NextResponse.json(rows);
  } catch {
    if (_plansCache) return NextResponse.json(_plansCache);
    return NextResponse.json([]);
  }
}
