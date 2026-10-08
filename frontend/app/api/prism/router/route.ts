import { NextResponse } from "next/server";
import { env } from "@backend/lib/env";
import { queryBigQuery, insertUsage } from "@backend/lib/bigquery";
import { ossaGuard, safetyViolation } from "@backend/lib/ossa";
import { callModel, resolveModel } from "@backend/lib/models";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";

export async function POST(req: Request) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: { message: "Sign in required" } }, { status: 401 });
    const body = await req.json();
    const {
      persona = "",
      taskType = "general",
      planId = "starter",
      promptId,
      promptVersion,
      userMessage = "",
      maxTokens,
      requestedModelId,
    } = body;
    const userId = session.email;
    const orgId = session.orgId;
    const role = session.role;
    const projectId = String(body.projectId || "");
    if (!projectId) return NextResponse.json({ error: { message: "Choose a project first" } }, { status: 400 });
    await ensureSeeded();
    const projectRows = await queryBigQuery<any>(`SELECT id,slug FROM \`${env.projectId}.${env.dataset}.projects\` p
      WHERE id=@projectId AND org_id=@orgId AND (approval_status='approved' OR approval_status IS NULL)
      AND (visibility='public' OR owner_id=@principalId OR @isAdmin OR EXISTS (
        SELECT 1 FROM \`${env.projectId}.${env.dataset}.project_members\` m WHERE m.project_id=p.id AND m.user_id=@principalId)) LIMIT 1`,
      { projectId, orgId, principalId: session.id, isAdmin: role === "admin" });
    if (!projectRows[0]) return NextResponse.json({ error: { message: "Project is unavailable or awaiting approval" } }, { status: 403 });
    const runId = randomUUID();

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
    const ossaResult = await ossaGuard({ userId, orgId, estimatedTokens, estimatedCostUsd, userMessage });

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
      await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.execution_logs\`
        (run_id,event_ts,tenant,project_id,user_id,persona,task_type,prompt_type_id,route_rule,route_reason,status,cost_usd)
        VALUES (@runId,CURRENT_TIMESTAMP(),@tenant,@projectId,@userId,@persona,@taskType,@promptTypeId,'OSSA safety',@reason,'blocked',0)`,
        { runId, tenant: orgId, projectId, userId, persona, taskType, promptTypeId: String(body.promptTypeId || ""), reason: ossaResult.reason });
      return NextResponse.json({ ossaDecision: "stop", reason: ossaResult.reason, runId,
        modelRouterEvidence: { rule: "OSSA safety", model: "none", reason: ossaResult.reason } }, { status: 403 });
    }

    // 5. Resolve model from BigQuery routing rules
    const route = await resolveModel({ planId, persona, taskType, requestedModelId });

    // 6. Call model
    const modelResult = await callModel({
      provider: route.provider,
      modelId: route.modelId,
      systemPrompt,
      userMessage,
      maxTokens: maxTokens ?? route.maxTokens,
      costPerInputToken: route.costPerInputToken,
      costPerOutputToken: route.costPerOutputToken,
    });

    const outputViolation = safetyViolation(modelResult.responseText || "");
    if (outputViolation) {
      await insertUsage({ userId, orgId, role, persona, taskType, planId, provider: modelResult.provider,
        modelId: modelResult.modelId, status: "blocked", reason: `safety_violation: ${outputViolation}` });
      await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.execution_logs\`
        (run_id,event_ts,tenant,project_id,user_id,persona,task_type,prompt_type_id,model_id,provider,route_rule,route_reason,status,input_tokens,output_tokens,cost_usd)
        VALUES (@runId,CURRENT_TIMESTAMP(),@tenant,@projectId,@userId,@persona,@taskType,@promptTypeId,@modelId,@provider,@routeRule,@routeReason,'blocked',@inputTokens,@outputTokens,@costUsd)`,
        { runId, tenant: orgId, projectId, userId, persona, taskType, promptTypeId: String(body.promptTypeId || ""),
          modelId: modelResult.modelId, provider: modelResult.provider, routeRule: route.ruleKey, routeReason: outputViolation,
          inputTokens: modelResult.inputTokens, outputTokens: modelResult.outputTokens, costUsd: modelResult.actualCostUsd });
      return NextResponse.json({ ossaDecision: "stop", reason: outputViolation, runId,
        modelRouterEvidence: { rule: route.ruleKey, model: modelResult.modelId, reason: outputViolation } }, { status: 403 });
    }

    let artifactPath = "";
    let artifactUrl = "";
    let artifactError = "";
    if (modelResult.status === "success" && modelResult.responseText) {
      try {
        const filename = /code_|refactoring|bug_fix/.test(taskType) ? "code.md" : /test_|automation_script/.test(taskType) ? "tests.md" : "document.md";
        artifactPath = `${orgId}/${projectRows[0].slug}/${runId}/${filename}`;
        const file = new Storage({ projectId: env.projectId }).bucket(`${env.projectId}-prism-artifacts`).file(artifactPath);
        await file.save(modelResult.responseText, { contentType: "text/markdown; charset=utf-8" });
        [artifactUrl] = await file.getSignedUrl({ version: "v4", action: "read", expires: Date.now() + 15 * 60_000 });
      } catch (error) { artifactError = String(error); }
    }
    const finalStatus = artifactError ? "artifact_error" : modelResult.status;

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
      reason: `${ossaResult.reason} Router: ${route.ruleKey}; ${route.reason}; ${route.fallbackReason}`,
      latencyMs: modelResult.latencyMs,
      taskType, planId, status: finalStatus,
    });
    await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.execution_logs\`
      (run_id,event_ts,tenant,project_id,user_id,persona,task_type,prompt_type_id,model_id,provider,route_rule,route_reason,fallback_reason,status,input_tokens,output_tokens,cost_usd,artifact_path)
      VALUES (@runId,CURRENT_TIMESTAMP(),@tenant,@projectId,@userId,@persona,@taskType,@promptTypeId,@modelId,@provider,@routeRule,@routeReason,@fallbackReason,@status,@inputTokens,@outputTokens,@costUsd,@artifactPath)`,
      { runId, tenant: orgId, projectId, userId, persona, taskType, promptTypeId: String(body.promptTypeId || ""),
        modelId: modelResult.modelId, provider: modelResult.provider, routeRule: route.ruleKey, routeReason: route.reason,
        fallbackReason: route.fallbackReason, status: finalStatus, inputTokens: modelResult.inputTokens,
        outputTokens: modelResult.outputTokens, costUsd: modelResult.actualCostUsd, artifactPath });

    // 8. Return all fields
    return NextResponse.json({
      ...(finalStatus !== "success" ? { error: { message: artifactError || modelResult.errorMessage || "Model request failed" } } : {}),
      ossaDecision: ossaResult.decision,
      reason: ossaResult.reason,
      provider: modelResult.provider,
      modelId: modelResult.modelId,
      modelRouterEvidence: { rule: route.ruleKey, model: modelResult.modelId, reason: route.reason, fallbackReason: route.fallbackReason },
      inputTokens: modelResult.inputTokens,
      outputTokens: modelResult.outputTokens,
      costUsd: modelResult.actualCostUsd,
      responseText: modelResult.responseText,
      runId,
      artifactUrl,
      latencyMs: modelResult.latencyMs,
    }, { status: finalStatus === "success" ? 200 : 502 });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "ROUTER_ERROR", message: String(error?.message ?? error) } },
      { status: 500 }
    );
  }
}
