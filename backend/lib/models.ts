import { getRoute } from "./routing";
export async function resolveModel(input: { planId?: string; taskType?: string; requestedModelId?: string }) {
  const route = await getRoute(input); return { provider: route.provider || "vertex", modelId: input.requestedModelId || route.modelId || "gemini-2.5-flash", maxTokens: route.maxTokensPerCall };
}
export async function callModel({ provider, modelId, systemPrompt, userMessage, maxTokens, costPerInputToken = 0, costPerOutputToken = 0 }: any) {
  const started = Date.now();
  if (provider !== "vertex") return { status: "error", errorCode: "PROVIDER_UNAVAILABLE", errorMessage: `Provider ${provider} is not configured in this deployment.`, provider, modelId, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, actualCostUsd: 0, latencyMs: Date.now() - started, responseText: "" };
  const { VertexAI } = await import("@google-cloud/vertexai");
  const vertex = new VertexAI({ project: process.env.GOOGLE_CLOUD_PROJECT || "aidirac-503309", location: process.env.VERTEX_AI_LOCATION || "us-central1" });
  try { const result: any = await vertex.getGenerativeModel({ model: modelId }).generateContent({ contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }], generationConfig: { maxOutputTokens: maxTokens } }); const text = result.response?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || ""; const inputTokens = Math.ceil(`${systemPrompt}\n${userMessage}`.length / 4); const outputTokens = Math.ceil(text.length / 4); return { status: "success", provider, modelId, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, estimatedCostUsd: inputTokens * costPerInputToken + outputTokens * costPerOutputToken, actualCostUsd: inputTokens * costPerInputToken + outputTokens * costPerOutputToken, latencyMs: Date.now() - started, responseText: text }; } catch (error: any) { return { status: "error", errorCode: "MODEL_CALL_FAILED", errorMessage: String(error?.message || error), provider, modelId, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, actualCostUsd: 0, latencyMs: Date.now() - started, responseText: "" }; }
}
