import { NextResponse } from "next/server";
import { getRoute } from "@backend/lib/routing";
import { ossaGuard } from "@backend/lib/ossa";
import { callModel } from "@backend/lib/models";
import { insertUsage } from "@backend/lib/bigquery";
import { getPromptTemplate } from "@backend/lib/prompts";

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const managedPrompt = await getPromptTemplate(body.promptId, body.promptVersion);
    const systemPrompt = managedPrompt?.systemPrompt ?? body.systemPrompt;
    const route = await getRoute({ orgId: body.orgId, planId: body.planId, taskType: body.taskType });
    const estimatedInputTokens = estimateTokens(`${systemPrompt ?? ""}\n${body.userMessage ?? ""}`);
    const ossa = await ossaGuard({ orgId: body.orgId, userId: body.userId, estimatedTokens: estimatedInputTokens, estimatedCostUsd: route.costPerInputToken * estimatedInputTokens });
    if (route.routingDecision === "blocked" || ossa.decision === "stop") {
      await insertUsage({ ...body, provider: route.provider, model_id: route.modelId, status: "blocked", reason: `${route.reason}; ${ossa.reason}` });
      return NextResponse.json({ status: "blocked", route, ossa }, { status: 429 });
    }
    const result = await callModel({ provider: route.provider, modelId: route.modelId, systemPrompt, userMessage: body.userMessage, maxTokens: Number(body.maxTokens ?? route.maxTokensPerCall), costPerInputToken: route.costPerInputToken, costPerOutputToken: route.costPerOutputToken });
    await insertUsage({ ...body, systemPrompt, provider: route.provider, model_id: route.modelId, decision: route.routingDecision, status: result.status, input_tokens: result.inputTokens, output_tokens: result.outputTokens, total_tokens: result.totalTokens, estimated_cost_usd: result.estimatedCostUsd, actual_cost_usd: result.actualCostUsd });
    return NextResponse.json({ route, ossa, prompt: managedPrompt ? { promptId: managedPrompt.promptId, promptVersion: managedPrompt.promptVersion } : null, result }, { status: result.status === "success" ? 200 : 502 });
  } catch (error: any) {
    const message =
      error?.message ||
      error?.errors?.[0]?.message ||
      error?.response?.data?.error?.message ||
      (typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return NextResponse.json({ error: { code: "ROUTER_CALL_FAILED", message } }, { status: 500 });
  }
}
