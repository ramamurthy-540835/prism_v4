import { env } from "./env";
import { queryBigQuery } from "./bigquery";
export async function ossaGuard({ orgId, userId, estimatedTokens, estimatedCostUsd }: { orgId?: string; userId?: string; estimatedTokens: number; estimatedCostUsd: number }) {
  const rows = await queryBigQuery<any>(`SELECT * FROM \`${env.projectId}.${env.dataset}.${env.budgetsTable}\` WHERE orgId=@orgId AND userId=@userId AND active=TRUE LIMIT 1`, { orgId: orgId || "", userId: userId || "" });
  const budget = rows[0];
  if (budget?.hardStop && Number(budget.monthlyTokenLimit || 0) > 0 && estimatedTokens > Number(budget.monthlyTokenLimit)) return { decision: "stop", reason: "Estimated request exceeds the configured hard token limit." };
  if (budget?.hardStop && Number(budget.monthlySpendLimitUsd || 0) > 0 && estimatedCostUsd > Number(budget.monthlySpendLimitUsd)) return { decision: "stop", reason: "Estimated request exceeds the configured hard spend limit." };
  return { decision: "allow", reason: "Within configured request controls." };
}
