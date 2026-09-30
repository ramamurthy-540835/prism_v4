import { env } from "./env";
import { queryBigQuery } from "./bigquery";
export async function getRoute({ planId, taskType, orgId: _orgId }: { planId?: string; taskType?: string; orgId?: string }) {
  const rows = await queryBigQuery<any>(`SELECT * FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\` WHERE planId=@planId AND taskType=@taskType AND active=TRUE LIMIT 1`, { planId: planId || "community", taskType: taskType || "general" });
  const row = rows[0] || {};
  return { routingDecision: row.provider ? "allow" : "blocked", reason: row.provider ? "active plan route" : "No active model route", provider: row.provider, modelId: row.modelId, maxTokensPerCall: Number(row.maxTokensPerCall || 1024), costPerInputToken: Number(row.costPerInputToken || 0), costPerOutputToken: Number(row.costPerOutputToken || 0) };
}
