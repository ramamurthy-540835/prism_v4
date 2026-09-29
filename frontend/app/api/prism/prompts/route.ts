import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { bigquery, queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const cols = await queryBigQuery<{ column_name: string }>(`
      SELECT column_name
      FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'prism_prompts'
    `);
    const colSet = new Set(cols.map((c) => c.column_name));
    const hasPersona = colSet.has("persona");

    const rows = await queryBigQuery(`
      SELECT p.promptId, p.name, p.taskType, p.status, p.createdAt,
        ${hasPersona ? "p.persona," : ""}
        pv.systemPrompt, pv.promptVersion AS version
      FROM \`${env.projectId}.${env.dataset}.prism_prompts\` p
      LEFT JOIN (
        SELECT promptId, systemPrompt, promptVersion, createdAt,
          ROW_NUMBER() OVER (PARTITION BY promptId ORDER BY createdAt DESC) AS rn
        FROM \`${env.projectId}.${env.dataset}.prism_prompt_versions\`
      ) pv ON p.promptId = pv.promptId AND pv.rn = 1
      WHERE p.status = 'active'
      ORDER BY p.createdAt DESC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: { code: "PROMPTS_FETCH_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();
    const promptId = body.promptId ?? crypto.randomUUID();

    await bigquery().dataset(env.dataset).table("prism_prompts").insert([{
      promptId,
      name: body.name,
      taskType: body.taskType,
      ...(body.persona ? { persona: body.persona } : {}),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    }]);

    await bigquery().dataset(env.dataset).table("prism_prompt_versions").insert([{
      promptId,
      promptVersion: body.promptVersion ?? "v1",
      systemPrompt: body.systemPrompt,
      createdAt: now,
      createdBy: body.createdBy ?? "system",
    }]);

    return NextResponse.json({ promptId, status: "created" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "PROMPT_CREATE_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}
