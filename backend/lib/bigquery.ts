import { BigQuery } from "@google-cloud/bigquery";
import { env } from "./env";

let client: BigQuery | undefined;
export function bigquery() { return client ||= new BigQuery({ projectId: env.projectId }); }
export async function queryBigQuery<T = Record<string, unknown>>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const [rows] = await bigquery().query({ query, params, location: process.env.BQ_LOCATION || "US" });
  return rows as T[];
}
export async function insertUsage(row: Record<string, unknown>) {
  const errors = await bigquery().dataset(env.dataset).table(env.usageTable).insert([{ event_ts: new Date().toISOString(), ...row }]);
  return errors;
}
