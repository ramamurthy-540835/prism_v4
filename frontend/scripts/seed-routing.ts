/**
 * Seed prism_model_routing from ossa/backend/ossa/multi_model_graph.py MODEL_REGISTRY + TASK_TYPES
 * Run: npx ts-node frontend/scripts/seed-routing.ts
 */
import { BigQuery } from "@google-cloud/bigquery";
import { randomUUID } from "crypto";

const PROJECT = "ctoteam";
const DATASET = "prism";
const bq = new BigQuery({ projectId: PROJECT });

// Extracted from ossa/backend/ossa/multi_model_graph.py MODEL_REGISTRY
const COST: Record<string, { provider: string; costIn: number; costOut: number; maxCtx: number }> = {
  "gemini-2.5-flash":       { provider: "gemini",    costIn: 0.00015,  costOut: 0.00060,  maxCtx: 1_000_000 },
  "gemini-2.5-pro":         { provider: "gemini",    costIn: 0.00125,  costOut: 0.00500,  maxCtx: 2_000_000 },
  "gemini-2.0-flash":       { provider: "gemini",    costIn: 0.00010,  costOut: 0.00040,  maxCtx: 1_000_000 },
  "gemini-2.0-flash-lite":  { provider: "gemini",    costIn: 0.000075, costOut: 0.00030,  maxCtx: 1_000_000 },
  "gemini-3-pro-preview":   { provider: "gemini",    costIn: 0.00250,  costOut: 0.01000,  maxCtx: 2_000_000 },
  "gemini-3-flash-preview": { provider: "gemini",    costIn: 0.00020,  costOut: 0.00080,  maxCtx: 1_000_000 },
  "claude-haiku-4-5":       { provider: "anthropic", costIn: 0.00080,  costOut: 0.00400,  maxCtx: 200_000 },
  "claude-sonnet-4-6":      { provider: "anthropic", costIn: 0.00300,  costOut: 0.01500,  maxCtx: 200_000 },
  "claude-opus-4-7":        { provider: "anthropic", costIn: 0.01500,  costOut: 0.07500,  maxCtx: 200_000 },
  "gpt-4o-mini":            { provider: "openai",    costIn: 0.00015,  costOut: 0.00060,  maxCtx: 128_000 },
  "gpt-4o":                 { provider: "openai",    costIn: 0.00250,  costOut: 0.01000,  maxCtx: 128_000 },
  "o3-mini":                { provider: "openai",    costIn: 0.00110,  costOut: 0.00440,  maxCtx: 200_000 },
  "o1":                     { provider: "openai",    costIn: 0.01500,  costOut: 0.06000,  maxCtx: 200_000 },
};

// Derived from TASK_TYPES dict + additional task types from knowledge files
type RoutingRule = {
  taskType: string;
  primaryModelId: string;
  fallbackModelId: string;
  maxTokensPerCall: number;
  allowedModels: string[];
};

