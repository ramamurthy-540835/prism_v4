import { NextResponse } from "next/server";
import { callModel } from "@backend/lib/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await callModel({ provider: body.provider, modelId: body.modelId, systemPrompt: body.systemPrompt, userMessage: body.userMessage, maxTokens: Number(body.maxTokens ?? 256), costPerInputToken: 0, costPerOutputToken: 0 });
    return NextResponse.json({ result }, { status: result.status === "success" ? 200 : 502 });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "TEST_CALL_FAILED", message: String(error?.message ?? error) } }, { status: 500 });
  }
}