export const PERSONAS = {
  "AI Engineer": { color: "#4F46E5", tasks: ["agent_design", "rag_pipeline", "prompt_engineering", "evaluation_plan", "fine_tuning_plan"], promptTypes: ["PT010", "PT014", "PT015", "PT016", "PT017", "PT018", "PT021"], primaryPromptType: "PT016" },
  Architect: { color: "#2563EB", tasks: ["solution_document", "architecture_design", "adr", "gap_analysis", "integration_design"], promptTypes: ["PT002", "PT006", "PT007", "PT008", "PT013", "PT020", "PT023"], primaryPromptType: "PT006" },
  "Business Analyst": { color: "#0D9488", tasks: ["requirements", "user_stories", "process_map", "acceptance_criteria", "data_dictionary"], promptTypes: ["PT001", "PT003", "PT004", "PT011", "PT017", "PT018", "PT025"], primaryPromptType: "PT001" },
  Developer: { color: "#16A34A", tasks: ["code_generation", "code_review", "refactoring", "bug_fix", "technical_documentation"], promptTypes: ["PT001", "PT009", "PT012", "PT019", "PT021", "PT022"], primaryPromptType: "PT019" },
  "Project Manager": { color: "#D97706", tasks: ["project_plan", "status_report", "risk_register", "estimation", "stakeholder_update"], promptTypes: ["PT001", "PT003", "PT008", "PT011", "PT024"], primaryPromptType: "PT008" },
  Tester: { color: "#E11D48", tasks: ["test_case_generation", "test_plan", "automation_script", "defect_report", "regression_matrix"], promptTypes: ["PT004", "PT005", "PT009", "PT019", "PT022"], primaryPromptType: "PT009" },
  Sales: { color: "#7C3AED", tasks: ["proposal", "pitch_narrative", "competitive_comparison", "pricing_summary", "customer_faq"], promptTypes: ["PT001", "PT003", "PT005", "PT022", "PT024", "PT025"], primaryPromptType: "PT025" },
} as const;

export type PersonaName = keyof typeof PERSONAS;
export const PERSONA_NAMES = Object.keys(PERSONAS) as PersonaName[];
export const DEFAULT_PERSONA: PersonaName = "AI Engineer";
export function isPersona(name: string): name is PersonaName { return name in PERSONAS; }
export function taskTokenDefault(task: string): number {
  if (task === "solution_document") return 4096;
  if (task === "code_generation") return 2048;
  if (task === "customer_faq") return 1024;
  return 2048;
}
