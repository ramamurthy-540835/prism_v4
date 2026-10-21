import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../frontend/app/api/prism/projects/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const route = {};
const queries = [];
let editable = false;
new Function("exports", "require", compiled)(route, (name) => {
  if (name === "next/server") return { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } };
  if (name === "crypto") return { randomUUID: () => "generated-id" };
  if (name === "@backend/lib/auth") return { getSession: () => ({ id: "owner", orgId: "org", role: "member" }) };
  if (name === "@backend/lib/bootstrap") return { ensureSeeded: async () => {} };
  if (name === "@backend/lib/env") return { env: { projectId: "project", dataset: "data" } };
  if (name === "@backend/lib/bigquery") return { queryBigQuery: async (sql, params) => {
    queries.push({ sql, params });
    if (sql.startsWith("SELECT id FROM")) return editable ? [{ id: "target" }] : [];
    return [];
  } };
  throw new Error(name);
});

const request = (body) => ({ json: async () => body });

test("project details reject updates by nonowners", async () => {
  queries.length = 0;
  editable = false;
  const response = await route.PATCH(request({ projectId: "target", description: "brief", repositoryUrl: "" }));
  assert.equal(response.status, 403);
  assert.equal(queries.some(({ sql }) => sql.startsWith("UPDATE")), false);
});

test("project owners can save a verified repository URL", async () => {
  queries.length = 0;
  editable = true;
  const repositoryUrl = "https://github.com/example/repository";
  const response = await route.PATCH(request({ projectId: "target", description: "brief", repositoryUrl }));
  assert.equal(response.status, 200);
  assert.equal(queries.find(({ sql }) => sql.startsWith("UPDATE"))?.params.repositoryUrl, repositoryUrl);
});

test("project details reject unsafe repository URLs", async () => {
  queries.length = 0;
  const response = await route.PATCH(request({ projectId: "target", description: "brief", repositoryUrl: "javascript:alert(1)" }));
  assert.equal(response.status, 400);
  assert.equal(queries.length, 0);
});
