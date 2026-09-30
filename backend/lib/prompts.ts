import { env } from "./env";
import { queryBigQuery } from "./bigquery";
export async function getPromptTemplate(promptId?: string, promptVersion?: string) {
  if (!promptId) return null;
  const rows = await queryBigQuery<any>(`SELECT promptId, promptVersion, systemPrompt FROM \`${env.projectId}.${env.dataset}.prism_prompt_versions\` WHERE promptId=@promptId ${promptVersion ? "AND promptVersion=@promptVersion" : ""} ORDER BY createdAt DESC LIMIT 1`, { promptId, promptVersion });
  return rows[0] || null;
}
