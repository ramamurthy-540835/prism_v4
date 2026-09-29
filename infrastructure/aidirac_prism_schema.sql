-- PRISM runtime schema for AIDRAC project aidirac-503309.
-- Create the dataset in US before running this file:
-- bq mk --dataset --location=US aidirac-503309:prism

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_usage` (
  event_ts TIMESTAMP, user_id STRING, user_email STRING, org_id STRING,
  plan_id STRING, task_type STRING, provider STRING, model_id STRING,
  status STRING, reason STRING, input_tokens INT64, output_tokens INT64,
  total_tokens INT64, estimated_cost_usd FLOAT64, actual_cost_usd FLOAT64,
  error_code STRING, error_message STRING, latency_ms INT64, session_id STRING,
  prompt_id STRING, prompt_version STRING, workspace_path STRING,
  environment STRING, source_app STRING, role STRING, persona STRING
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_plans` (
  planId STRING, name STRING, description STRING, monthlyTokenLimit INT64,
  monthlySpendLimitUsd FLOAT64, status STRING, createdAt TIMESTAMP, updatedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_budgets` (
  orgId STRING, userId STRING, planId STRING, monthlyTokenLimit INT64,
  monthlySpendLimitUsd FLOAT64, monthlyBudgetUsd FLOAT64, budgetThresholdPct FLOAT64,
  alertThresholdPct FLOAT64, hardStop BOOL, status STRING, active BOOL, updatedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_model_routing` (
  planId STRING, taskType STRING, provider STRING, modelId STRING,
  fallbackProvider STRING, fallbackModelId STRING, maxTokensPerCall INT64,
  costPerInputToken FLOAT64, costPerOutputToken FLOAT64, monthlySpendLimitUsd FLOAT64,
  budgetThresholdPct FLOAT64, active BOOL, updatedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_subscriptions` (
  userId STRING, orgId STRING, planId STRING, status STRING, updatedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_prompts` (
  promptId STRING, name STRING, persona STRING, taskType STRING, prompt_type_id STRING,
  prompt_type_category STRING, currentVersion STRING, status STRING,
  createdAt TIMESTAMP, updatedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_prompt_versions` (
  promptId STRING, version STRING, systemPrompt STRING, userPromptTemplate STRING,
  status STRING, createdAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism.prism_prompt_types` (
  prompt_type_id STRING, name STRING, category STRING, template STRING,
  input_vars STRING, description STRING, created_at TIMESTAMP
);
