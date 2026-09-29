/**
 * Seed prism_prompts + prism_prompt_versions from knowledge/prompt_types/Prompts_Types.json
 * Run: npx ts-node frontend/scripts/seed-prompts.ts
 */
import * as path from "path";
import * as fs from "fs";
import { BigQuery } from "@google-cloud/bigquery";

const PROJECT = "ctoteam";
const DATASET = "prism";
const bq = new BigQuery({ projectId: PROJECT });

// Prompt type ID mapping (matches prism_prompt_types table order)
const PROMPT_TYPE_IDS: Record<string, { id: string; category: string }> = {
  "Instruction-Based":                  { id: "PT001", category: "Instruction" },
  "Chain-of-Thought":                   { id: "PT002", category: "Few-Shot" },
  "Zero-Shot":                          { id: "PT003", category: "Instruction" },
  "Few-Shot":                           { id: "PT004", category: "Few-Shot" },
  "Self-Consistency":                   { id: "PT005", category: "Reasoning" },
  "Tree-of-Thoughts":                   { id: "PT006", category: "Reasoning" },
  "Graph-of-Thought":                   { id: "PT007", category: "Agentic" },
  "Skeleton-of-Thought":                { id: "PT008", category: "Instruction" },
  "Chain-of-Verification":              { id: "PT009", category: "Reasoning" },
  "ReAct":                              { id: "PT010", category: "Agentic" },
  "Active-Prompt":                      { id: "PT011", category: "Instruction" },
  "Instruction Prompting and Tuning":   { id: "PT012", category: "Instruction" },
  "Recursive Prompting":                { id: "PT013", category: "Instruction" },
  "Automatic Prompt Engineer (APE)":    { id: "PT014", category: "Instruction" },
  "Automatic Reasoning and Tool-use (ART)": { id: "PT015", category: "Agentic" },
  "Retrieval Augmented Generation (RAG)": { id: "PT016", category: "Retrieval" },
  "Chain-of-Note":                      { id: "PT017", category: "Retrieval" },
  "Chain-of-Knowledge":                 { id: "PT018", category: "Reasoning" },
  "Chain-of-Code":                      { id: "PT019", category: "Few-Shot" },
  "Chain-of-Symbol":                    { id: "PT020", category: "Few-Shot" },
  "Structured Chain-of-Thought":        { id: "PT021", category: "Few-Shot" },
  "Contrastive Chain-of-Thought":       { id: "PT022", category: "Reasoning" },
  "Logical Chain-of-Thought":           { id: "PT023", category: "Reasoning" },
  "System 2 Attention Prompting":       { id: "PT024", category: "Reasoning" },
  "Emotion Prompting":                  { id: "PT025", category: "Emotional" },
};

// Task type derived from prompt type's primary use
const TASK_TYPE_MAP: Record<string, string> = {
  "Instruction-Based": "general",
  "Chain-of-Thought": "learning_explanation",
  "Zero-Shot": "general",
  "Few-Shot": "code_generation",
  "Self-Consistency": "research",
  "Tree-of-Thoughts": "architecture_design",
  "Graph-of-Thought": "diagram_generation",
  "Skeleton-of-Thought": "requirements_analysis",
  "Chain-of-Verification": "code_review",
  "ReAct": "general",
  "Active-Prompt": "requirements_analysis",
  "Instruction Prompting and Tuning": "documentation",
  "Recursive Prompting": "research",
  "Automatic Prompt Engineer (APE)": "general",
  "Automatic Reasoning and Tool-use (ART)": "general",
  "Retrieval Augmented Generation (RAG)": "retrieval",
  "Chain-of-Note": "summarisation",
  "Chain-of-Knowledge": "research",
  "Chain-of-Code": "code_generation",
  "Chain-of-Symbol": "diagram_generation",
  "Structured Chain-of-Thought": "test_generation",
  "Contrastive Chain-of-Thought": "gap_analysis",
  "Logical Chain-of-Thought": "gap_analysis",
  "System 2 Attention Prompting": "summarisation",
  "Emotion Prompting": "mentoring",
};

// Persona derived from task type
const PERSONA_MAP: Record<string, string> = {
  general: "Developer",
  learning_explanation: "Mentor",
  code_generation: "Developer",
  research: "Architect",
  architecture_design: "Architect",
  diagram_generation: "Architect",
  requirements_analysis: "BusinessAnalyst",
  code_review: "Tester",
  documentation: "Developer",
  retrieval: "AIEngineer",
  summarisation: "BusinessAnalyst",
  test_generation: "Tester",
  gap_analysis: "QA",
  mentoring: "Mentor",
  security_audit: "Tester",
  data_analysis: "AIEngineer",
};

