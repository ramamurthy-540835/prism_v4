export function estimateUsage({ userMessage = "", systemPrompt = "" }: { userMessage?: string; systemPrompt?: string }) {
  const inputTokens = Math.max(1, Math.ceil(`${systemPrompt}\n${userMessage}`.length / 4));
  return { inputTokens, outputTokensEstimate: Math.ceil(inputTokens * 0.5), totalTokensEstimate: Math.ceil(inputTokens * 1.5) };
}
