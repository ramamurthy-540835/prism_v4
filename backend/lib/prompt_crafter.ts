export function craftSystemPrompt({ useCase = "general", role = "assistant", theme = "" }: { useCase?: string; role?: string; theme?: string }) {
  return `You are PRISM's ${role}. Help with ${useCase}. ${theme ? `Theme: ${theme}.` : ""} Follow governance controls and state uncertainty clearly.`;
}
