export const WORKBENCH_EXAMPLES = [
  { label: "Developer - GSTIN validator", icon: "Code2", persona: "Developer", taskType: "code_generation", promptTypeId: "PT019", userMessage: "Create a TypeScript function that validates a GSTIN.", maxTokens: 1200, model: "gemini-2.5-flash" },
  { label: "QA - API review", icon: "ClipboardCheck", persona: "QA", taskType: "code_review", promptTypeId: "PT009", userMessage: "Review this API handler for authentication and input-validation gaps.", maxTokens: 1200, model: "gemini-2.5-flash" },
  { label: "Finance - GST exception", icon: "BarChart", persona: "Business Analyst", taskType: "data_analysis", promptTypeId: "PT016", userMessage: "Investigate invoice INV-1002 and explain why it should be escalated.", maxTokens: 1200, model: "gemini-2.5-flash" },
];
