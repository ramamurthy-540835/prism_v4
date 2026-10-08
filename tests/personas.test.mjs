import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../frontend/config/personas.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", compiled)(exports);
const catalog = JSON.parse(fs.readFileSync(new URL("../knowledge/prompt_types/Prompts_Types.json", import.meta.url), "utf8"));

test("all 25 prompt types are mapped to a persona", () => {
  const mapped = new Set(Object.values(exports.PERSONAS).flatMap((persona) => persona.promptTypes));
  assert.equal(Object.keys(catalog).length, 25);
  for (let index = 1; index <= 25; index++) assert.ok(mapped.has(`PT${String(index).padStart(3, "0")}`));
});

test("each persona has at least three task types and a mapped primary prompt", () => {
  assert.equal(Object.keys(exports.PERSONAS).length, 7);
  for (const persona of Object.values(exports.PERSONAS)) {
    assert.ok(persona.tasks.length >= 3);
    assert.ok(persona.promptTypes.includes(persona.primaryPromptType));
  }
});
