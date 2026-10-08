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
  const table = (name: string) => `\`${env.projectId}.${env.dataset}.${name}\``;
  await queryBigQuery(`CREATE TABLE IF NOT EXISTS ${table("users")}
    (id STRING, email STRING, password_hash STRING, name STRING, role STRING, org_id STRING, created_at TIMESTAMP)`);
  await queryBigQuery(`CREATE TABLE IF NOT EXISTS ${table("approval_gates")}
    (id STRING, org_id STRING, project_id STRING, kind STRING, requested_by STRING, status STRING, created_at TIMESTAMP, decided_by STRING, decided_at TIMESTAMP)`);
  await queryBigQuery(`CREATE TABLE IF NOT EXISTS ${table("project_members")}
    (project_id STRING, user_id STRING, org_id STRING, created_at TIMESTAMP)`);
  await queryBigQuery(`CREATE TABLE IF NOT EXISTS ${table("execution_logs")}
    (run_id STRING, event_ts TIMESTAMP, tenant STRING, project_id STRING, user_id STRING, persona STRING, task_type STRING,
     prompt_type_id STRING, model_id STRING, provider STRING, route_rule STRING, route_reason STRING, fallback_reason STRING,
     status STRING, input_tokens INT64, output_tokens INT64, cost_usd FLOAT64, artifact_path STRING)`);
  await queryBigQuery(`CREATE TABLE IF NOT EXISTS ${table("support_tickets")}
    (id STRING, event_ts TIMESTAMP, tenant STRING, user_id STRING, subject STRING, message STRING, status STRING)`);
  await queryBigQuery(`ALTER TABLE ${table("projects")} ADD COLUMN IF NOT EXISTS domain_tag STRING`);
  await queryBigQuery(`ALTER TABLE ${table("projects")} ADD COLUMN IF NOT EXISTS approval_status STRING`);
  await queryBigQuery(`ALTER TABLE ${table("prism_plans")} ADD COLUMN IF NOT EXISTS monthlyBaseInr FLOAT64`);
  await queryBigQuery(`ALTER TABLE ${table("prism_plans")} ADD COLUMN IF NOT EXISTS billingMode STRING`);
  await queryBigQuery(`MERGE ${table("organizations")} T USING (SELECT 'naturelabs' AS id, 'Nature Labs' AS name, 'naturelabs' AS slug) S
    ON T.slug=S.slug WHEN NOT MATCHED THEN INSERT (id,name,slug,created_at) VALUES (S.id,S.name,S.slug,CURRENT_TIMESTAMP())`);
  const plans = [
    { id: "starter", name: "Starter", description: "Postpaid · ₹199 monthly base plus metered usage", tokens: 2_000_000, base: 199 },
    { id: "team", name: "Team", description: "Postpaid monthly base plus metered usage", tokens: 10_000_000, base: null },
    { id: "enterprise", name: "Enterprise", description: "Postpaid monthly base plus metered usage", tokens: 999_999_999, base: null },
  ];
  const planSource = plans.map((p) => `SELECT ${quote(p.id)} AS planId, ${quote(p.name)} AS name, ${quote(p.description)} AS description, ${p.tokens} AS monthlyTokenLimit, ${p.base === null ? "CAST(NULL AS FLOAT64)" : p.base} AS monthlyBaseInr`).join(" UNION ALL ");
  await queryBigQuery(`MERGE \`${env.projectId}.${env.dataset}.${env.plansTable}\` T USING (${planSource}) S ON T.planId = S.planId
    WHEN MATCHED THEN UPDATE SET name=S.name, description=S.description, monthlyBaseInr=S.monthlyBaseInr, billingMode='postpaid', status='active', updatedAt=CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN INSERT (planId,name,description,monthlyTokenLimit,monthlySpendLimitUsd,monthlyBaseInr,billingMode,status,createdAt,updatedAt)
      VALUES (S.planId,S.name,S.description,S.monthlyTokenLimit,0,S.monthlyBaseInr,'postpaid','active',CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP())`);
  await queryBigQuery(`UPDATE \`${env.projectId}.${env.dataset}.${env.plansTable}\` SET status='retired',updatedAt=CURRENT_TIMESTAMP()
    WHERE planId IN ('community','student') AND status!='retired'`);

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
