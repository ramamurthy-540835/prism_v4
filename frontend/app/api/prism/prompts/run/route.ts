import { NextResponse } from "next/server";
import { getPromptTemplate } from "@backend/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = await getPromptTemplate(body.promptId, body.promptVersion);
    if (!prompt) return NextResponse.json({ error: { code: "PROMPT_NOT_FOUND", message: "Prompt not found" } }, { status: 404 });
    return NextResponse.json(prompt);
  } catch (error: any) {
    return NextResponse.json({ error: { code: "PROMPT_RUN_FETCH_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}