const ROUTING_RULES: RoutingRule[] = [
  // From TASK_TYPES in multi_model_graph.py
  { taskType: "code_generation",    primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 6000, allowedModels: ["claude-sonnet-4-6","claude-opus-4-7","gemini-2.5-flash","gpt-4o"] },
  { taskType: "code_review",        primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["claude-sonnet-4-6","gemini-2.5-flash","gpt-4o"] },
  { taskType: "security_audit",     primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "claude-haiku-4-5",  maxTokensPerCall: 4000, allowedModels: ["claude-sonnet-4-6","claude-opus-4-7","claude-haiku-4-5"] },
  { taskType: "research",           primaryModelId: "gemini-2.5-pro",     fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 5000, allowedModels: ["gemini-2.5-pro","gemini-2.5-flash","claude-sonnet-4-6"] },
  { taskType: "summarisation",      primaryModelId: "gemini-2.5-flash",   fallbackModelId: "gemini-2.0-flash",  maxTokensPerCall: 2000, allowedModels: ["gemini-2.5-flash","gemini-2.0-flash","gpt-4o-mini"] },
  { taskType: "data_analysis",      primaryModelId: "gemini-2.5-pro",     fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["gemini-2.5-pro","gemini-2.5-flash","gpt-4o"] },
  { taskType: "documentation",      primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 3000, allowedModels: ["claude-sonnet-4-6","gemini-2.5-flash","gpt-4o"] },
  { taskType: "general",            primaryModelId: "gemini-2.5-flash",   fallbackModelId: "gemini-2.0-flash",  maxTokensPerCall: 2000, allowedModels: ["gemini-2.5-flash","gemini-2.0-flash","gpt-4o-mini","claude-haiku-4-5"] },
  // Additional task types from knowledge/prompt_types/ mapping
  { taskType: "architecture_design",   primaryModelId: "claude-opus-4-7",    fallbackModelId: "claude-sonnet-4-6", maxTokensPerCall: 8000, allowedModels: ["claude-opus-4-7","claude-sonnet-4-6","gemini-2.5-pro"] },
  { taskType: "test_generation",       primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["claude-sonnet-4-6","gemini-2.5-flash","gpt-4o"] },
  { taskType: "gap_analysis",          primaryModelId: "gemini-2.5-pro",     fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["gemini-2.5-pro","gemini-2.5-flash","claude-sonnet-4-6"] },
  { taskType: "requirements_analysis", primaryModelId: "gemini-2.5-pro",     fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["gemini-2.5-pro","claude-sonnet-4-6","gemini-2.5-flash"] },
  { taskType: "diagram_generation",    primaryModelId: "gemini-2.5-flash",   fallbackModelId: "gemini-2.0-flash",  maxTokensPerCall: 3000, allowedModels: ["gemini-2.5-flash","gemini-2.0-flash","claude-sonnet-4-6"] },
  { taskType: "mentoring",             primaryModelId: "claude-sonnet-4-6",  fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 4000, allowedModels: ["claude-sonnet-4-6","gemini-2.5-flash","claude-opus-4-7"] },
  { taskType: "learning_explanation",  primaryModelId: "gemini-2.5-flash",   fallbackModelId: "gemini-2.0-flash",  maxTokensPerCall: 3000, allowedModels: ["gemini-2.5-flash","claude-sonnet-4-6","gpt-4o-mini"] },
  { taskType: "retrieval",             primaryModelId: "gemini-2.5-pro",     fallbackModelId: "gemini-2.5-flash",  maxTokensPerCall: 5000, allowedModels: ["gemini-2.5-pro","gemini-2.5-flash","gpt-4o"] },
];

const PLAN_IDS = ["default", "plan-starter", "plan-pro", "plan-enterprise"];

async function existsRoute(planId: string, taskType: string): Promise<boolean> {
  const [rows] = await bq.query({
    query: `SELECT 1 FROM \`${PROJECT}.${DATASET}.prism_model_routing\` WHERE planId = @planId AND taskType = @taskType LIMIT 1`,
    params: { planId, taskType },
    useLegacySql: false,
  });
  return rows.length > 0;
}

async function main() {
  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;

  for (const planId of PLAN_IDS) {
    for (const rule of ROUTING_RULES) {
      if (await existsRoute(planId, rule.taskType)) {
        console.log(`SKIP  planId=${planId} taskType=${rule.taskType}`);
        skipped++;
        continue;
      }

      const primary = COST[rule.primaryModelId];
      const fallback = COST[rule.fallbackModelId];

      await bq.dataset(DATASET).table("prism_model_routing").insert([{
        routeId: randomUUID(),
        planId,
        taskType: rule.taskType,
        primaryModelId: rule.primaryModelId,
        primaryProvider: primary?.provider ?? "gemini",
        fallbackModelId: rule.fallbackModelId,
        fallbackProvider: fallback?.provider ?? "gemini",
        allowedModels: JSON.stringify(rule.allowedModels),
        maxTokensPerCall: rule.maxTokensPerCall,
        costPerInputToken: primary?.costIn ?? 0.00015,
        costPerOutputToken: primary?.costOut ?? 0.00060,
        active: true,
        createdAt: now,
      }]);

      console.log(`INSERT planId=${planId} taskType=${rule.taskType} → ${rule.primaryModelId} (${primary?.provider})`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
