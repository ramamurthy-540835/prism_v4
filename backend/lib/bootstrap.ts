import { env } from "./env";
import { queryBigQuery } from "./bigquery";
import { PERSONAS, PERSONA_NAMES, taskTokenDefault } from "../../frontend/config/personas";

let pending: Promise<void> | undefined;
const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

function modelFor(task: string) {
  if (/code_|refactoring|bug_fix|automation_script/.test(task)) return { model: "claude-sonnet-4-6", fallback: "gemini-2.5-pro", provider: "anthropic" };
  if (/architecture|solution_document|gap_analysis|integration_design|adr|agent_design|rag_pipeline|evaluation_plan/.test(task)) return { model: "gemini-2.5-pro", fallback: "gemini-2.5-flash", provider: "vertex" };
  return { model: "gemini-2.5-flash", fallback: "gemini-2.5-pro", provider: "vertex" };
}

async function migrate() {
  const plans = [
    { id: "starter", name: "Starter", description: "Postpaid · ₹199 monthly base plus metered usage", tokens: 2_000_000 },
    { id: "team", name: "Team", description: "Postpaid monthly base plus metered usage", tokens: 10_000_000 },
    { id: "enterprise", name: "Enterprise", description: "Postpaid monthly base plus metered usage", tokens: 999_999_999 },
  ];
  const planSource = plans.map((p) => `SELECT ${quote(p.id)} AS planId, ${quote(p.name)} AS name, ${quote(p.description)} AS description, ${p.tokens} AS monthlyTokenLimit`).join(" UNION ALL ");
  await queryBigQuery(`MERGE \`${env.projectId}.${env.dataset}.${env.plansTable}\` T USING (${planSource}) S ON T.planId = S.planId
    WHEN MATCHED THEN UPDATE SET name=S.name, description=S.description, status='active', updatedAt=CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN INSERT (planId,name,description,monthlyTokenLimit,monthlySpendLimitUsd,status,createdAt,updatedAt)
      VALUES (S.planId,S.name,S.description,S.monthlyTokenLimit,0,'active',CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP())`);

  const routes = PERSONA_NAMES.flatMap((persona) => PERSONAS[persona].tasks.map((task) => {
    const choice = modelFor(task);
    return `SELECT ${quote(`starter:${persona}`)} AS planId, ${quote(task)} AS taskType, ${quote(choice.provider)} AS provider, ${quote(choice.model)} AS modelId, 'vertex' AS fallbackProvider, ${quote(choice.fallback)} AS fallbackModelId, ${taskTokenDefault(task)} AS maxTokensPerCall`;
  }));
  // Persona is encoded in planId because the existing routing table has no persona column.
  await queryBigQuery(`MERGE \`${env.projectId}.${env.dataset}.${env.routingTable}\` T USING (${routes.join(" UNION ALL ")}) S
    ON T.planId=S.planId AND T.taskType=S.taskType
    WHEN MATCHED THEN UPDATE SET provider=S.provider,modelId=S.modelId,fallbackProvider=S.fallbackProvider,fallbackModelId=S.fallbackModelId,maxTokensPerCall=S.maxTokensPerCall,active=TRUE,updatedAt=CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN INSERT (planId,taskType,provider,modelId,fallbackProvider,fallbackModelId,maxTokensPerCall,costPerInputToken,costPerOutputToken,monthlySpendLimitUsd,budgetThresholdPct,active,updatedAt)
      VALUES (S.planId,S.taskType,S.provider,S.modelId,S.fallbackProvider,S.fallbackModelId,S.maxTokensPerCall,0,0,0,80,TRUE,CURRENT_TIMESTAMP())`);
}

export function ensureSeeded() {
  pending ||= migrate().catch((error) => { pending = undefined; throw error; });
  return pending;
}
