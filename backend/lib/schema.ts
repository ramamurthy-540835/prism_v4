import { env } from "./env";
import { queryBigQuery } from "./bigquery";
export async function getActiveColumn(table: string) {
  const rows = await queryBigQuery<{ column_name: string }>(`SELECT column_name FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name=@table AND column_name IN ('active','status') LIMIT 1`, { table });
  return rows[0]?.column_name || null;
}
export function activeWhereClause(column: string | null) { return column === "active" ? "AND active = TRUE" : column === "status" ? "AND status = 'active'" : ""; }
