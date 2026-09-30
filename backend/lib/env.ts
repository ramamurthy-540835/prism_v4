export const env = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || "aidirac-503309",
  dataset: process.env.BQ_DATASET || "prism",
  usageTable: process.env.BQ_USAGE_TABLE || "prism_usage",
  budgetsTable: process.env.BQ_BUDGETS_TABLE || "prism_budgets",
  plansTable: process.env.BQ_PLANS_TABLE || "prism_plans",
  routingTable: process.env.BQ_ROUTING_TABLE || "prism_model_routing",
};
