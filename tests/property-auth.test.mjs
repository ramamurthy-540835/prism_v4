import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";

const source = fs.readFileSync(new URL("../frontend/app/api/prism/auth/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const route = {};
let seedCalls = 0;
new Function("exports", "require", compiled)(route, (name) => {
  if (name === "next/server") return { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200, cookies: { set: () => {} } }) } };
  if (name === "crypto") return createRequire(import.meta.url)("node:crypto");
  if (name === "@backend/lib/auth") return { createSession: () => "signed-session", getSession: () => null, sessionCookie: "prism_session", verifyPassword: () => false };
  if (name === "@backend/lib/bootstrap") return { ensureSeeded: async () => { seedCalls++; } };
  if (name === "@backend/lib/bigquery") return { queryBigQuery: async () => [] };
  if (name === "@backend/lib/env") return { env: { projectId: "project", dataset: "dataset" } };
  throw new Error(name);
});

test("configured property account signs in as a member without a BigQuery user", async () => {
  const oldEmail = process.env.PROPERTY_AUCTIONS_EMAIL;
  const oldPassword = process.env.PROPERTY_AUCTIONS_PASSWORD;
  process.env.PROPERTY_AUCTIONS_EMAIL = "property@example.com";
  process.env.PROPERTY_AUCTIONS_PASSWORD = "test-only-secret";
  seedCalls = 0;
  try {
    const response = await route.POST({ json: async () => ({ email: "PROPERTY@example.com", password: "test-only-secret" }) });
    assert.equal(response.status, 200);
    assert.equal(response.body.user.role, "member");
    assert.equal(response.body.user.orgId, "naturelabs");
    assert.equal(seedCalls, 0);
    const wrong = await route.POST({ json: async () => ({ email: "property@example.com", password: "wrong" }) });
    assert.equal(wrong.status, 401);
  } finally {
    if (oldEmail === undefined) delete process.env.PROPERTY_AUCTIONS_EMAIL; else process.env.PROPERTY_AUCTIONS_EMAIL = oldEmail;
    if (oldPassword === undefined) delete process.env.PROPERTY_AUCTIONS_PASSWORD; else process.env.PROPERTY_AUCTIONS_PASSWORD = oldPassword;
  }
});