// Build systemPrompt from template with OSSA governance framing
function buildSystemPrompt(name: string, template: string, taskType: string, persona: string): string {
  const roleMap: Record<string, string> = {
    Developer: "Senior Software Developer at Mastech Digital",
    Architect: "Principal Software Architect at Mastech Digital",
    Tester: "Senior QA Engineer at Mastech Digital",
    QA: "Quality Assurance Lead at Mastech Digital",
    BusinessAnalyst: "Senior Business Analyst at Mastech Digital",
    AIEngineer: "AI/ML Engineer at Mastech Digital",
    Mentor: "Technical Mentor at Mastech Digital",
    Student: "Software Engineering Apprentice at Mastech Digital",
    Admin: "PRISM Platform Administrator",
  };

  const outputFmtMap: Record<string, string> = {
    code_generation: "Output well-commented code in fenced code blocks. Include language identifier. Add inline comments for complex logic.",
    code_review: "Output a numbered list of findings. For each: severity (Critical/High/Medium/Low), file/line reference, explanation, and recommended fix.",
    architecture_design: "Output a structured architecture document: Overview, Components, Data Flow, Trade-offs, Decision Rationale. Use diagrams-as-text where helpful.",
    test_generation: "Output test cases in the format: Test ID, Description, Preconditions, Steps, Expected Result. Use code blocks for test code.",
    gap_analysis: "Output a gap analysis table: Current State, Target State, Gap, Impact (High/Med/Low), Recommended Action.",
    requirements_analysis: "Output requirements as numbered user stories: As a [role], I want [feature], so that [benefit]. Include acceptance criteria.",
    diagram_generation: "Output diagrams as structured text (Mermaid or PlantUML syntax). Prefer concise, readable notation.",
    mentoring: "Output guidance in conversational paragraphs. Include: explanation, analogy, example, and next learning step.",
    learning_explanation: "Output in three sections: Concept Explanation (simple terms), Example (concrete and runnable), Common Mistakes. Use code blocks for examples.",
    retrieval: "Output retrieved facts as bullet points with source attribution. Synthesize a final answer after listing facts.",
    summarisation: "Output a structured summary: Key Points (bullet list), Implications, Action Items (if any).",
    research: "Output a research summary: Question, Methodology, Findings (numbered), Conclusions, Limitations.",
    documentation: "Output as structured markdown: Overview, Usage, Parameters/Options, Examples, Notes.",
    data_analysis: "Output as: Objective, Data Summary, Analysis Steps, Findings (table or bullets), Recommendations.",
    security_audit: "Output as: Vulnerability ID, OWASP Category, Severity, Description, Affected Code, Remediation.",
    general: "Output clear, structured prose. Use bullet points for lists, code blocks for code. Be concise.",
  };

  const role = roleMap[persona] ?? "AI Assistant at Mastech Digital";
  const outputFmt = outputFmtMap[taskType] ?? outputFmtMap.general;

  return `You are a ${role}.

Your task is to apply the ${name} prompting strategy to complete the requested ${taskType.replace(/_/g, " ")} task.

Strategy: ${template}

OSSA Governance: You must produce output within the allocated token budget. Be concise and precise. Avoid redundancy. If the task is large, focus on the most critical elements first.

Output format: ${outputFmt}

If you are uncertain, state your assumptions explicitly. Do not hallucinate.`;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function exists(promptId: string): Promise<boolean> {
  const [rows] = await bq.query({
    query: `SELECT 1 FROM \`${PROJECT}.${DATASET}.prism_prompts\` WHERE promptId = @promptId LIMIT 1`,
    params: { promptId },
    useLegacySql: false,
  });
  return rows.length > 0;
}

async function main() {
  const jsonPath = path.resolve(__dirname, "../../knowledge/prompt_types/Prompts_Types.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const promptTypes: Record<string, { template: string; input_vars: string[] }> = JSON.parse(raw);

  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;

  for (const [name, data] of Object.entries(promptTypes)) {
    const ptInfo = PROMPT_TYPE_IDS[name];
    if (!ptInfo) { console.warn(`No PT ID for: ${name}`); continue; }

    const taskType = TASK_TYPE_MAP[name] ?? "general";
    const persona = PERSONA_MAP[taskType] ?? "Developer";
    const promptId = slugify(name);
    const systemPrompt = buildSystemPrompt(name, data.template, taskType, persona);

    if (await exists(promptId)) {
      console.log(`SKIP  ${promptId} (already exists)`);
      skipped++;
      continue;
    }

    await bq.dataset(DATASET).table("prism_prompts").insert([{
      promptId,
      name,
      persona,
      taskType,
      description: `${name} prompting strategy for ${taskType.replace(/_/g, " ")} tasks.`,
      status: "active",
      currentVersion: "v1",
      prompt_type_id: ptInfo.id,
      prompt_type_category: ptInfo.category,
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
    }]);

    await bq.dataset(DATASET).table("prism_prompt_versions").insert([{
      promptId,
      version: "v1",
      systemPrompt,
      prompt_type_id: ptInfo.id,
      createdAt: now,
      createdBy: "system",
    }]);

    console.log(`INSERT ${promptId} → ${ptInfo.id} (${ptInfo.category}) / ${taskType} / ${persona}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
