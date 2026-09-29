import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery, insertUsage } from "@backend/lib/bigquery";
import { ossaGuard } from "@backend/lib/ossa";
import { callModel, resolveModel } from "@backend/lib/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "anonymous",
      orgId = "default",
      role = "viewer",
      persona = "",
      taskType = "general",
      planId = "plan-starter",
      promptId,
      promptVersion,
      userMessage = "",
      maxTokens = 1024,
      requestedModelId,
    } = body;

    // 1. Load system prompt from BigQuery
    let systemPrompt: string = body.systemPrompt ?? "";
    if (promptId) {
      const rows = await queryBigQuery<any>(`
        SELECT systemPrompt
        FROM \`${env.projectId}.${env.dataset}.prism_prompt_versions\`
        WHERE promptId = @promptId
        ${promptVersion ? "AND promptVersion = @promptVersion" : ""}
        ORDER BY createdAt DESC
        LIMIT 1
      `, { promptId, ...(promptVersion ? { promptVersion } : {}) });
      if (rows[0]?.systemPrompt) systemPrompt = rows[0].systemPrompt;
    }

    // 2. Estimate tokens
    const estimatedTokens = Math.max(1, Math.ceil(`${systemPrompt}\n${userMessage}`.length / 4));
    const estimatedCostUsd = estimatedTokens * 0.000002;

    // 3. OSSA guard
    const ossaResult = await ossaGuard({ userId, orgId, estimatedTokens, estimatedCostUsd });

    // 4. If stop → 403
    if (ossaResult.decision === "stop") {
      await insertUsage({
        userId, orgId, role, persona, promptId, promptVersion,
        modelId: "none", provider: "none",
        inputTokens: 0, outputTokens: 0, totalTokens: estimatedTokens,
        estimatedCostUsd: 0, actualCostUsd: 0,
        decision: "stop", reason: ossaResult.reason,
        latencyMs: 0, taskType, planId, status: "blocked",
      });
      return NextResponse.json({ ossaDecision: "stop", reason: ossaResult.reason }, { status: 403 });
    }

    // 5. Resolve model from BigQuery routing rules
    const route = await resolveModel({ planId, taskType, requestedModelId });

    // 6. Call model
    const modelResult = await callModel({
      provider: route.provider,
      modelId: route.modelId,
      systemPrompt,
      userMessage,
      maxTokens: maxTokens ?? route.maxTokens,
    });

    // 7. Log usage to BigQuery
    await insertUsage({
      userId, orgId, role, persona, promptId, promptVersion,
      modelId: modelResult.modelId,
      provider: modelResult.provider,
      inputTokens: modelResult.inputTokens,
      outputTokens: modelResult.outputTokens,
      totalTokens: modelResult.totalTokens,
      estimatedCostUsd: modelResult.estimatedCostUsd,
      actualCostUsd: modelResult.actualCostUsd,
      decision: ossaResult.decision,
      reason: ossaResult.reason,
      latencyMs: modelResult.latencyMs,
      taskType, planId, status: modelResult.status,
    });

    // 8. Return all fields
    return NextResponse.json({
      ossaDecision: ossaResult.decision,
      reason: ossaResult.reason,
      provider: modelResult.provider,
      modelId: modelResult.modelId,
      inputTokens: modelResult.inputTokens,
      outputTokens: modelResult.outputTokens,
      costUsd: modelResult.actualCostUsd,
      responseText: modelResult.responseText,
      latencyMs: modelResult.latencyMs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "ROUTER_ERROR", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}
