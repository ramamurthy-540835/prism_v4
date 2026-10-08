import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";

const source = fs.readFileSync(new URL("../backend/lib/auth.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("exports", "require", compiled)(exports, createRequire(import.meta.url));

test("signed sessions reject tampering", () => {
  const old = process.env.PRISM_SESSION_SECRET;
  process.env.PRISM_SESSION_SECRET = "test-signing-secret";
  try {
    const user = { id: "one", email: "one@example.com", role: "admin", orgId: "naturelabs" };
    const token = exports.createSession(user);
    assert.deepEqual(exports.getSession(new Request("http://localhost", { headers: { cookie: `prism_session=${token}` } })), user);
    assert.equal(exports.getSession(new Request("http://localhost", { headers: { cookie: `prism_session=${token}x` } })), null);
  } finally { if (old === undefined) delete process.env.PRISM_SESSION_SECRET; else process.env.PRISM_SESSION_SECRET = old; }
});

test("test-user passwords are salted and reject wrong passwords", () => {
  const first = exports.hashPassword("temporary-secret");
  const second = exports.hashPassword("temporary-secret");
  assert.notEqual(first, second);
  assert.equal(exports.verifyPassword("temporary-secret", first), true);
  assert.equal(exports.verifyPassword("wrong-secret", first), false);
  assert.equal(exports.verifyPassword("temporary-secret", "invalid"), false);
});
