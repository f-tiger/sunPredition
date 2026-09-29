import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ledgerAudit, auditNotice } from '../src/ledger-audit.js';
import { FORECASTS } from '../src/data.js';
import worker from '../src/index.js';
import { renderTrackRecord, renderTrackRecordEN, renderLandingEN } from '../src/html.js';
test('pending, partial and unknown labels cannot change a binary hit rate', () => {
  const a = ledgerAudit([{ verdict: 'hit' }, { verdict: 'miss' }, { verdict: 'partial' }, { verdict: 'pending' }, { verdict: 'other' }]);
  assert.equal(a.scored, 2); assert.equal(a.hitRate, 50); assert.equal(a.pending, 1); assert.equal(a.other, 2);
  assert.equal(ledgerAudit([]).hitRate, null);
});
test('date alone is not provenance; post-outcome publication cannot qualify', () => {
  const e = { verdict: 'hit', date: '2026-07-05', publishedAt: '2026-07-05T12:00:00Z', outcomeObservedAt: '2026-07-02T12:00:00Z', registrationEvidenceUrl: 'https://example.com/record', resolutionRule: 'published threshold' };
  assert.equal(ledgerAudit([e]).registration.documentedScored, 0);
  assert.equal(ledgerAudit([{ ...e, outcomeObservedAt: '2026-07-06T12:00:00Z' }]).registration.documentedScored, 1);
  assert.equal(ledgerAudit([{ ...e, registrationEvidenceUrl: '' }]).registration.documentedScored, 0);
});
test('current historical entries remain visible without invented prospective proof', () => {
  const a = ledgerAudit(FORECASTS); assert.equal(a.registration.documentedScored, 0);
  assert.equal(a.returnEvidence.verifiedNetReturn, null);
  assert.match(auditNotice(FORECASTS), /不是交易胜率/);
  assert.match(auditNotice(FORECASTS, true), /not a trade win rate/);
});
test('both languages and machine endpoint expose evidence status', async () => {
  for (const html of [renderTrackRecord(FORECASTS, []), renderTrackRecordEN(FORECASTS), renderLandingEN(FORECASTS)]) assert.match(html, /data-ledger-audit/);
  const res = await worker.fetch(new Request('https://invest.agiscorecard.com/api/track-record'), {}, { waitUntil() {} });
  const data = await res.json(); assert.equal(data.audit.kind, 'editorial-outcome-log');
  assert.equal(data.entries.length, FORECASTS.length); assert.equal(data.audit.registration.documentedScored, 0);
});
