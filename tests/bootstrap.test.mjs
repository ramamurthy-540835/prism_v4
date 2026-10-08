import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../backend/lib/bootstrap.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
const queries = [];
const personas = { Developer: { tasks: ["code_generation"] }, Architect: { tasks: ["solution_document"] } };
new Function("exports", "require", compiled)(exports, (name) => {
  if (name === "./env") return { env: { projectId: "test-project", dataset: "prism", plansTable: "prism_plans", routingTable: "prism_model_routing" } };
  if (name === "./bigquery") return { queryBigQuery: async (sql) => { queries.push(sql); return []; } };
  if (name === "../../frontend/config/personas") return { PERSONAS: personas, PERSONA_NAMES: Object.keys(personas), taskTokenDefault: () => 2048 };
  throw new Error(name);
});

test("first boot creates required tables and seeds once", async () => {
  await exports.ensureSeeded();
  const firstCount = queries.length;
  await exports.ensureSeeded();
  assert.equal(queries.length, firstCount);
  assert.ok(queries.some((sql) => sql.includes("CREATE TABLE IF NOT EXISTS `test-project.prism.execution_logs`")));
  assert.ok(queries.some((sql) => sql.includes("CREATE TABLE IF NOT EXISTS `test-project.prism.approval_gates`")));
  assert.ok(queries.some((sql) => sql.includes("MERGE `test-project.prism.prism_model_routing`")));
  assert.ok(queries.some((sql) => sql.includes("planId IN ('community','student')")));
});
