require("dotenv").config({ path: ".env.local" });

async function main() {
  const payload = {
    userId: "test-user",
    userEmail: "test@mastechdigital.com",
    role: "admin",
    persona: "Architect",
    orgId: "test-org",
    planId: "plan-starter",
    sessionId: "test-session",
    taskType: "architect",
    promptId: "test-prompt",
    promptVersion: "v1",
    systemPrompt: "You are a governed PRISM assistant.",
    userMessage: "Design a Snowflake bronze-silver-gold ingestion strategy.",
    maxTokens: 512,
    workspacePath: "C:/Users/VRamamurthy/source/PRISM",
    environment: "local",
    sourceApp: "test-script"
  };

  const resp = await fetch("http://localhost:3000/api/router", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await resp.json();
  console.log("Status:", resp.status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});