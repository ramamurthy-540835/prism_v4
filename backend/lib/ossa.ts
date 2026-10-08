import { env } from "./env";
import { insertUsage, queryBigQuery } from "./bigquery";

export function safetyViolation(text: string): string | null {
  if (/\b(?:\d[ -]?){12}\b/.test(text)) return "Aadhaar number detected";
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(text)) return "PAN number detected";
  return null;
}

export async function ossaGuard({ orgId = "naturelabs", userId = "", estimatedTokens, estimatedCostUsd, userMessage = "" }: {
  orgId?: string; userId?: string; estimatedTokens: number; estimatedCostUsd: number; userMessage?: string;
}) {
  const violation = safetyViolation(userMessage);
  if (violation) {
    return { decision: "stop", reason: violation };
  }

  const budgets = await queryBigQuery<any>(`SELECT * FROM \`${env.projectId}.${env.dataset}.${env.budgetsTable}\`
    WHERE orgId=@orgId AND (userId=@userId OR userId IS NULL) AND (active=TRUE OR status='active') LIMIT 1`, { orgId, userId });
  const budget = budgets[0];
  const threshold = Number(budget?.monthlyBudgetUsd || budget?.monthlySpendLimitUsd || 0);
  if (threshold <= 0) return { decision: "allow", reason: "Governance checks passed." };

  const [usage] = await queryBigQuery<{ spent: number; warned80: number; warned100: number }>(`
    SELECT COALESCE(SUM(actual_cost_usd),0) AS spent,
      COUNTIF(status='budget_warning' AND reason='budget_warning:80') AS warned80,
      COUNTIF(status='budget_warning' AND reason='budget_warning:100') AS warned100
    FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
    WHERE org_id=@orgId AND DATE(event_ts)>=DATE_TRUNC(CURRENT_DATE(),MONTH)`, { orgId });
  const projected = Number(usage?.spent || 0) + estimatedCostUsd;
  const pct = Math.floor(projected / threshold * 100);
  const level = pct >= 100 && !Number(usage?.warned100) ? 100 : pct >= 80 && !Number(usage?.warned80) ? 80 : 0;
  if (level) {
    await insertUsage({ orgId, userId, status: "budget_warning", reason: `budget_warning:${level}`, sourceApp: "prism" });
    return { decision: "warn", reason: `${level}% of monthly budget reached; service continues.` };
  }
  return { decision: "allow", reason: "Governance checks passed." };
}
