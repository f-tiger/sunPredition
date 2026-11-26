// Production smoke for the checkout-only release. Only read the report and the two QA landing pages.
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const origin = 'https://invest.agiscorecard.com';
const headers = { 'User-Agent': 'SunWatch-checkout-deploy-monitor' };

async function read(path, contentType) {
  const response = await fetch(origin + path, {
    headers, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  assert.equal(response.status, 200, `Expected HTTP 200 for ${path}`);
  assert.ok(response.headers.get('content-type')?.includes(contentType), `Wrong content type for ${path}`);
  return response;
}

async function verify() {
  // This new read-only route confirms the checkout release has reached the custom domain first.
  const report = await (await read('/api/checkout-growth', 'application/json')).json();
  assert.equal(report.ok, true);
  assert.equal(report.schema_version, 1);
  assert.equal(report.metric, 'checkout_redirect_cohorts');
  assert.equal(report.scope, 'health_only');
  assert.equal(typeof report.availability?.usdt, 'boolean');
  assert.equal(typeof report.availability?.payment_help, 'boolean');
  for (const field of ['counts', 'rows', 'totals']) {
    assert.ok(!Object.hasOwn(report, field), 'Public checkout health includes private cohort data');
  }
  assert.ok(!JSON.stringify(report).includes('wallet_address'), 'Public checkout health includes payment details');
  const { start, end_exclusive: end, timezone, complete_days: days } = report.window;
  assert.equal(timezone, 'UTC');
  assert.match(start, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(end, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(days, 28);
  assert.equal((Date.parse(end) - Date.parse(start)) / 86400000, days);
  assert.ok(end <= new Date().toISOString().slice(0, 10), 'Window includes an incomplete UTC day');

  for (const locale of ['en', 'zh']) {
    const path = locale === 'en' ? '/en?__ci=1' : '/?lang=zh&__ci=1';
    const html = await (await read(path, 'text/html')).text();
    assert.match(html, /\bid=["']pricing["']/i, `Missing ${locale} pricing anchor`);
    const hrefs = Array.from(html.matchAll(/<a\s[^>]*\bhref=["']([^"']+)["']/gi), match => match[1]);
    assert.ok(hrefs.includes(`/go/buy?lang=${locale}`), `Missing ${locale} checkout link`);
  }
  return report.availability;
}

for (let attempt = 1; ; attempt++) {
  try {
    const availability = await verify();
    console.log(JSON.stringify({check:'checkout_readonly',pricing_zh:true,pricing_en:true,availability}));
    break;
  } catch (error) {
    if (attempt >= 6) throw error;
    console.warn(`Checkout release check ${attempt} failed: ${error.message}`);
    await delay(5000);
  }
}
