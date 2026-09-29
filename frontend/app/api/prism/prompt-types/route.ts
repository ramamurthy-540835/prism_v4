import { NextResponse } from "next/server";
import { queryBigQuery } from "@backend/lib/bigquery";
import { env } from "@backend/lib/env";

let _promptTypesCache: any = null;
let _promptTypesCachedAt = 0;
const PROMPT_TYPES_TTL = 10 * 60 * 1000;

export async function GET() {
  if (_promptTypesCache && Date.now() - _promptTypesCachedAt < PROMPT_TYPES_TTL) {
    return NextResponse.json(_promptTypesCache);
  }

  try {
    const rows = await queryBigQuery(`
      SELECT prompt_type_id, name, category, template, input_vars, description, where_to_apply, example, use_case
      FROM \`${env.projectId}.${env.dataset}.prism_prompt_types\`
      ORDER BY prompt_type_id
    `);
    _promptTypesCache = rows;
    _promptTypesCachedAt = Date.now();
    return NextResponse.json(rows);
  } catch (error: any) {
    if (_promptTypesCache) return NextResponse.json(_promptTypesCache);
    return NextResponse.json(
      { error: { code: "PROMPT_TYPES_FETCH_FAILED", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}
