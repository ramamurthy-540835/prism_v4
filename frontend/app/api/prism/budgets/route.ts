import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";

export const dynamic = "force-dynamic";
import { queryBigQuery } from "@backend/lib/bigquery";
import { getSession } from "@backend/lib/auth";

export async function GET(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const rows = await queryBigQuery(
      `SELECT * FROM \`${env.projectId}.${env.dataset}.${env.budgetsTable}\` WHERE orgId=@orgId ${user.role === "admin" ? "" : "AND (userId=@userId OR userId IS NULL)"}`,
      { orgId: user.orgId, ...(user.role === "admin" ? {} : { userId: user.email }) }
    );
    return NextResponse.json(Array.isArray(rows) ? rows : []);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}
