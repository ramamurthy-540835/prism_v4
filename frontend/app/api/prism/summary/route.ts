import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { getSession } from "@backend/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getSession(req);
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    await ensureSeeded();
    const [row] = await queryBigQuery<{ total_spend: number | null; governed_calls: number; total_tokens: number; active_users: number; blocked_calls: number }>(`
      SELECT
        SUM(cost_usd) AS total_spend,
        COUNT(*) AS governed_calls,
        COALESCE(SUM(input_tokens + output_tokens), 0) AS total_tokens,
        COUNT(DISTINCT user_id) AS active_users,
        COUNTIF(status = 'blocked') AS blocked_calls
      FROM \`${env.projectId}.${env.dataset}.execution_logs\`
      WHERE tenant = @orgId AND DATE(event_ts) >= DATE_TRUNC(CURRENT_DATE(), MONTH)
    `, { orgId: user.orgId });
    return NextResponse.json({ ...(row ?? { total_spend: null, governed_calls: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 }), display_rate_inr: Number(process.env.USD_INR_DISPLAY_RATE || 97.05) });
  } catch (error) {
    return NextResponse.json({ error: "Spend data unavailable", detail: String(error) }, { status: 503 });
  }
}
