/**
 * Seed improved (v2) system prompts from frontend/scripts/improved-prompts.json
 * - Inserts version="v2" into prism_prompt_versions
 * - Updates prism_prompts.currentVersion = "v2"
 * Run: npx ts-node frontend/scripts/seed-improved-prompts.ts
 */
import * as path from "path";
import * as fs from "fs";
import { BigQuery } from "@google-cloud/bigquery";

const PROJECT = "ctoteam";
const DATASET = "prism";
const bq = new BigQuery({ projectId: PROJECT });

type ImprovedPrompt = {
  promptId: string;
  name: string;
  persona: string;
  taskType: string;
  promptTypeId?: string;
  version: string;
  systemPrompt: string;
};

async function promptExists(promptId: string): Promise<boolean> {
  const [rows] = await bq.query({
    query: `SELECT 1 FROM \`${PROJECT}.${DATASET}.prism_prompts\` WHERE promptId = @promptId LIMIT 1`,
    params: { promptId },
    useLegacySql: false,
  });
  return rows.length > 0;
}

async function versionExists(promptId: string, version: string): Promise<boolean> {
  const [rows] = await bq.query({
    query: `SELECT 1 FROM \`${PROJECT}.${DATASET}.prism_prompt_versions\` WHERE promptId = @promptId AND version = @version LIMIT 1`,
    params: { promptId, version },
    useLegacySql: false,
  });
  return rows.length > 0;
}

async function main() {
  const jsonPath = path.resolve(__dirname, "./improved-prompts.json");
  const improved: ImprovedPrompt[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const now = new Date().toISOString();
  let inserted = 0;
  let created = 0;
  let skipped = 0;

  for (const p of improved) {
    // Ensure base prompt row exists (create if missing)
    const baseExists = await promptExists(p.promptId);
    if (!baseExists) {
      await bq.dataset(DATASET).table("prism_prompts").insert([{
        promptId: p.promptId,
        name: p.name,
        persona: p.persona,
        taskType: p.taskType,
        description: `${p.persona} system prompt for ${p.taskType.replace(/_/g, " ")} (${p.version})`,
        status: "active",
        currentVersion: p.version,
        prompt_type_id: p.promptTypeId ?? null,
        prompt_type_category: null,
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      }]);
      console.log(`CREATE ${p.promptId}`);
      created++;
    }

    // Insert version if not exists
    if (await versionExists(p.promptId, p.version)) {
      console.log(`SKIP   ${p.promptId} @ ${p.version} (already exists)`);
      skipped++;
      continue;
    }

    await bq.dataset(DATASET).table("prism_prompt_versions").insert([{
      promptId: p.promptId,
      version: p.version,
      systemPrompt: p.systemPrompt,
      prompt_type_id: p.promptTypeId ?? null,
      createdAt: now,
      createdBy: "system",
    }]);

    // Update currentVersion on prism_prompts
    await bq.query({
      query: `
        UPDATE \`${PROJECT}.${DATASET}.prism_prompts\`
        SET currentVersion = @version, updatedAt = @now
        WHERE promptId = @promptId
      `,
      params: { version: p.version, now, promptId: p.promptId },
      useLegacySql: false,
    });

    console.log(`INSERT ${p.promptId} @ ${p.version} (${p.persona} / ${p.taskType})`);
    inserted++;
  }

  console.log(`\nDone. Created base: ${created}, Inserted v2: ${inserted}, Skipped: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
