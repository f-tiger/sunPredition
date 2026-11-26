import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { handleCheckoutGrowth, handleCheckoutGrowthAlarm } from "../src/checkout-growth.js";

const attempt = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, 22);
const other = "Y2hlY2tvdXQtZml4dHVyZQ";
const redirectAt = Date.parse("2026-11-26T23:58:00Z");
const later = Date.parse("2026-11-27T09:00:00Z");
const empty = { redirect: 0, start: 0, quote: 0, payment: 0 };

function fixture(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  let alarm = null;
  const state = { storage: {
    sql: { exec(query, ...bindings) {
      const stmt = db.prepare(query);
      if (query.startsWith("SELECT")) return { toArray: () => stmt.all(...bindings) };
      return { rowsWritten: stmt.run(...bindings).changes };
    } },
    async getAlarm() { return alarm; },
    async setAlarm(time) { alarm = time; },
  } };
  function request(path, method, now, record) {
    return handleCheckoutGrowth(new Request(`https://portfolio.internal/checkout-growth/${path}`, {
      method,
      ...(record === undefined ? {} : { body: JSON.stringify(record) }),
    }), state, now);
  }
  return {
    db,
    request,
    async record(record, now = redirectAt) {
      const response = await request("record", "POST", now, record);
      return { status: response.status, ...await response.json() };
    },
    async report(now = later) {
      const response = await request("report", "GET", now);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      return response.json();
    },
    getAlarm: () => alarm,
    async triggerAlarm(ms) {
      alarm = null;
      await handleCheckoutGrowthAlarm(state, ms);
    },
  };
}

test("report is read-only before data and contains closed UTC dates only", async (t) => {
  const f = fixture(t);
  assert.deepEqual(await f.report(), {
    ok: true,
    schema_version: 1,
    window: { start: "2026-10-30", end_exclusive: "2026-11-27", timezone: "UTC", complete_days: 28 },
    counts: { zh: empty, en: empty },
    rows: [],
  });
  assert.equal(f.db.prepare("SELECT name FROM sqlite_schema").all().length, 0);
  assert.equal(f.getAlarm(), null);
  assert.equal((await f.request("report?days=99", "GET", later)).status, 404);
  assert.equal((await f.request("report", "POST", later)).status, 405);
  assert.equal((await f.request("record", "GET", later)).status, 405);
});

test("strictly validates each action and refuses to create unsolicited downstream stages", async (t) => {
  const f = fixture(t);
  const invalid = [null, [], { action: "buy", attempt }, { action: "redirect", attempt },
    { action: "redirect", attempt, locale: "zh-CN" }, { action: "redirect", attempt: "too_short", locale: "en" },
    { action: "start", attempt, locale: "en" }, { action: "start", attempt, chat_id: 42 },
    { action: "redirect", attempt, locale: "en", day: "2026-11-25" },
    { action: "start", attempt, extra: "a".repeat(180) }];
  for (const message of invalid) {
    assert.deepEqual(await f.record(message), { status: 400, ok: false, error: "invalid_record" });
  }
  assert.deepEqual(await f.record({ action: "start", attempt }), { status: 404, ok: false, error: "unknown_attempt" });
  assert.equal(f.db.prepare("SELECT name FROM sqlite_schema").all().length, 0);
});

test("deduplicates stages and attributes delayed events to the immutable redirect day and locale", async (t) => {
  const f = fixture(t);
  assert.match(attempt, /^[A-Za-z0-9_-]{22}$/);
  assert.deepEqual(await f.record({ action: "redirect", attempt, locale: "en" }), { status: 200, ok: true, counted: true });
  assert.equal(f.getAlarm(), Date.parse("2026-12-25T00:00:00Z"));
  assert.deepEqual((await f.report(redirectAt)).rows, []);
  assert.deepEqual(await f.record({ action: "redirect", attempt, locale: "zh" }, later), { status: 200, ok: true, counted: false });
  assert.deepEqual(await f.record({ action: "payment", attempt }, later), { status: 409, ok: false, error: "stage_out_of_order" });
  const recorded = await Promise.all([f.record({ action: "start", attempt }, later), f.record({ action: "start", attempt }, later)]);
  assert.deepEqual(recorded.map(({ counted }) => counted).sort(), [false, true]);
  assert.equal((await f.record({ action: "quote", attempt }, later)).counted, true);
  assert.equal((await f.record({ action: "payment", attempt }, later)).counted, true);
  assert.equal((await f.record({ action: "payment", attempt }, later)).counted, false);
  assert.equal((await f.record({ action: "redirect", attempt: other, locale: "zh" })).counted, true);
  const oneOfEach = { redirect: 1, start: 1, quote: 1, payment: 1 };
  const report = await f.report();
  assert.deepEqual(report.counts, { zh: { ...empty, redirect: 1 }, en: oneOfEach });
  assert.deepEqual(report.rows, [
    { day: "2026-11-26", locale: "en", ...oneOfEach },
    { day: "2026-11-26", locale: "zh", ...empty, redirect: 1 },
  ]);
  const saved = f.db.prepare("SELECT * FROM checkout_growth_attempts").all();
  assert.deepEqual(Object.keys(saved[0]).sort(), ["attempt_hash", "day", "locale", "stage"]);
  assert.match(saved[0].attempt_hash, /^[a-f0-9]{64}$/);
  assert(!JSON.stringify(saved).includes(attempt));
  assert(!JSON.stringify(report).includes(saved[0].attempt_hash));
});

test("retains the last report day, expires old attempts, and disarms after the final expiry", async (t) => {
  const f = fixture(t);
  await f.record({ action: "redirect", attempt, locale: "zh" });
  await f.record({ action: "redirect", attempt: other, locale: "en" }, later);
  const expiry = Date.parse("2026-12-25T00:00:00Z");
  assert.equal((await f.report(expiry - 1)).rows.length, 2);
  assert.deepEqual((await f.report(expiry)).rows.map(({ day }) => day), ["2026-11-27"]);
  assert.equal((await f.record({ action: "start", attempt }, expiry)).status, 404);
  await f.triggerAlarm(expiry);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM checkout_growth_attempts").get().n, 1);
  assert.equal(f.getAlarm(), expiry + 86_400_000);
  await f.triggerAlarm(expiry + 86_400_000);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM checkout_growth_attempts").get().n, 0);
  assert.equal(f.getAlarm(), null);
});

test("discard removes a known QA attempt and its contribution without reporting the identifier", async (t) => {
  const f = fixture(t);
  const discard = { action: "discard", attempt };
  assert.deepEqual(await f.record(discard), { status: 200, ok: true, removed: false });
  await f.record({ action: "redirect", attempt, locale: "zh" });
  await f.record({ action: "start", attempt }, later);
  await f.record({ action: "quote", attempt }, later);
  assert.deepEqual((await f.report()).counts.zh, { redirect: 1, start: 1, quote: 1, payment: 0 });
  assert.deepEqual(await f.record(discard, later), { status: 200, ok: true, removed: true });
  assert.deepEqual(await f.record(discard, later), { status: 200, ok: true, removed: false });
  assert.deepEqual((await f.report()).counts.zh, empty);
  assert.equal((await f.record({ action: "quote", attempt }, later)).status, 404);
});
