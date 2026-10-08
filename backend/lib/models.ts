import { getRoute } from "./routing";
import { env } from "./env";

const RATES: Record<string, [number, number]> = {
  "gemini-2.5-flash": [0.15 / 1_000_000, 0.60 / 1_000_000],
  "gemini-2.5-pro": [1.25 / 1_000_000, 10 / 1_000_000],
  "claude-sonnet-4-6": [3 / 1_000_000, 15 / 1_000_000],
};

export async function resolveModel(input: { planId?: string; persona?: string; taskType?: string; requestedModelId?: string }) {
  const route = await getRoute(input);
  if (route.routingDecision !== "allow") throw new Error(route.reason);
  const pinned = Boolean(input.requestedModelId && input.requestedModelId !== "auto");
  let modelId = pinned ? input.requestedModelId! : route.modelId;
  let provider = modelId.startsWith("claude-") ? "anthropic" : "vertex";
  let fallbackReason = "";
  if (provider === "anthropic" && process.env.ANTHROPIC_VERTEX_ENABLED !== "true") {
    modelId = "gemini-2.5-pro";
    provider = "vertex";
    fallbackReason = "Anthropic model access is not enabled for this project; Gemini 2.5 Pro fallback used.";
  }
  return { provider, modelId, maxTokens: route.maxTokensPerCall,
    ruleKey: route.ruleKey, reason: pinned ? `User pinned ${input.requestedModelId}` : route.reason,
    fallbackReason, costPerInputToken: RATES[modelId]?.[0] ?? 0, costPerOutputToken: RATES[modelId]?.[1] ?? 0 };
}

export async function callModel({ provider, modelId, systemPrompt = "", userMessage = "", maxTokens = 2048,
  costPerInputToken, costPerOutputToken }: { provider: string; modelId: string; systemPrompt?: string;
  userMessage?: string; maxTokens?: number; costPerInputToken?: number; costPerOutputToken?: number }) {
  const started = Date.now();
  try {
    let responseText = "";
    let inputTokens = 0;
    let outputTokens = 0;
    if (provider === "anthropic") {
      const { GoogleAuth } = await import("google-auth-library");
      const client = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] }).getClient();
      const token = await client.getAccessToken();
      const location = process.env.ANTHROPIC_VERTEX_LOCATION || "global";
      const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
      const endpoint = `https://${host}/v1/projects/${env.projectId}/locations/${location}/publishers/anthropic/models/${modelId}:rawPredict`;
      const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ anthropic_version: "vertex-2023-10-16", max_tokens: maxTokens, system: systemPrompt,
          messages: [{ role: "user", content: userMessage }] }) });
      if (!response.ok) throw new Error(`Claude request failed (${response.status}): ${(await response.text()).slice(0, 500)}`);
      const payload: any = await response.json();
      responseText = (payload.content || []).map((part: any) => part.text || "").join("");
      inputTokens = Number(payload.usage?.input_tokens || 0);
      outputTokens = Number(payload.usage?.output_tokens || 0);
    } else if (provider === "vertex") {
      const { VertexAI } = await import("@google-cloud/vertexai");
      const vertex = new VertexAI({ project: env.projectId, location: process.env.VERTEX_AI_LOCATION || "us-central1" });
      const response: any = await vertex.getGenerativeModel({ model: modelId }).generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }], generationConfig: { maxOutputTokens: maxTokens } });
      responseText = response.response?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || "";
      inputTokens = Number(response.response?.usageMetadata?.promptTokenCount || Math.ceil(`${systemPrompt}\n${userMessage}`.length / 4));
      outputTokens = Number(response.response?.usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4));
    } else throw new Error(`Unsupported model provider: ${provider}`);
    const rateIn = costPerInputToken || RATES[modelId]?.[0] || 0;
    const rateOut = costPerOutputToken || RATES[modelId]?.[1] || 0;
    const costUsd = inputTokens * rateIn + outputTokens * rateOut;
    return { status: "success", provider, modelId, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: costUsd, actualCostUsd: costUsd, latencyMs: Date.now() - started, responseText };
  } catch (error: any) {
    return { status: "error", errorCode: "MODEL_CALL_FAILED", errorMessage: String(error?.message || error), provider, modelId,
      inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, actualCostUsd: 0, latencyMs: Date.now() - started, responseText: "" };
  }
}
