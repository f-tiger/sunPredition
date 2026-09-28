// Editorial outcome labels are not trade returns or independently verified forecasts.
export function ledgerAudit(entries) {
  const scored = entries.filter(f => ['hit', 'miss'].includes(f.verdict));
  const hits = scored.filter(f => f.verdict === 'hit').length;
  // Metadata coverage only: linked evidence still needs human verification.
  const documented = scored.filter(f => {
    const published = Date.parse(f.publishedAt), observed = Date.parse(f.outcomeObservedAt);
    return Number.isFinite(published) && Number.isFinite(observed) && published < observed &&
      /^https:\/\//.test(f.registrationEvidenceUrl || '') && typeof f.resolutionRule === 'string' && f.resolutionRule.trim();
  });
  return {
    kind: 'editorial-outcome-log',
    total: entries.length, scored: scored.length, hits,
    hitRate: scored.length ? Math.round(hits / scored.length * 1000) / 10 : null,
    pending: entries.filter(f => f.verdict === 'pending').length,
    other: entries.length - scored.length - entries.filter(f => f.verdict === 'pending').length,
    latestCallDate: entries.map(f => f.date).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort().at(-1) || null,
    registration: { documentedScored: documented.length, missingEvidence: scored.length - documented.length,
      independentlyVerified: false, criteria: 'Publication timestamp and HTTPS evidence link, resolution rule, and outcome observation timestamp after publication. Metadata coverage is not proof that the source was public then.' },
    returnEvidence: { auditedTrades: false, verifiedNetReturn: null },
  };
}

export function auditNotice(entries, en = false) {
  const a = ledgerAudit(entries);
  return `<aside class="card" role="note" data-ledger-audit="v1"><b>${en ? 'Evidence status · editorial log' : '证据状态 · 编辑复盘记录'}</b><p>${en
    ? `Of ${a.scored} hit/miss labels, ${a.registration.documentedScored} have the required publication and outcome provenance fields. The displayed rate describes editorial labels; it is not a trade win rate, audited profit, or a calibrated probability of future success. Pending and partial calls are excluded from the binary rate. Missing provenance is retained for audit.`
    : `${a.scored} 条命中/失误判定中，${a.registration.documentedScored} 条具备完整的公开时间、判定规则与结果时间证据字段。页面比率仅描述编辑判定，不是交易胜率、实盘利润或未来成功概率。待定与部分命中不纳入二元比率；缺证据的旧记录保留供复核。`}</p><a href="/api/track-record">${en ? 'Download the ledger and evidence status' : '下载记录与证据状态'}</a></aside>`;
}
