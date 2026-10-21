import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const validatorSource = fs.readFileSync(new URL("../backend/lib/app-records.ts", import.meta.url), "utf8");
const validator = {};
new Function("exports", "require", ts.transpileModule(validatorSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(validator, () => {});
const routeSource = fs.readFileSync(new URL("../frontend/app/api/prism/apps/[app]/route.ts", import.meta.url), "utf8");
const route = {};
const writes = [];
let user = { id: "member", orgId: "org", role: "member" };
let selected = [];
new Function("exports", "require", ts.transpileModule(routeSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(route, (name) => {
  if (name === "next/server") return { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } };
  if (name === "crypto") return { randomUUID: () => "00000000-0000-0000-0000-000000000001" };
  if (name === "@backend/lib/auth") return { getSession: () => user };
  if (name === "@backend/lib/bootstrap") return { ensureSeeded: async () => {} };
  if (name === "@backend/lib/env") return { env: { projectId: "project", dataset: "dataset" } };
  if (name === "@backend/lib/bigquery") return { queryBigQuery: async (sql) => { if (sql.startsWith("INSERT") || sql.startsWith("UPDATE")) { writes.push(sql); return []; } return selected; } };
  if (name === "@backend/lib/app-records") return validator;
  throw new Error(name);
});
const request = (body) => ({ json: async () => body });

test("anonymous users cannot create application records", async () => {
  user = null; writes.length = 0;
  const response = await route.POST(request({ kind: "shipment", payload: {} }), { params: { app: "textile-exports" } });
  assert.equal(response.status, 401);
  assert.equal(writes.length, 0);
  user = { id: "member", orgId: "org", role: "member" };
});

test("members cannot approve their own auction listing", async () => {
  selected = [{ id: "00000000-0000-0000-0000-000000000001", owner_id: "member", kind: "listing", status: "review", payload_json: "{}" }];
  writes.length = 0;
  const response = await route.PATCH(request({ id: "00000000-0000-0000-0000-000000000001", status: "open" }), { params: { app: "property-auctions" } });
  assert.equal(response.status, 403);
  assert.equal(writes.length, 0);
});

test("simulated bid requires bidder verification", async () => {
  selected = [];
  writes.length = 0;
  const response = await route.POST(request({ kind: "bid", payload: { listingId: "listing-id", bidAmount: 1000 } }), { params: { app: "property-auctions" } });
  assert.equal(response.status, 409);
  assert.equal(writes.length, 0);
});
