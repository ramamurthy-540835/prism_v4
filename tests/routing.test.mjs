import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../backend/lib/models.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
const route = { routingDecision: "allow", reason: "Matched Developer / code_generation", ruleKey: "starter:Developer",
  modelId: "claude-sonnet-4-6", provider: "anthropic", maxTokensPerCall: 2048 };
new Function("exports", "require", compiled)(exports, (name) => {
  if (name === "./routing") return { getRoute: async () => route };
  if (name === "./env") return { env: { projectId: "test-project" } };
  throw new Error(name);
});

test("Auto uses persona rule and records Claude fallback when access is disabled", async () => {
  const old = process.env.ANTHROPIC_VERTEX_ENABLED;
  delete process.env.ANTHROPIC_VERTEX_ENABLED;
  try {
    const result = await exports.resolveModel({ persona: "Developer", taskType: "code_generation" });
    assert.equal(result.modelId, "gemini-2.5-pro");
    assert.equal(result.ruleKey, "starter:Developer");
    assert.match(result.fallbackReason, /not enabled/);
    assert.equal(result.maxTokens, 2048);
  } finally { if (old === undefined) delete process.env.ANTHROPIC_VERTEX_ENABLED; else process.env.ANTHROPIC_VERTEX_ENABLED = old; }
});

test("A pinned Gemini model overrides the rule", async () => {
  const result = await exports.resolveModel({ persona: "Developer", taskType: "code_generation", requestedModelId: "gemini-2.5-flash" });
  assert.equal(result.modelId, "gemini-2.5-flash");
  assert.match(result.reason, /User pinned/);
});
