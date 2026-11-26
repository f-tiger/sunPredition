const DAY_MS = 86_400_000;
const REPORT_DAYS = 28;
const LOCALES = ["zh", "en"];
const ACTIONS = ["redirect", "start", "quote", "payment"];
const DISCARD = -1;
const ATTEMPT_ID = /^[A-Za-z0-9_-]{22}$/;
const PATH = "/checkout-growth";

function dayAt(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function windowAt(now) {
  return {
    start: dayAt(now - REPORT_DAYS * DAY_MS),
    end_exclusive: dayAt(now),
    timezone: "UTC",
    complete_days: REPORT_DAYS,
  };
}

function reply(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error, status) {
  return reply({ ok: false, error }, status);
}

function hasAttemptsTable(sql) {
  return sql.exec("SELECT name FROM sqlite_schema WHERE name = 'checkout_growth_attempts' AND type = 'table'")
    .toArray().length > 0;
}

function initAttemptsTable(sql) {
  sql.exec(`CREATE TABLE IF NOT EXISTS checkout_growth_attempts (
    attempt_hash TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    locale TEXT NOT NULL CHECK (locale IN ('zh', 'en')),
    stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4)
  ) STRICT`);
  sql.exec("CREATE INDEX IF NOT EXISTS checkout_growth_day ON checkout_growth_attempts (day, locale)");
}

async function hashAttempt(attempt) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(attempt));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const { action, attempt, locale } = record;
  const stage = action === "discard" ? DISCARD : ACTIONS.indexOf(action) + 1;
  if (!stage || typeof attempt !== "string" || !ATTEMPT_ID.test(attempt)) return null;
  const redirect = action === "redirect";
  if (Object.keys(record).length !== (redirect ? 3 : 2)) return null;
  if (redirect ? !LOCALES.includes(locale) : Object.hasOwn(record, "locale")) return null;
  return { stage, attempt, locale };
}

function readReport(sql, window) {
  const counts = Object.fromEntries(LOCALES.map((locale) => [locale,
    Object.fromEntries(ACTIONS.map((action) => [action, 0])),
  ]));
  const rows = hasAttemptsTable(sql) ? sql.exec(`SELECT day, locale,
    COUNT(*) AS redirect,
    SUM(stage >= 2) AS start,
    SUM(stage >= 3) AS quote,
    SUM(stage >= 4) AS payment
    FROM checkout_growth_attempts WHERE day >= ? AND day < ?
    GROUP BY day, locale ORDER BY day, locale`, window.start, window.end_exclusive).toArray() : [];
  for (const { locale, ...row } of rows) {
    for (const action of ACTIONS) counts[locale][action] += row[action];
  }
  return reply({ ok: true, schema_version: 1, window, counts, rows });
}

function expiresOn(day) {
  return Date.parse(`${day}T00:00:00Z`) + (REPORT_DAYS + 1) * DAY_MS;
}

export async function handleCheckoutGrowthAlarm(state, now = Date.now()) {
  const { storage } = state;
  const { sql } = storage;
  if (!hasAttemptsTable(sql)) return;
  sql.exec("DELETE FROM checkout_growth_attempts WHERE day < ?", windowAt(now).start);
  const [oldest] = sql.exec("SELECT day FROM checkout_growth_attempts ORDER BY day LIMIT 1").toArray();
  if (oldest) await storage.setAlarm(expiresOn(oldest.day));
}

export async function handleCheckoutGrowth(request, state, now = Date.now()) {
  const url = new URL(request.url);
  if (url.search) return failure("unknown_path", 404);
  const window = windowAt(now);
  const { storage } = state;
  const { sql } = storage;
  if (url.pathname === `${PATH}/report`) {
    if (request.method !== "GET") return failure("method_not_allowed", 405);
    return readReport(sql, window);
  }
  if (url.pathname !== `${PATH}/record`) return failure("unknown_path", 404);
  if (request.method !== "POST") return failure("method_not_allowed", 405);
  const body = await request.text();
  if (body.length > 160) return failure("invalid_record", 400);
  let record;
  try { record = validateRecord(JSON.parse(body)); } catch { record = null; }
  if (!record) return failure("invalid_record", 400);

  const { stage, attempt, locale } = record;
  const id = await hashAttempt(attempt);
  const exists = hasAttemptsTable(sql);
  if (stage === DISCARD) {
    const removed = exists ? sql.exec("DELETE FROM checkout_growth_attempts WHERE attempt_hash = ?", id).rowsWritten : 0;
    return reply({ ok: true, removed: removed > 0 });
  }
  if (stage === 1) {
    if (!exists) initAttemptsTable(sql);
    const { rowsWritten } = sql.exec(`INSERT INTO checkout_growth_attempts (attempt_hash, day, locale, stage)
      VALUES (?, ?, ?, 1) ON CONFLICT (attempt_hash) DO NOTHING`, id, window.end_exclusive, locale);
    if (await storage.getAlarm() === null) {
      const [oldest] = sql.exec("SELECT day FROM checkout_growth_attempts ORDER BY day LIMIT 1").toArray();
      if (oldest) await storage.setAlarm(Math.max(now, expiresOn(oldest.day)));
    }
    return reply({ ok: true, counted: rowsWritten > 0 });
  }

  if (!exists) return failure("unknown_attempt", 404);
  const [previous] = sql.exec("SELECT stage FROM checkout_growth_attempts WHERE attempt_hash = ? AND day >= ?", id, window.start).toArray();
  if (!previous) return failure("unknown_attempt", 404);
  if (previous.stage >= stage) return reply({ ok: true, counted: false });
  if (previous.stage + 1 !== stage) return failure("stage_out_of_order", 409);
  sql.exec("UPDATE checkout_growth_attempts SET stage = ? WHERE attempt_hash = ?", stage, id);
  return reply({ ok: true, counted: true });
}
