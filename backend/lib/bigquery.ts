import { BigQuery } from "@google-cloud/bigquery";
import { env } from "./env";

let client: BigQuery | undefined;
export function bigquery() { return client ||= new BigQuery({ projectId: env.projectId }); }
export async function queryBigQuery<T = Record<string, unknown>>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const [rows] = await bigquery().query({ query, params, location: process.env.BQ_LOCATION || "US" });
  return rows as T[];
}
export async function insertUsage(row: Record<string, unknown>) {
  const fields: Record<string, string[]> = {
    user_id: ["user_id", "userId"], user_email: ["user_email", "userId"], org_id: ["org_id", "orgId"],
    plan_id: ["plan_id", "planId"], task_type: ["task_type", "taskType"], provider: ["provider"],
    model_id: ["model_id", "modelId"], status: ["status"], reason: ["reason"],
    input_tokens: ["input_tokens", "inputTokens"], output_tokens: ["output_tokens", "outputTokens"],
    total_tokens: ["total_tokens", "totalTokens"], estimated_cost_usd: ["estimated_cost_usd", "estimatedCostUsd"],
    actual_cost_usd: ["actual_cost_usd", "actualCostUsd", "costUsd"], error_code: ["error_code", "errorCode"],
    error_message: ["error_message", "errorMessage"], latency_ms: ["latency_ms", "latencyMs"],
    session_id: ["session_id", "sessionId"], prompt_id: ["prompt_id", "promptId"],
    prompt_version: ["prompt_version", "promptVersion"], workspace_path: ["workspace_path", "workspacePath"],
    environment: ["environment"], source_app: ["source_app", "sourceApp"], role: ["role"], persona: ["persona"],
  };
  const normalized: Record<string, unknown> = { event_ts: new Date().toISOString() };
  for (const [column, aliases] of Object.entries(fields)) {
    const value = aliases.map((alias) => row[alias]).find((candidate) => candidate !== undefined && candidate !== null);
    if (value !== undefined) normalized[column] = value;
  }
  const errors = await bigquery().dataset(env.dataset).table(env.usageTable).insert([normalized]);
  return errors;
}
