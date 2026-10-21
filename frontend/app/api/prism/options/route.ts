import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";
import { getActiveColumn, activeWhereClause } from "@backend/lib/schema";
import { PERSONA_NAMES } from "@/config/personas";
import promptCatalog from "@/../knowledge/prompt_types/Prompts_Types.json";

export const dynamic = "force-dynamic";

let _optionsCache: any = null;
let _optionsCachedAt = 0;
const OPTIONS_TTL = 5 * 60 * 1000;

const FALLBACK_PROMPT_TYPES = Object.entries(promptCatalog).map(([name, value], index) => ({
  promptTypeId: `PT${String(index + 1).padStart(3, "0")}`,
  name,
  category: "General",
  template: value.template,
  inputVars: value.input_vars,
  description: name,
}));

async function queryWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function getTableColumns(tableName: string): Promise<Set<string>> {
  const rows = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
  `, { tableName });
  return new Set(rows.map((r) => r.column_name));
}

function pickColumn(columns: Set<string>, candidates: string[], fallback: string): string {
  return candidates.find((c) => columns.has(c)) ?? fallback;
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await queryBigQuery<{ table_name: string }>(`
    SELECT table_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.TABLES\`
    WHERE table_name = @tableName
    LIMIT 1
  `, { tableName });
  return rows.length > 0;
}

export async function GET() {
  // Return cache if fresh
  if (_optionsCache && Date.now() - _optionsCachedAt < OPTIONS_TTL) {
    return NextResponse.json({ ..._optionsCache, cached: true, cachedAgeMs: Date.now() - _optionsCachedAt });
  }

  const errors: string[] = [];

  let models: any[] = [];
  let taskTypes: string[] = [];
  let personas: string[] = PERSONA_NAMES;
  let prompts: any[] = [];
  let promptTypes = FALLBACK_PROMPT_TYPES;
  let source = "bigquery";

  try {
    const activeCol = await queryWithTimeout(() => getActiveColumn(env.routingTable));
    const routingCols = await queryWithTimeout(() => getTableColumns(env.routingTable));
    const modelCol = pickColumn(routingCols, ["primaryModelId", "primary_model_id", "modelId", "model_id"], "NULL");
    const providerCol = pickColumn(routingCols, ["primaryProvider", "primary_provider", "provider"], "'vertex'");
    const taskTypeCol = pickColumn(routingCols, ["taskType", "task_type"], "''");

    const [hasPrompts, hasPromptVersions, hasPromptTypes] = await Promise.all([
      queryWithTimeout(() => tableExists("prism_prompts")).catch(() => false),
      queryWithTimeout(() => tableExists("prism_prompt_versions")).catch(() => false),
      queryWithTimeout(() => tableExists("prism_prompt_types")).catch(() => false),
    ]);

    const [routingRows, promptRows, promptTypeRows] = await Promise.all([
      queryWithTimeout(() =>
        queryBigQuery<any>(`
          SELECT DISTINCT
            ${modelCol} AS modelId,
            ${providerCol} AS provider,
            ${taskTypeCol} AS taskType
          FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\`
          WHERE 1=1 ${activeWhereClause(activeCol)}
          ORDER BY taskType, modelId
        `)
      ).catch((e: any) => {
        errors.push("routing: " + e.message);
        return [];
      }),

      hasPrompts && hasPromptVersions ? queryWithTimeout(() =>
        queryBigQuery<any>(`
          SELECT
            p.promptId, p.name, p.persona, p.taskType,
            p.prompt_type_id, p.prompt_type_category,
            p.currentVersion AS version,
            pv.systemPrompt,
            pt.category AS promptTypeCategory,
            pt.name AS promptTypeName,
            pt.template AS promptTypeTemplate
          FROM \`${env.projectId}.${env.dataset}.prism_prompts\` p
          JOIN \`${env.projectId}.${env.dataset}.prism_prompt_versions\` pv
            ON p.promptId = pv.promptId AND p.currentVersion = pv.version
          LEFT JOIN \`${env.projectId}.${env.dataset}.prism_prompt_types\` pt
            ON p.prompt_type_id = pt.prompt_type_id
          WHERE p.status = 'active'
          ORDER BY p.name
        `)
      ).catch((e: any) => {
        errors.push("prompts: " + e.message);
        return [];
      }) : Promise.resolve([]),

      hasPromptTypes ? queryWithTimeout(() =>
        queryBigQuery<any>(`
          SELECT prompt_type_id, name, category, template, input_vars, description
          FROM \`${env.projectId}.${env.dataset}.prism_prompt_types\`
          ORDER BY prompt_type_id
        `)
      ).catch((e: any) => {
        errors.push("prompt_types: " + e.message);
        return [];
      }) : Promise.resolve([]),
    ]);

    models = routingRows
      .map((r: any) => ({
        modelId: String(r.modelId ?? ""),
        provider: String(r.provider ?? "vertex"),
        taskType: String(r.taskType ?? ""),
      }))
      .filter((m: any) => m.modelId);

    // Available as an explicit choice for complex work without changing plan defaults.
    const argonTasks = new Set([
      "adr", "agent_design", "architecture_design", "automation_script", "bug_fix",
      "code_generation", "code_review", "data_analysis", "evaluation_plan",
      "fine_tuning_plan", "gap_analysis", "integration_design", "rag_pipeline",
      "refactoring", "research", "requirements", "requirements_analysis", "solution_document",
    ]);
    for (const taskType of new Set(models.map((m: any) => m.taskType))) {
      if (argonTasks.has(taskType) && !models.some((m: any) => m.taskType === taskType && m.modelId === "gemini-4-argon")) {
        models.push({ modelId: "gemini-4-argon", provider: "vertex", taskType });
      }
    }

    taskTypes = Array.from(new Set(models.map((m: any) => m.taskType).filter(Boolean)));

    prompts = promptRows.map((p: any) => ({
      promptId: String(p.promptId ?? ""),
      name: String(p.name ?? ""),
      persona: p.persona ? String(p.persona) : undefined,
      taskType: p.taskType ? String(p.taskType) : undefined,
      promptTypeId: p.prompt_type_id ? String(p.prompt_type_id) : undefined,
      promptTypeCategory: p.prompt_type_category ?? p.promptTypeCategory
        ? String(p.prompt_type_category ?? p.promptTypeCategory)
        : undefined,
      promptTypeName: p.promptTypeName ? String(p.promptTypeName) : undefined,
      promptTypeTemplate: p.promptTypeTemplate ? String(p.promptTypeTemplate) : undefined,
      version: p.version ? String(p.version) : "v1",
      systemPrompt: p.systemPrompt ? String(p.systemPrompt) : undefined,
    })).filter((p: any) => p.promptId);

    personas = PERSONA_NAMES;

    promptTypes = promptTypeRows.map((pt: any) => ({
      promptTypeId: String(pt.prompt_type_id ?? ""),
      name: String(pt.name ?? ""),
      category: String(pt.category ?? ""),
      template: String(pt.template ?? ""),
      inputVars: pt.input_vars ?? [],
      description: String(pt.description ?? ""),
    })).filter((pt: any) => pt.promptTypeId);
    if (promptTypes.length === 0) promptTypes = FALLBACK_PROMPT_TYPES;

    if (errors.length > 0) source = "fallback";
  } catch (error: any) {
    errors.push("fatal: " + (error?.message ?? String(error)));
    source = "fallback";
  }

  const result = { models, taskTypes, personas, prompts, promptTypes, source, errors: errors.length > 0 ? errors : undefined };
  _optionsCache = result;
  _optionsCachedAt = Date.now();
  return NextResponse.json({ ...result, cached: false });
}
