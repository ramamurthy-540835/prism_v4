import { env } from "./env";
import { queryBigQuery } from "./bigquery";
import { ensureSeeded } from "./bootstrap";

export async function getRoute({ planId = "starter", persona = "AI Engineer", taskType = "agent_design" }: {
  planId?: string; persona?: string; taskType?: string; orgId?: string;
}) {
  await ensureSeeded();
  const ruleKey = `starter:${persona}`;
  const rows = await queryBigQuery<any>(`SELECT * FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\`
    WHERE planId=@ruleKey AND taskType=@taskType AND active=TRUE LIMIT 1`, { ruleKey, taskType });
  const row = rows[0];
  if (!row) return { routingDecision: "blocked", reason: `No routing rule for ${persona} / ${taskType}`, ruleKey,
    provider: "", modelId: "", maxTokensPerCall: 1024, costPerInputToken: 0, costPerOutputToken: 0 };
  return { routingDecision: "allow", reason: `Matched ${persona} / ${taskType} on ${planId} plan`, ruleKey,
    provider: String(row.provider), modelId: String(row.modelId), fallbackProvider: String(row.fallbackProvider || "vertex"),
    fallbackModelId: String(row.fallbackModelId || "gemini-2.5-pro"),
    maxTokensPerCall: Number(row.maxTokensPerCall || 2048),
    costPerInputToken: Number(row.costPerInputToken || 0), costPerOutputToken: Number(row.costPerOutputToken || 0) };
}
