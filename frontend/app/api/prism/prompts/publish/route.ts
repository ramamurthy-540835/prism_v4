import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { bigquery } from "@backend/lib/bigquery";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      persona,
      taskType,
      systemPrompt,
      createdBy = "system",
      promptTypeId,
      promptTypeCategory,
    } = body;

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "name and systemPrompt are required" } },
        { status: 400 }
      );
    }

    const promptId = crypto.randomUUID();
    const version = "v1";
    const now = new Date().toISOString();

    await bigquery().dataset(env.dataset).table("prism_prompts").insert([{
      promptId,
      name,
      ...(persona ? { persona } : {}),
      ...(taskType ? { taskType } : {}),
      ...(promptTypeId ? { prompt_type_id: promptTypeId } : {}),
      ...(promptTypeCategory ? { prompt_type_category: promptTypeCategory } : {}),
      status: "active",
      currentVersion: version,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }]);

    await bigquery().dataset(env.dataset).table("prism_prompt_versions").insert([{
      promptId,
      version,
      systemPrompt,
      ...(promptTypeId ? { prompt_type_id: promptTypeId } : {}),
      createdAt: now,
      createdBy,
    }]);

    return NextResponse.json({ promptId, version });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "PROMPT_PUBLISH_FAILED", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}
