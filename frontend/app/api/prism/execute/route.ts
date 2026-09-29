import { NextResponse } from "next/server";
import { estimateUsage } from "@backend/lib/estimator";
import { craftSystemPrompt } from "@backend/lib/prompt_crafter";
import { getRoute } from "@backend/lib/routing";
import { ossaGuard } from "@backend/lib/ossa";
import { callModel } from "@backend/lib/models";
import { insertUsage } from "@backend/lib/bigquery";
import { getPromptTemplate } from "@backend/lib/prompts";
import { diagramGenerate, gitAutomate } from "@backend/lib/actions/external_tools";

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as "estimate" | "craft_prompt" | "governed_call" | "diagram_generate" | "git_automate" | "intelligence";

    if (action === "estimate") {
      return NextResponse.json(estimateUsage({
        userMessage: body.userMessage ?? "",
        systemPrompt: body.systemPrompt ?? "",
      }));
    }

    if (action === "craft_prompt") {
      const systemPrompt = craftSystemPrompt({ useCase: body.useCase, role: body.role, theme: body.theme });
      return NextResponse.json({ systemPrompt });
    }

    if (action === "diagram_generate") {
      const result = await diagramGenerate({ prompt: body.prompt ?? body.userMessage ?? "" });
      await insertUsage({
        ...body,
        status: result.ok ? "success" : "error",
        decision: "allow",
        provider: "local",
        model_id: "diagram_as_code",
        reason: result.message,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 500 });
    }

    if (action === "git_automate") {
      const result = await gitAutomate({ repo_url: body.repo_url, github_token: body.github_token });
      await insertUsage({
        ...body,
        status: result.ok ? "success" : "error",
        decision: "allow",
        provider: "local",
        model_id: "git_developer_workflow",
        reason: result.message,
      });
      return NextResponse.json(result, { status: result.ok ? 200 : 500 });
    }

    if (action === "intelligence") {
      const systemPrompt = body.systemPrompt ?? "You are PRISM Intelligence running on Gemini 2.5 Flash.";
      const result = await callModel({
        provider: "vertex",
        modelId: "gemini-2.5-flash",
        systemPrompt,
        userMessage: body.userMessage ?? "",
        maxTokens: Number(body.maxTokens ?? 1024),
        costPerInputToken: 0.000001,
        costPerOutputToken: 0.000004
      });
      await insertUsage({
        ...body,
        provider: "vertex",
        model_id: "gemini-2.5-flash",
        decision: "allow",
        status: result.status,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        total_tokens: result.totalTokens,
        estimated_cost_usd: result.estimatedCostUsd,
        actual_cost_usd: result.actualCostUsd
      });
      return NextResponse.json({ action: "intelligence", provider: "vertex", modelId: "gemini-2.5-flash", result }, { status: result.status === "success" ? 200 : 502 });
    }

    if (action !== "governed_call") {
      return NextResponse.json({ error: { code: "INVALID_ACTION", message: "action must be estimate, craft_prompt, governed_call, intelligence, diagram_generate, or git_automate" } }, { status: 400 });
    }

    const managedPrompt = await getPromptTemplate(body.promptId, body.promptVersion);
    const systemPrompt = managedPrompt?.systemPrompt ?? body.systemPrompt;

    const route = await getRoute({ orgId: body.orgId, planId: body.planId, taskType: body.taskType });
    const estimatedInputTokens = estimateTokens(`${systemPrompt ?? ""}\n${body.userMessage ?? ""}`);
    const ossa = await ossaGuard({ orgId: body.orgId, userId: body.userId, estimatedTokens: estimatedInputTokens, estimatedCostUsd: route.costPerInputToken * estimatedInputTokens });

    if (route.routingDecision === "blocked" || ossa.decision === "stop") {
      await insertUsage({ ...body, systemPrompt, provider: route.provider, model_id: route.modelId, decision: route.routingDecision, status: "blocked", reason: `${route.reason}; ${ossa.reason}` });
      return NextResponse.json({ status: "blocked", route, ossa }, { status: 429 });
    }

    const result = await callModel({
      provider: route.provider,
      modelId: route.modelId,
      systemPrompt,
      userMessage: body.userMessage,
      maxTokens: Number(body.maxTokens ?? route.maxTokensPerCall),
      costPerInputToken: route.costPerInputToken,
      costPerOutputToken: route.costPerOutputToken,
    });

    await insertUsage({
      ...body,
      systemPrompt,
      provider: route.provider,
      model_id: route.modelId,
      decision: route.routingDecision,
      status: result.status,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      total_tokens: result.totalTokens,
      estimated_cost_usd: result.estimatedCostUsd,
      actual_cost_usd: result.actualCostUsd,
      error_code: result.errorCode,
      error_message: result.errorMessage,
      latency_ms: result.latencyMs,
    });

    return NextResponse.json({ route, ossa, result, prompt: managedPrompt ? { promptId: managedPrompt.promptId, promptVersion: managedPrompt.promptVersion } : null });
  } catch (error: any) {
    const message = error?.message || error?.errors?.[0]?.message || (typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})));
    return NextResponse.json({ error: { code: "EXECUTE_FAILED", message } }, { status: 500 });
  }
}
