import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const [row] = await queryBigQuery<{ total_spend: number | null; governed_calls: number; total_tokens: number; active_users: number; blocked_calls: number }>(`
      SELECT
        SUM(actual_cost_usd) AS total_spend,
        COUNT(*) AS governed_calls,
        COALESCE(SUM(total_tokens), 0) AS total_tokens,
        COUNT(DISTINCT user_id) AS active_users,
        COUNTIF(status = 'blocked') AS blocked_calls
      FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
      WHERE org_id = @orgId AND DATE(event_ts) >= DATE_TRUNC(CURRENT_DATE(), MONTH)
    `, { orgId: "naturelabs" });
    return NextResponse.json({ ...(row ?? { total_spend: null, governed_calls: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 }), display_rate_inr: Number(process.env.USD_INR_DISPLAY_RATE || 97.05) });
  } catch {
    return NextResponse.json({ total_spend: null, governed_calls: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 });
  }
}
