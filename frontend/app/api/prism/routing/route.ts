import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { queryBigQuery } from "@backend/lib/bigquery";
import { activeWhereClause, getActiveColumn } from "@backend/lib/schema";

export const dynamic = "force-dynamic";

let _routingCache: any = null;
let _routingCachedAt = 0;
const ROUTING_TTL = 5 * 60 * 1000;

export async function GET() {
  if (_routingCache && Date.now() - _routingCachedAt < ROUTING_TTL) {
    return NextResponse.json(_routingCache);
  }

  try {
    await ensureSeeded();
    const activeCol = await getActiveColumn(env.routingTable);
    const rows = await queryBigQuery(`SELECT * FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\` WHERE 1=1 ${activeWhereClause(activeCol)} ORDER BY planId, taskType`);
    _routingCache = rows;
    _routingCachedAt = Date.now();
    return NextResponse.json(rows);
  } catch (error: any) {
    if (_routingCache) return NextResponse.json(_routingCache);
    return NextResponse.json({ error: { code: "ROUTING_FETCH_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}
