import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../backend/lib/iot.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const api = {};
new Function("exports", "require", compiled)(api, (name) => {
  if (name === "../../frontend/config/iot-signals") return { iotSignalUnits: { total_power_kw: "kW", separator_speed_pct: "%" } };
  throw new Error(name);
});

const now = Date.parse("2026-10-20T12:00:00Z");
const reading = { plantId: "plant_01", lineId: "line_2", observedAt: "2026-10-20T11:59:00Z", signals: { total_power_kw: 1850 } };

test("sensor ingestion preserves valid source readings", () => {
  assert.deepEqual(api.parseIotReading(reading, now), { ...reading, observedAt: "2026-10-20T11:59:00.000Z" });
});

test("sensor ingestion rejects unknown or nonnumeric signals", () => {
  assert.throws(() => api.parseIotReading({ ...reading, signals: { invented_metric: 2 } }, now), /Unknown signal/);
  assert.throws(() => api.parseIotReading({ ...reading, signals: { constructor: 2 } }, now), /Unknown signal/);
  assert.throws(() => api.parseIotReading({ ...reading, signals: { total_power_kw: "1850" } }, now), /finite number/);
  assert.throws(() => api.parseIotReading({ ...reading, signals: { separator_speed_pct: 120 } }, now), /between 0 and 100/);
});

test("sensor ingestion rejects stale and future source timestamps", () => {
  assert.throws(() => api.parseIotReading({ ...reading, observedAt: "2026-10-18T12:00:00Z" }, now), /Observed time/);
  assert.throws(() => api.parseIotReading({ ...reading, observedAt: "2026-10-20T12:06:00Z" }, now), /Observed time/);
});
