import { auditNotice } from "./ledger-audit.js";
// 公开战绩页(服务端渲染,可分享,SEO 友好)
// 为每条 FORECASTS 生成稳定 id(date + 同日序号;判断只追加不重排 → id 稳定)。战绩内容矩阵化的地基。
export function forecastSlugs(forecasts) {
  const seen = {};
  return forecasts.map((f) => {
    const n = (seen[f.date] = (seen[f.date] || 0) + 1);
    return { id: `${f.date}-${n}`, f };
  });
}

export function renderTrackRecord(forecasts, predictions) {
  const scored = forecasts.filter((f) => ["hit", "miss"].includes(f.verdict));
  const hits = scored.filter((f) => f.verdict === "hit").length;
  const V = { hit: "✅ 命中", miss: "❌ 失误", partial: "🟡 部分", pending: "⏳ 验证中" };
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rows = forecastSlugs(forecasts).map(({ id, f }) =>
    `<div class="card"><b>${f.date}</b> · <b>${V[f.verdict] || f.verdict}</b><div style="margin-top:4px">${esc(f.call)}</div><div class="meta" style="margin-top:3px">结果:${esc(f.outcome)}</div><div class="meta" style="margin-top:5px"><a href="/forecast/${id}">查看该判断复盘 →</a></div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch Pro 公开战绩 · 命中率实录</title>
<meta name="description" content="SunWatch Pro 的每一次市场判断公开建档:命中与失误同等展示。当前可评分 ${scored.length} 条,命中 ${hits} 条。">
<meta property="og:title" content="SunWatch Pro 公开战绩:${scored.length} 条判断,命中 ${hits} 条">
<meta property="og:description" content="包括 2026-07 存储板块见顶判定、SKHY 上市派发窗口等。命中与失误同等公开。">
<link rel="canonical" href="https://invest.agiscorecard.com/track-record">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/track-record">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/track-record">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/track-record">
<style>:root{--bg:#f6f7f9;--card:#fff;--ink:#1a202c;--muted:#64748b;--line:#e2e8f0;--accent:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#0f141a;--card:#171e26;--ink:#e6edf3;--muted:#8b98a5;--line:#2a3441;--accent:#60a5fa}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,"PingFang SC",system-ui,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:24px 16px 64px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:10px}
.meta{color:var(--muted);font-size:12.5px}a{color:var(--accent)}h1{font-size:24px}</style></head><body><div class="wrap">
<h1>📊 SunWatch Pro 公开战绩</h1>
<p>每一次明确判断公开建档,命中与失误同等展示(失误附教训)。当前:可评分 <b>${scored.length}</b> 条,命中 <b>${hits}</b> 条${scored.length ? `,命中率 <b>${Math.round((hits / scored.length) * 100)}%</b>` : ""}。</p>
${auditNotice(forecasts)}
${rows}
<p><a href="/">← 返回 SunWatch Pro 主站</a> · <a href="/go/tg" rel="nofollow">🤖 免费订阅每日信号预告</a></p>
<p class="meta">另设孙宇晨预判档案(2019-2026,同一建档标准)见主站。本页内容为研究记录,非投资建议。</p>
</div></body></html>`;
}

const PAGE_CSS = `:root{--bg:#f6f7f9;--card:#fff;--ink:#1a202c;--muted:#64748b;--line:#e2e8f0;--accent:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#0f141a;--card:#171e26;--ink:#e6edf3;--muted:#8b98a5;--line:#2a3441;--accent:#60a5fa}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,"PingFang SC",system-ui,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:24px 16px 64px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:10px}
.meta{color:var(--muted);font-size:12.5px}a{color:var(--accent)}h1{font-size:23px}.tag{display:inline-block;font-size:11px;padding:0 7px;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}`;
const escS = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const CTA = `<div class="card"><b>获取具体买卖价位与实时触发报警</b><div class="meta" style="margin-top:4px">免费:向 <a href="/go/tg" rel="nofollow">@sunwatchBot</a> 发 /start 订阅每日信号预告 · <a href="/track-record">查看公开战绩</a> · <a href="/#pricing">升级 Pro</a></div><div class="meta" style="margin-top:6px">📮 或邮件订阅:<b>判断结案、信心变动、触发器响起——当天一封邮件,其余时候不写</b> → <a href="https://agiscorecard.beehiiv.com/subscribe?utm_source=sunwatch&utm_medium=page_cta" target="_blank" rel="noopener">免费订阅</a></div></div>`;
const CTA_EN = `<div class="card"><b>Get specific entry/exit levels & real-time trigger alerts</b><div class="meta" style="margin-top:4px">Free: send /start to <a href="/go/tg" rel="nofollow">@sunwatchBot</a> for daily signal previews · <a href="/en/track-record">public track record</a> · <a href="/#pricing">upgrade to Pro</a></div><div class="meta" style="margin-top:6px">📮 Or by email: <b>one email when a call is graded, confidence moves, or a trigger fires — and not otherwise</b> → <a href="https://agiscorecard.beehiiv.com/subscribe?utm_source=sunwatch&utm_medium=page_cta_en" target="_blank" rel="noopener">subscribe free</a></div></div>`;

// pSEO:单只标的页
export function renderStockPage(s, quote, related, news) {
  const title = `${s.name}(${s.ticker})${s.theme}赛道分析·买卖触发线`;
  const q = quote ? `<div class="card"><b>实时行情</b><div style="font-size:22px;font-weight:700">${quote.price.toLocaleString()} <span style="font-size:14px;color:${quote.changePct >= 0 ? "#16803c" : "#b42318"}">${quote.changePct > 0 ? "+" : ""}${quote.changePct}%</span></div><div class="meta">${(quote.at || "").replace("T", " ").slice(0, 16)} UTC · Yahoo Finance</div></div>` : "";
  const f = s.fund || {};
  const rows = [["投资逻辑", s.logic], ["市值/规模", f.mcap], ["稀缺性/护城河", f.moat], ["竞争对手", f.comp], ["风险", s.risk]]
    .filter(([, v]) => v && v !== "—")
    .map(([k, v]) => `<div style="margin-top:6px"><b style="color:var(--muted);font-size:13px">${k}</b><div>${escS(v)}</div></div>`).join("");
  const rel = (related || []).map((r) => `<a href="/stock/${slugify(r.ticker)}">${escS(r.name)}</a>`).join(" · ");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)} | SunWatch Pro</title>
<meta name="description" content="${escS(s.name + " " + s.ticker + " " + s.theme + "赛道:" + (s.logic || "").slice(0, 80))}">
<meta property="og:title" content="${escS(title)}"><meta property="og:description" content="${escS((s.logic || "").slice(0, 100))}">
<link rel="canonical" href="https://invest.agiscorecard.com/stock/${slugify(s.ticker)}">
${s.en ? `<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/stock/${slugify(s.ticker)}">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}">` : ""}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:title,author:{"@type":"Organization",name:"SunWatch Pro"},about:s.name})}</script>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"SunWatch Pro",item:"https://invest.agiscorecard.com/"},{"@type":"ListItem",position:2,name:s.market},{"@type":"ListItem",position:3,name:s.name}]})}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › ${escS(s.market)} › ${escS(s.theme)}${s.en ? ` · <a href="/en/stock/${slugify(s.ticker)}">English</a>` : ""}</p>
<h1>${escS(s.name)} <span class="tag">${escS(s.ticker)}</span> <span class="tag">${escS(s.market)}</span></h1>
${q}<div class="card">${rows}</div>
${(news && news.length) ? `<div class="card"><b>最新动态</b><ul style="margin:6px 0 0 18px;padding:0">${news.map((n) => `<li style="margin:3px 0"><a href="${escS(n.link)}" rel="nofollow">${escS(n.title)}</a>${n.published ? ` <span class="meta">${n.published.slice(0, 10)}</span>` : ""}</li>`).join("")}</ul></div>` : ""}${CTA}
${rel ? `<p class="meta">同赛道标的:${rel}</p>` : ""}
<p class="meta">本页为研究框架,非投资建议;具体买入区间/止损线/仓位方案为 Pro 内容。</p>
</div></body></html>`;
}

// pSEO(EN):单只标的页。E4 欧美面引擎——只为带 `en` 字段的标的生成,
// 没有忠实英译就不出页(宁可少一页,不出机翻腔或半中半英的页面)。
export function renderStockPageEN(s, quote, related, news) {
  const e = s.en;
  // 显示名优先用 en.name:港股/A股标的的 name 是中文,直接渲染会把中文漏进英文页
  // (SKHY「SK海力士 ADR」就这样漏过一次)。没有 en.name 的按原名(本就是英文)。
  const nm = e.name || s.name;
  const title = `${nm} (${s.ticker}) — cycle position & pre-registered trigger levels`;
  const q = quote ? `<div class="card"><b>Live quote</b><div style="font-size:22px;font-weight:700">${quote.price.toLocaleString()} <span style="font-size:14px;color:${quote.changePct >= 0 ? "#16803c" : "#b42318"}">${quote.changePct > 0 ? "+" : ""}${quote.changePct}%</span></div><div class="meta">${(quote.at || "").replace("T", " ").slice(0, 16)} UTC · Yahoo Finance${quote.fromLowPct != null ? ` · +${quote.fromLowPct}% off the 52-week low` : ""}${quote.offHighPct != null ? ` · ${quote.offHighPct}% off the high` : ""}</div></div>` : "";
  const rows = [["Investment case", e.logic], ["Size / market cap", e.mcap], ["Scarcity / moat", e.moat], ["Competition", e.comp], ["Risk", e.risk]]
    .filter(([, v]) => v && v !== "—")
    .map(([k, v]) => `<div style="margin-top:6px"><b style="color:var(--muted);font-size:13px">${k}</b><div>${escS(v)}</div></div>`).join("");
  // 同样走 en.name:related 里若有中文名标的(如 SKHY「SK海力士 ADR」),
  // 用 r.name 会把中文漏进英文页——冒烟 2026-08-11 抓到的正是这 3 个字。
  const rel = (related || []).filter((r) => r.en).map((r) => `<a href="/en/stock/${slugify(r.ticker)}">${escS(r.en.name || r.name)}</a>`).join(" · ");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)} | SunWatch</title>
<meta name="description" content="${escS(nm + " (" + s.ticker + "): " + (e.logic || "").slice(0, 110))}">
<meta property="og:title" content="${escS(title)}"><meta property="og:description" content="${escS((e.logic || "").slice(0, 120))}">
<link rel="canonical" href="https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/stock/${slugify(s.ticker)}">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:title,author:{"@type":"Organization",name:"SunWatch"},about:nm})}</script>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"AGI Scorecard",item:"https://agiscorecard.com/"},{"@type":"ListItem",position:2,name:"SunWatch",item:"https://invest.agiscorecard.com/en"},{"@type":"ListItem",position:3,name:"Stock coverage",item:"https://invest.agiscorecard.com/en/stocks"},{"@type":"ListItem",position:4,name:nm}]})}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> › <a href="/en">SunWatch</a> › <a href="/en/stocks">Coverage</a> › ${escS(s.ticker)} · <a href="/stock/${slugify(s.ticker)}">中文</a></p>
<h1>${escS(nm)} <span class="tag">${escS(s.ticker)}</span></h1>
${q}<div class="card">${rows}</div>
${(news && news.length) ? `<div class="card"><b>Latest coverage</b><ul style="margin:6px 0 0 18px;padding:0">${news.map((n) => `<li style="margin:3px 0"><a href="${escS(n.link)}" rel="nofollow">${escS(n.title)}</a>${n.published ? ` <span class="meta">${n.published.slice(0, 10)}</span>` : ""}</li>`).join("")}</ul></div>` : ""}
<div class="card"><b>How this name is traded here</b><div class="meta" style="margin-top:4px">Entry zones, stop lines and sizing are <b>documented as research rules</b>; alerts fire when price crosses them — see the <a href="/en/method">eight-layer method</a> and the <a href="/en/red-team">red-team desk</a> where every open call carries survival odds. Past calls, hits and misses alike: <a href="/en/track-record">public track record</a>.</div></div>
${CTA_EN}
${rel ? `<p class="meta">Same theme: ${rel}</p>` : ""}
<p class="meta">Research framework, not investment advice. Specific levels, stops and sizing are Pro content.</p>
</div></body></html>`;
}

export function slugify(t) {
  return String(t).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
}

// pSEO:赛道长文页
export function renderTrackPage(track, playbooks, stocks) {
  const title = `${track.name}赛道周期定位与三市场标的(2026)`;
  const pb = playbooks.map((p) => `<div class="card"><b>${escS(p.theme)}</b> <span class="tag">${escS(p.stageNote)}</span><ul style="margin:8px 0 0 18px;padding:0">${p.basis.map((b) => `<li style="margin:3px 0">${escS(b)}</li>`).join("")}</ul></div>`).join("");
  const st = stocks.map((s) => `<a href="/stock/${slugify(s.ticker)}">${escS(s.name)}(${escS(s.ticker)})</a>`).join(" · ");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)} | SunWatch Pro</title>
<meta name="description" content="${escS(track.name)}赛道深度分析:周期阶段判定与依据、A股/港股/美股标的映射。">
<meta property="og:title" content="${escS(title)}">
<link rel="canonical" href="https://invest.agiscorecard.com/track/${track.id}">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:title,author:{"@type":"Organization",name:"SunWatch Pro"}})}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › 赛道</p><h1>${escS(title)}</h1>
${pb}<div class="card"><b>本赛道标的</b><div style="margin-top:6px">${st || "—"}</div></div>${CTA}
<p class="meta">研究框架,非投资建议;操盘纪律与触发线为 Pro 内容。</p>
</div></body></html>`;
}

// 每日复盘页(内容飞轮:每天一篇可收录文章,含 JSON-LD Article)
export function renderDailyPage(snap) {
  const title = `AI 赛道每日复盘 ${snap.date}:周期定位与市场异动`;
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, datePublished: snap.date, author: { "@type": "Organization", name: "SunWatch Pro" }, publisher: { "@type": "Organization", name: "SunWatch Pro" } });
  const stages = snap.stages.map((s) => `<div class="card"><b>${escS(s.theme)}</b> <span class="tag">${escS(s.stage)}</span><div class="meta" style="margin-top:3px">${escS(s.note)}</div></div>`).join("");
  const movers = (snap.movers || []).map((m) => `<li>${escS(m.name)} ${m.pct > 0 ? "+" : ""}${m.pct}%</li>`).join("");
  const heads = (snap.headlines || []).map((h) => `<li><a href="${escS(h.link)}" rel="nofollow">${escS(h.title)}</a></li>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)} | SunWatch Pro</title>
<meta name="description" content="${snap.date} 存储/物理AI/能源/加密赛道周期定位复盘与当日市场异动。">
<meta property="og:title" content="${escS(title)}">
<link rel="canonical" href="https://invest.agiscorecard.com/daily/${snap.date}">
<script type="application/ld+json">${ld}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › <a href="/daily">每日复盘</a> › ${snap.date}</p>
<h1>${escS(title)}</h1>
<h2 style="font-size:17px">赛道周期定位</h2>${stages}
${movers ? `<h2 style="font-size:17px">当日异动</h2><div class="card"><ul style="margin:0 0 0 18px;padding:0">${movers}</ul></div>` : ""}
${heads ? `<h2 style="font-size:17px">当日要闻</h2><div class="card"><ul style="margin:0 0 0 18px;padding:0">${heads}</ul></div>` : ""}
${CTA}<p class="meta">研究记录,非投资建议;具体买卖价位与触发线为 Pro 内容。</p>
</div></body></html>`;
}

export function renderDailyIndex(dates) {
  const items = dates.map((d) => `<div class="card"><a href="/daily/${d}"><b>${d}</b> AI 赛道每日复盘</a></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI 赛道每日复盘归档 | SunWatch Pro</title>
<meta name="description" content="存储/物理AI/能源/加密赛道每日周期定位复盘归档,每天自动更新。">
<link rel="canonical" href="https://invest.agiscorecard.com/daily"><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › 每日复盘</p><h1>📅 每日复盘归档</h1>
${items || '<div class="card meta">首篇复盘将于明日北京时间 08:30 自动生成。</div>'}${CTA}
</div></body></html>`;
}


// 单条判断复盘页(战绩内容矩阵化:每条 FORECASTS 一篇可收录文章,含 Article + BreadcrumbList)
export function renderForecastPage(f, id, related) {
  const V = { hit: "✅ 命中", miss: "❌ 失误", partial: "🟡 部分", pending: "⏳ 验证中" };
  const verdict = V[f.verdict] || f.verdict;
  const short = String(f.call || "").slice(0, 28);
  const title = `复盘 ${f.date}:${short}${f.call && f.call.length > 28 ? "…" : ""} — ${verdict.replace(/[✅❌🟡⏳]\s*/, "")}`;
  const desc = `SunWatch Pro 判断建档(${f.date}):${String(f.call || "").slice(0, 60)}。结果:${String(f.outcome || "").slice(0, 70)}。命中与失误同等公开。`;
  const url = `https://invest.agiscorecard.com/forecast/${id}`;
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title, datePublished: f.date, author: { "@type": "Organization", name: "SunWatch Pro" }, publisher: { "@type": "Organization", name: "SunWatch Pro" }, mainEntityOfPage: url });
  const bc = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "SunWatch Pro", item: "https://invest.agiscorecard.com/" }, { "@type": "ListItem", position: 2, name: "公开战绩", item: "https://invest.agiscorecard.com/track-record" }, { "@type": "ListItem", position: 3, name: f.date }] });
  const relCards = (related || []).map(({ id: rid, f: rf }) => `<div class="card"><a href="/forecast/${rid}"><b>${rf.date}</b> · ${V[rf.verdict] || rf.verdict}</a><div class="meta" style="margin-top:3px">${escS(String(rf.call || "").slice(0, 40))}…</div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)} | SunWatch Pro</title>
<meta name="description" content="${escS(desc)}">
<meta property="og:title" content="${escS(title)}"><meta property="og:description" content="${escS(desc)}">
<link rel="canonical" href="${url}">
<script type="application/ld+json">${ld}</script>
<script type="application/ld+json">${bc}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › <a href="/track-record">公开战绩</a> › ${f.date}</p>
<h1>${escS(title)}</h1>
<div class="card"><b>判断(${f.date})</b><div style="margin-top:4px">${escS(f.call)}</div></div>
<div class="card"><b>依据</b><div style="margin-top:4px">${escS(f.basis)}</div></div>
<div class="card"><b>结果 · ${verdict}</b><div style="margin-top:4px">${escS(f.outcome)}</div>${f.verdictNote ? `<div class="meta" style="margin-top:4px">${escS(f.verdictNote)}</div>` : ""}</div>
${relCards ? `<h2 style="font-size:17px">其他判断</h2>${relCards}` : ""}
${CTA}<p class="meta">研究记录,命中与失误同等展示;具体买卖价位与触发线为 Pro 内容。非投资建议。</p>
</div></body></html>`;
}

// 战绩复盘索引页(把 N 条判断聚合为一个可收录入口)
export function renderForecastIndex(items) {
  const V = { hit: "✅ 命中", miss: "❌ 失误", partial: "🟡 部分", pending: "⏳ 验证中" };
  const scored = items.filter(({ f }) => ["hit", "miss"].includes(f.verdict));
  const hits = scored.filter(({ f }) => f.verdict === "hit").length;
  const cards = items.map(({ id, f }) => `<div class="card"><a href="/forecast/${id}"><b>${f.date}</b> · ${V[f.verdict] || f.verdict}</a><div style="margin-top:4px">${escS(String(f.call || "").slice(0, 50))}${f.call && f.call.length > 50 ? "…" : ""}</div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>判断复盘归档 · 每条建档单独成页 | SunWatch Pro</title>
<meta name="description" content="SunWatch Pro 每一次市场判断的独立复盘页归档:可评分 ${scored.length} 条,命中 ${hits} 条。命中与失误同等公开。">
<link rel="canonical" href="https://invest.agiscorecard.com/forecast"><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › <a href="/track-record">公开战绩</a> › 复盘归档</p>
<h1>🗂️ 判断复盘归档</h1>
<p>每一次明确判断单独成页,命中与失误同等展示。当前可评分 <b>${scored.length}</b> 条,命中 <b>${hits}</b> 条${scored.length ? `,命中率 <b>${Math.round((hits / scored.length) * 100)}%</b>` : ""}。</p>
${cards}${CTA}
</div></body></html>`;
}

// 英文战绩摘要(忠实于已建档中文判断,人工审校;键=forecastSlugs 的 id)。缺失则英文页仅显示日期+徽章,绝不显示中文。
export const FORECAST_EN = {
  "2026-07-05-1": "Storage sector in the late stage of its peak zone: risk outweighs opportunity — distribute.",
  "2026-07-05-2": "IPO-week base case (40%): peers spike before listing, distribute into the spike. Missed — the crash had already happened; I cited stale June-peak data and mis-weighted the scenario.",
  "2026-07-05-3": "Cold-reception scenario (25%): pricing discount widens, break-issue (below IPO price) risk rises.",
  "2026-07-05-4": "The 2x-leveraged 7709 suits only short event windows — never hold it long; choppy tape means negative-compounding double drag.",
  "2026-07-06-1": "Weekly check: 0 of 3 liquidation triggers fired; hold the core, de-risk around the event this week.",
  "2026-07-07-1": "Q3 base case (55%): bottoming in the -20% to -35% band; if Micron's late-September earnings don't cut HBM guidance, a recovery rally follows.",
  "2026-07-13-1": "Weekly-check aside: 'trend is up this week, lower-high not confirmed.' Missed — SNDK fell 12.6% that same day and the downtrend was confirmed by 7/17. Lesson: in a discipline week, execute the plan, don't editorialize on direction.",
  "2026-07-20-1": "Storage downtrend confirmed: lower-lows in place (SNDK $1,354 / MU $849); SKHY break-issue below $149 raised to the base case.",
  "2026-07-20-2": "Weekly check #3: 0 of 3 liquidation triggers; hold the 1/3 core unchanged; buy-back clause suspended — a -37.8% drawdown is a trend break, not a healthy dip.",
  "2026-08-07-1": "Sector-wide scan: spatial computing / AI glasses is the second open window (one notch weaker than robotics); low-altitude economy a half-window; solid-state batteries only via second-tier equipment names; seven other tracks closed.",
  "2026-08-07-2": "Project-10x stock ranking: tier 1 = Wuzhou Xinchun (screws+bearings, lowest PS, un-named) and Keli Sensing (six-axis force); tier 2 = Moons' (Unitree's sole coreless-motor supplier) and Orbbec; equipment layer (grinders = 46% of a screw line's capex) added outside the pool.",
  "2026-08-07-3": "Space theme topped in May–June: SPCX (history's largest IPO, $1.75T) broke issue and sits ~45% off highs — same structure as SKHY at the memory top. Chasing here = paying up in the consensus phase. Falsified if SPCX reclaims $135 weekly AND makes new highs.",
  "2026-08-07-4": "Robotics is the only track in early-mid cycle; any 10x structure lives in low-cap bottleneck-component pure plays, not humanoid leaders. Unitree lists ~Aug 19: no chasing for the first month, by rule.",
  "2026-08-08-1": "Optical-transceiver top forming in Jul–Aug 2026: all six top-zone checklist items lit (record volume, retail slogans, sold-out narrative, Innolight's mega HK IPO — the same pattern that marked the memory and space tops). No 10x from here; optics' real window is its own next cycle bottom.",
  "2026-08-08-2": "Memory's next 10x window projected for late 2027: pre-registered shopping list (SNDK / MU / SKHY) executes only when three triggers fire — contract prices turning negative, capacity-cut announcements, PS≈1x with price stabilization. Leveraged ETFs banned.",
};

// 英文着陆页 /en(英文获客入口:孙宇晨预判监控 + 跨市场执行;可验证命中率)
// Western-audience landing. Conventions deliberately different from the zh dashboard:
// value proposition before brand, stats as a band, MMM D YYYY dates, prominent risk
// disclosure (US readers expect it), and a visible bridge to the AGI Scorecard network.
const fmtEN = (iso) => {
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = String(iso).split("-").map(Number);
  return m ? `${M[m - 1]} ${d}, ${y}` : iso;
};
export function renderLandingEN(forecasts) {
  const scored = forecasts.filter((f) => ["hit", "miss"].includes(f.verdict));
  const hits = scored.filter((f) => f.verdict === "hit").length;
  const rate = scored.length ? Math.round((hits / scored.length) * 100) : 0;
  const latest = forecasts[0] ? fmtEN(forecasts[0].date) : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch — AI-cycle investing, on the record | AGI Scorecard Invest</title>
<meta name="description" content="Public research log: ${scored.length} editorial hit/miss labels. Prospective evidence coverage is disclosed on the page. Hits and misses side by side. Not investment advice.">
<meta property="og:title" content="SunWatch — research calls and evidence status">
<meta property="og:description" content="Triggers, not predictions. Public track record across US, HK and China A-shares. Part of the AGI Scorecard network.">
<link rel="canonical" href="https://invest.agiscorecard.com/en">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/en"><style>${PAGE_CSS}
.band{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
.band .card{flex:1 1 140px;text-align:center;margin:0}
.band b{display:block;font-size:26px}
.band span{font-size:12px;color:var(--muted)}
.btnp{display:inline-block;background:var(--accent);color:#fff;padding:10px 20px;border-radius:9px;font-weight:600;text-decoration:none}
.hero{margin:8px 0 4px;font-size:27px;line-height:1.25}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> › Invest · <a href="/?lang=zh">中文</a> · <b>English</b></p>
<h1 class="hero">Market calls you can audit.<br>Triggers, not vibes.</h1>
<p>SunWatch turns judgments about the AI cycle — memory, robotics, space, energy, crypto — into <b>falsifiable price triggers</b> across US, Hong Kong and China A-share markets. A machine watches the lines 24/7. Calls and outcomes are retained together; publication-before-outcome evidence is assessed separately below.</p>
<div class="band">
<div class="card"><b>${scored.length}</b><span>scored calls</span></div>
<div class="card"><b>${rate}%</b><span>editorial hit-label rate</span></div>
<div class="card"><b>${forecasts.length - scored.length}</b><span>open &amp; pending</span></div>
<div class="card"><b>${latest}</b><span>latest call</span></div>
</div>
${auditNotice(forecasts, true)}
<p><a class="btnp" href="/en/track-record">See the full track record →</a></p>
<p class="meta" style="margin-top:-6px"><a href="/en/stocks">Browse stock coverage in English →</a> · <a href="/en/method">the eight-layer method</a> · <a href="/en/red-team">red-team desk</a></p>
<h2 style="font-size:18px">How it works</h2>
<div class="card"><b>1 · Record the research claim.</b><div class="meta" style="margin-top:3px">Keep the original claim, publication evidence, resolution rule and observation date. A date printed on a page alone does not prove preregistration.</div></div>
<div class="card"><b>2 · Watched by machine.</b><div class="meta" style="margin-top:3px">Quotes refresh every 30 minutes across three markets; crossing a trigger line fires an alert instantly.</div></div>
<div class="card"><b>3 · Misses stay public.</b><div class="meta" style="margin-top:3px">Wrong calls are graded ❌ and keep their post-mortem. The record is the product — if it were curated, it would be worthless.</div></div>
<h2 style="font-size:18px">What's inside</h2>
<div class="card"><a href="/en/stocks">Per-ticker coverage in English</a> · cycle-stage maps for five AI sectors · the <a href="/en/method">Project-10x method — eight layers of discipline</a> (barbell allocation, fractional Kelly sizing, pre-registered exits) · the <a href="/en/red-team">red-team desk</a> with survival odds on every open call · specific entry/exit levels and stop lines (Pro) · real-time Telegram alerts.</div>
<div class="card"><b>From the AGI Scorecard network</b><div class="meta" style="margin-top:3px">Score your own AI basket against the eight graded AGI-2027 predictions — free, no sign-up: <a href="https://agiscorecard.com/ai-stock-exposure">AI Stock Exposure Check →</a></div></div>
${CTA_EN}
<div class="card"><b>Pricing</b><div class="meta" style="margin-top:3px">Free tier: daily signal previews via Telegram. Pro: ¥199/mo (≈$28, USDT accepted) unlocks specific levels, stop lines and instant trigger alerts. No account, no card on file — pay, get a code, done.</div></div>
<h2 style="font-size:18px">FAQ</h2>
<div class="card"><b>Is this investment advice?</b><div class="meta" style="margin-top:3px">No. It is a research framework with a public score. Nothing here is a recommendation to buy or sell any security; consult a licensed professional before acting.</div></div>
<div class="card"><b>What does the displayed rate measure?</b><div class="meta" style="margin-top:3px">It summarizes editorial hit/miss labels, not trading profits. Check the evidence status and original record; unresolved and partial calls are excluded.</div></div>
<div class="card"><b>What is AGI Scorecard?</b><div class="meta" style="margin-top:3px">An independent site grading the "AGI by 2027" predictions with pre-registered flip conditions — the evidence layer this console trades against. <a href="https://agiscorecard.com">agiscorecard.com →</a></div></div>
<p class="meta" style="margin-top:18px"><b>Risk disclosure:</b> research and education only; not investment, legal or tax advice. Markets involve risk of loss. Past performance of any logged call does not guarantee future results. Prices verified against dated sources; errors are corrected in the open log.</p>
</div></body></html>`;
}

// 英文战绩页 /en/track-record(编辑命中比率 + 每条判断日期/徽章/忠实英文摘要)
// 英文标的索引 /en/stocks
// Why this page exists: the per-ticker English pages shipped before anything linked to
// them, so they were reachable only from the sitemap, from the Chinese page's "English"
// link, and from each other. An English reader arriving at /en had no way in. The page
// also states plainly which names are Chinese-only, rather than quietly showing a
// shorter list than the Chinese side and letting the reader assume that is all there is.
export function renderStockIndexEN(stocks) {
  const withEn = stocks.filter((s) => s.en);
  const themes = [];
  for (const s of withEn) if (!themes.includes(s.theme)) themes.push(s.theme);
  const THEME_EN = { "\u76f4\u63a5\u8f7d\u4f53": "Direct vehicle", "\u5b58\u50a8": "Memory", "\u7269\u7406AI": "Physical AI",
    "\u592a\u7a7a": "Space", "\u80fd\u6e90": "Energy", "\u7a33\u5b9a\u5e01": "Stablecoins",
    "\u52a0\u5bc6Beta": "Crypto beta", "\u5e01\u5e93\u80a1": "Coin-treasury equities",
    "\u7279\u6717\u666e\u6982\u5ff5": "Trump-adjacent" };
  const groups = themes.map((t) => {
    const rows = withEn.filter((s) => s.theme === t).map((s) => {
      const nm = s.en.name || s.name;
      return `<div style="margin-top:8px"><a href="/en/stock/${slugify(s.ticker)}"><b>${escS(nm)}</b></a> <span class="tag">${escS(s.ticker)}</span><div class="meta" style="margin-top:2px">${escS(s.en.logic || "")}</div></div>`;
    }).join("");
    return `<div class="card"><b>${escS(THEME_EN[t] || t)}</b>${rows}</div>`;
  }).join("");
  // An English page must never print a Chinese ticker string. Anything without an
  // ASCII-safe label is dropped from the list AND from the count, so the number shown
  // always equals the number of links shown (2026-08-13: 宇树(待上市) was caught by the
  // render lint doing exactly this).
  const ascii = (s) => { const l = s.enLabel || s.ticker; return /^[\x20-\x7E]+$/.test(l) ? l : null; };
  const zhOnly = stocks.filter((s) => !s.en && ascii(s));
  const byMarket = {};
  for (const s of zhOnly) (byMarket[s.market] = byMarket[s.market] || []).push(s);
  const MKT = { "\u6e2f\u80a1": "Hong Kong", "A\u80a1": "China A-shares", "\u7f8e\u80a1": "US" };
  const zhList = Object.keys(byMarket).map((m) => `<div style="margin-top:6px"><b style="font-size:13px;color:var(--muted)">${escS(MKT[m] || m)} (${byMarket[m].length})</b><div class="meta">${byMarket[m].map((s) => `<a href="/stock/${slugify(s.ticker)}">${escS(ascii(s))}</a>`).join(" \u00b7 ")}</div></div>`).join("");
  const title = `AI-cycle stock coverage \u2014 ${withEn.length} names in English | SunWatch`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escS(title)}</title>
<meta name="description" content="Every US-listed name SunWatch tracks across memory, physical AI, space, energy and crypto \u2014 ${withEn.length} English pages with the investment case, the risk and the competition. Not investment advice.">
<meta property="og:title" content="${escS(title)}">
<link rel="canonical" href="https://invest.agiscorecard.com/en/stocks">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/stocks">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/en/stocks">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: title, isPartOf: { "@type": "WebSite", name: "SunWatch", url: "https://invest.agiscorecard.com/en" }, hasPart: withEn.map((s) => ({ "@type": "Article", headline: `${s.en.name || s.name} (${s.ticker})`, url: `https://invest.agiscorecard.com/en/stock/${slugify(s.ticker)}` })) })}</script>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "AGI Scorecard", item: "https://agiscorecard.com/" }, { "@type": "ListItem", position: 2, name: "SunWatch", item: "https://invest.agiscorecard.com/en" }, { "@type": "ListItem", position: 3, name: "Stock coverage" }] })}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> \u203a <a href="/en">SunWatch</a> \u203a Coverage</p>
<h1>Stock coverage, in English</h1>
<p>${withEn.length} names, grouped by the part of the AI cycle they belong to. Each page carries the investment case, the size, what actually protects the business, who it competes with, and the risk that would end the thesis \u2014 plus the live quote. Entry zones, stop lines and sizing are documented research rules and are <a href="/#pricing">Pro</a> content; the <a href="/en/track-record">public record</a> shows how the calls turned out, losers included.</p>
${groups}
${zhList ? `<div class="card"><b>Chinese-only for now (${zhOnly.length})</b><div class="meta" style="margin-top:3px">These are tracked on the Chinese side and have no English page yet. The links work, the pages are in Chinese \u2014 said plainly rather than showing a shorter list without explanation.</div>${zhList}</div>` : ""}
<div class="card"><b>From the AGI Scorecard network</b><div class="meta" style="margin-top:3px">Score a basket of these tickers against the eight graded AGI-2027 predictions \u2014 free, no sign-up: <a href="https://agiscorecard.com/ai-stock-exposure">AI Stock Exposure Check \u2192</a></div></div>
${CTA_EN}
<p class="meta">Research framework, not investment advice. Markets involve risk of loss.</p>
</div></body></html>`;
}

export function renderTrackRecordEN(forecasts) {
  const V = { hit: "✅ Hit", miss: "❌ Miss", partial: "🟡 Partial", pending: "⏳ Pending" };
  const scored = forecasts.filter((f) => ["hit", "miss"].includes(f.verdict));
  const hits = scored.filter((f) => f.verdict === "hit").length;
  const rate = scored.length ? Math.round((hits / scored.length) * 100) : 0;
  const rows = forecastSlugs(forecasts).map(({ id, f }) => {
    const en = FORECAST_EN[id];
    return `<div class="card"><b>${fmtEN(f.date)}</b> · <b>${V[f.verdict] || f.verdict}</b>${en ? `<div style="margin-top:4px">${escS(en)}</div>` : ""}</div>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch Pro — public track record (hits & misses)</title>
<meta name="description" content="Every SunWatch Pro market call logged in the open: ${scored.length} scored, ${hits} hits (${rate}%). Hits and misses shown side by side.">
<meta property="og:title" content="SunWatch Pro public track record: ${scored.length} calls, ${hits} hits">
<link rel="canonical" href="https://invest.agiscorecard.com/en/track-record">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/track-record">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/track-record">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/track-record"><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> › <a href="/en">Invest</a> › Track record · <a href="/track-record">中文</a> · <b>English</b></p>
<h1>📊 Public track record</h1>
<p>Every explicit judgment is logged in the open, hits and misses shown side by side (misses carry the lesson). Currently <b>${scored.length}</b> scored, <b>${hits}</b> hits${scored.length ? `, hit rate <b>${rate}%</b>` : ""}.</p>
${auditNotice(forecasts, true)}
${rows}
${CTA_EN}
<p class="meta">Research record, not investment advice. Full rationale and price levels are in the Chinese archive and Pro content.</p>
</div></body></html>`;
}

// FAQ 页(FAQPage schema 富结果)
export function renderFaq() {
  const QA = [
    ["什么是触发线?", "预先设定的价格条件,如『跌破 X 则减仓』『回落到 Y 区间则分批买入』。系统每 30 分钟核对实时行情,价格穿越触发线时通过 Telegram 即时报警——把判断变成可执行的纪律,而不是预测。"],
    ["信号多久更新一次?", "行情与触发线每 30 分钟自动核对;每日两次简报(北京 08:30 / 20:30);重要事件(如财报、上市、政策)实时推送。"],
    ["如何订阅?", "免费版:向 Telegram 机器人 @sunwatchBot 发送 /start,每晚收到信号预告。Pro:在定价区点「立即购买」,或直接向机器人发送 /buy——机器人当场给出 USDT(BEP20)收款地址与金额,付完把交易哈希发回,站长上链核对后发激活码(也可改走微信/支付宝);拿到码后在网站底部输入解锁全部价位,并向机器人发送 /start 激活码 绑定实时信号。"],
    ["激活码规则是什么?", "一个激活码只能绑定一个 Telegram 账号(防转卖);网页端激活后浏览器本地记住,换设备重新输入即可。"],
    ["数据来源是什么?", "行情来自 Yahoo Finance;新闻来自 Google News、Bing News、Cointelegraph 等公开信源;关键事实经多源交叉核验并标注日期。"],
    ["这和荐股有什么区别?", "本站不承诺收益、不代客理财,提供的是研究框架与触发线纪律工具;所有判断公开建档(含失误),命中率可在公开战绩页查证。所有内容不构成投资建议。"],
    ["预测不准怎么办?", "每一次判断都写入公开档案,命中与失误同等展示,失误附教训。系统的核心不是预测涨跌,而是『若价格到 X 则做 Y』的预设执行,准确性可被持续审计。"],
    ["会退款吗?", "虚拟信号服务开通后不支持退款;可先用免费版评估质量再决定升级。"],
  ];
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: QA.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  const body = QA.map(([q, a]) => `<div class="card"><b>${escS(q)}</b><div style="margin-top:4px">${escS(a)}</div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>常见问题 FAQ | SunWatch Pro</title>
<meta name="description" content="SunWatch Pro 常见问题:触发线是什么、信号频率、订阅方式、激活码规则、数据来源、与荐股的区别。">
<link rel="canonical" href="https://invest.agiscorecard.com/faq">
<script type="application/ld+json">${ld}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › FAQ</p><h1>❓ 常见问题</h1>
${body}${CTA}
</div></body></html>`;
}

// 方法论页:业界方法 → 本系统机制的逐条映射。每一层给出处、给落地、给可核对的页面。
// 这页存在的意义:让"可审计"从战绩台账扩展到方法本身——规则先于行情写死,执行才谈得上纪律。
const METHOD_LAYERS = [
  ["第 0 层 · 目标与基础比率", "出处:Mauboussin 基础比率思维 / Kahneman 外部视角",
   "1-2 年 10 倍的基础比率极低,历史上反复做到的只有一种结构:周期底部买入的高纯度弹性标的(本系统亲证样本:闪迪约 50 倍)。所以系统猎的是<b>周期窗口</b>,不是股票代码。诚实前提写在最前面:能 10 倍的结构同样能 -70%(样本:7709 十倍后单段 -37.8%;SA 基金 439% 后单月 -67%)。"],
  ["第 1 层 · 资本结构:杠铃", "出处:Taleb《反脆弱》杠铃策略",
   "压舱石 ≥80%(NVDA/CEG 型现金流资产,不参与十倍狩猎)+ 卫星池 ≤20%。单个卫星标的按<b>归零可承受</b>定尺寸:归零损失 ≤3% 总资产。压舱石的作用不是收益,是让卫星池 -50% 的日子里还能执行纪律。"],
  ["第 2 层 · 买什么:五要素 + 期望投资", "出处:Mauboussin《期望投资》/ 本系统闪迪复盘",
   "闪迪五要素:纯度 × 稀缺 × 低市值 × 周期起点 × 经营杠杆,五项齐才是十倍结构。叠加期望投资的第一问:<b>现价已经计入了什么?</b>——52 周位置读数(距低/距高)是本系统的粗测仪表,距低 +600% 的『机会』先默认是已定价的故事。低共识优先:被券商点名的那天,纯度溢价已被收走。"],
  ["第 3 层 · 何时买:周期时钟 + 触发-执行", "出处:Howard Marks《周期》/ 本系统顶区六项清单",
   "顶区六项清单(龙头数倍后再创新高 / 天量成交 / 散户口号成型 / sold-out 叙事 / <b>天量 IPO</b> / 二线补涨)已三次验证:SKHY→存储顶、SPCX→太空顶、中际港股 IPO→光通信顶。反着用即底区清单:合约价环比转负 → 减产/资本开支下修公告 → PS≈1x 且价格周线企稳。全部写成<b>预登记触发器</b>:响了照单执行,没响不动手——预测是娱乐,触发是纪律。"],
  ["第 4 层 · 仓位:分数凯利", "出处:Kelly 公式(≤1/4 分数执行)/ Thorp 实践",
   "满仓凯利在估错概率时毁灭账户,所以只用 ≤1/4 凯利,并简化为可执行档位:高确信 = 卫星池的 1/3,中确信 = 1/5,低确信 = 只入观察位拿读数不动钱。买点纪律:恐慌日(-5%+)分 3 批、批间 ≥10% 回调或 ≥4 周;涨停日与禁买窗(如宇树挂牌周)不买。<b>永不向下摊平亏损仓</b>(Druckenmiller / 利弗莫尔共同的那条命):加仓只加给已证明自己的仓位。"],
  ["第 5 层 · 何时卖:预登记派发", "出处:利弗莫尔派发纪律 / 本系统 SKHY 上市周实操",
   "卖出规则在买入前写死:事件顶(天量 IPO / 挂牌周)机械分批派发至底仓,把筹码卖给刚转多的人;证伪线到 = 当日执行,不讲故事、不等更好价位。分析师集体转多与目标价上调,在本系统里登记为<b>派发对手盘信号</b>而非确认信号。"],
  ["第 6 层 · 熔断与复盘", "出处:Tetlock《超预测》预登记 + 校准",
   "卫星池整体回撤 30% → 熔断:停止一切新买入,全面复盘框架本身(而不是补仓摊平)。每条判断入公开台账,带日期、原文、证伪条件与复查日;命中与失误同等展示,失误附教训。两套计划冲突时(如 7 月买区 vs 8 月共识判定),<b>以新框架为准并把冲突本身建档</b>——被悄悄覆盖的规则等于没有规则。"],
  ["第 7 层 · 对抗审查(红队)", "出处:Kahneman 对抗性合作 / CIA 结构化分析(Heuer ACH)/ Klein 事前验尸 / 桥水异议文化 / 芒格反演",
   "重大判断入台账前必须先活过<b>多轮多空对抗</b>:多头全力证伪空头论点,空头全力证伪多头论点,裁判给出幸存概率——低于 50% 的判断不入档或降级为观察。在档判断遇重大反证(如证伪线被逼近)当日复审并公开下调信心。<b>系统级绊线</b>防相关性错误:多个顶部判断共享同一宏观前提时,任两个被证伪即整体停用该模式并复盘框架,而不是逐条零敲碎打地认错。台账胜率只能来自诚实结案——删失误等于烧掉全部资产。"],
];

export function renderMethod() {
  const cards = METHOD_LAYERS.map(([t, src, body]) =>
    `<div class="card"><b>${t}</b><div class="meta" style="margin-top:2px">${src}</div><div style="margin-top:6px">${body}</div></div>`).join("");
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: "十倍工程方法论 v2.1:八层纪律", author: { "@type": "Organization", name: "SunWatch Pro" }, dateModified: "2026-08-08" });
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>十倍工程方法论 v2.1:八层纪律 | SunWatch Pro</title>
<meta name="description" content="杠铃资本结构、闪迪五要素、周期时钟、分数凯利仓位、预登记派发、回撤熔断——业界方法论逐条落到可审计的触发-执行系统。">
<meta property="og:title" content="十倍工程方法论 v2.1:八层纪律">
<meta property="og:description" content="规则先于行情写死,执行才谈得上纪律。每一层给出处、给落地、给可核对的页面。">
<link rel="canonical" href="https://invest.agiscorecard.com/method">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/method">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/method">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/method">
<script type="application/ld+json">${ld}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › 方法论 · <a href="/en/method">English</a></p>
<h1>🧭 十倍工程方法论 v2.1:八层纪律</h1>
<p>业界最好的投资方法不是秘密——杠铃、五要素、周期时钟、分数凯利、预登记、熔断,书里都有。稀缺的是<b>把它们写死成规则并接受公开审计</b>。本页每一层:出处 → 本系统的落地 → 可核对的页面(<a href="/track-record">战绩台账</a> / <a href="/forecast">判断复盘</a> / 各标的页的 52 周读数)。</p>
${cards}
<div class="card"><b>方法论如何被审计</b><div style="margin-top:4px">逐条保留判断和结果，并单独核对事前公开证据(<a href="/track-record">记录与证据状态</a>);触发线由机器每 30 分钟盯守;证伪条件与复查日和判断一起预登记。方法论若改版,旧版规则与冲突判定留档——这页本身也在台账里。</div></div>
${CTA}
<p class="meta">研究框架,非投资建议。具体买卖价位、止损线与仓位方案为 Pro 内容。</p>
</div></body></html>`;
}

export function renderMethodEN() {
  const L = [
    ["Layer 0 · Goal & base rates", "Source: Mauboussin's base-rate thinking / Kahneman's outside view",
     "The base rate of a 10x in 1–2 years is tiny. The only structure that has done it repeatedly is a high-purity, high-leverage name bought at a cycle bottom (our own audited sample: SanDisk, ~50x). So the system hunts <b>cycle windows</b>, not tickers. The honest premise comes first: any structure that can 10x can also drop 70%."],
    ["Layer 1 · Capital structure: the barbell", "Source: Taleb, Antifragile",
     "Ballast ≥80% (cash-flow compounders like NVDA/CEG — never used for 10x hunting) + a satellite pool ≤20%. Each satellite is sized so that a total wipe-out costs ≤3% of assets. The ballast exists so the rules can still be followed on the days the satellites are down 50%."],
    ["Layer 2 · What to buy: five factors + expectations", "Source: Mauboussin, Expectations Investing / our SanDisk post-mortem",
     "Purity × scarcity × small cap × cycle-bottom start × operating leverage — all five, or it is not a 10x structure. Then the expectations question: <b>what is already priced in?</b> Our 52-week positioning readout is the crude gauge; anything +600% off its low is presumed already-priced until proven otherwise. Low consensus first: the day sell-side names a stock, the purity premium is gone."],
    ["Layer 3 · When to buy: cycle clock + triggers", "Source: Howard Marks, Mastering the Market Cycle",
     "Our six-item top-zone checklist (leader making new highs after a multi-bagger run / record volume / retail slogans / sold-out narrative / <b>mega-IPO</b> / second-tier catch-up rally) has verified three times: SKHY→memory top, SPCX→space top, Innolight's HK IPO→optics top. Inverted, it is the bottom checklist: contract prices turning negative → capacity-cut announcements → PS≈1x with weekly price stabilization. Everything is a <b>pre-registered trigger</b>: it fires, you execute; it doesn't, you sit."],
    ["Layer 4 · Position sizing: fractional Kelly", "Source: Kelly criterion at ≤1/4 fraction / Thorp's practice",
     "Full Kelly destroys accounts when probabilities are misjudged, so ≤1/4 Kelly, simplified into executable notches: high conviction = 1/3 of the satellite pool, medium = 1/5, low = watchlist only. Buys happen on panic days (−5%+), in 3 batches, ≥10% pullback or ≥4 weeks apart; never on limit-up days or inside pre-declared no-buy windows. <b>Never average down a loser</b> (Druckenmiller's and Livermore's shared rule): add only to positions that have proven themselves."],
    ["Layer 5 · When to sell: pre-registered distribution", "Source: Livermore's distribution discipline / our SKHY IPO-week execution",
     "Exit rules are written before entry: at event tops (mega-IPO, listing week) distribute mechanically down to a core stub — sell to the people who just turned bullish. Sell-side upgrades during a run are logged as <b>distribution counterparty signals</b>, not confirmation."],
    ["Layer 6 · Circuit breaker & review", "Source: Tetlock, Superforecasting — pre-registration and calibration",
     "Satellite pool down 30% → circuit breaker: all new buying stops and the framework itself gets reviewed (not averaged into). Every call enters the public ledger with date, original wording, falsification condition and review date; misses stay published with their lesson. When two plans conflict, the newer framework wins and the conflict itself is logged — a silently overridden rule is no rule."],
    ["Layer 7 · Adversarial review (red team)", "Source: Kahneman's adversarial collaboration / CIA structured analytic techniques (Heuer's ACH) / Klein's pre-mortem / Bridgewater's dissent culture / Munger's inversion",
     "Before a major call enters the ledger it must survive <b>multiple bull-vs-bear rounds</b>: each side attacks the other's thesis at full strength, and a referee assigns survival odds — anything under 50% is rejected or downgraded to watch-only. Open calls get re-reviewed the day material counter-evidence appears (e.g. price approaching a falsification line), with confidence cuts published. A <b>system-level tripwire</b> guards against correlated error: when several top calls share one macro premise, any two falsifications suspend the whole pattern for framework review instead of piecemeal apologies. The ledger's hit rate can only come from honest grading — deleting misses burns the entire asset."],
  ];
  const cards = L.map(([t, src, body]) =>
    `<div class="card"><b>${t}</b><div class="meta" style="margin-top:2px">${src}</div><div style="margin-top:6px">${body}</div></div>`).join("");
  const ld = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: "The Project-10x Method: eight layers of discipline", author: { "@type": "Organization", name: "SunWatch Pro" }, dateModified: "2026-08-08" });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Project-10x Method: eight layers of discipline | SunWatch</title>
<meta name="description" content="Barbell allocation, five-factor screens, cycle clocks, fractional Kelly sizing, pre-registered exits and a drawdown circuit breaker — classic methodology wired into an auditable trigger system.">
<meta property="og:title" content="The Project-10x Method: eight layers of discipline">
<meta property="og:description" content="The methods are public — Taleb, Marks, Mauboussin, Kelly, Tetlock. What's scarce is writing them down as rules and accepting a public audit.">
<link rel="canonical" href="https://invest.agiscorecard.com/en/method">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/method">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/method">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/method">
<script type="application/ld+json">${ld}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> › <a href="/en">Invest</a> › Method · <a href="/method">中文</a> · <b>English</b></p>
<h1>🧭 The Project-10x Method: eight layers of discipline</h1>
<p>The best investing methodology is not a secret — the barbell, cycle clocks, expectations analysis, fractional Kelly, pre-registration are all in books. What is scarce is <b>writing them down as binding rules and accepting a public audit</b>. Each layer below: the source → how this system operationalizes it → where to verify (<a href="/en/track-record">track record</a>, per-stock 52-week readouts).</p>
${cards}
<div class="card"><b>How the method itself is audited</b><div style="margin-top:4px">Calls and outcomes are retained, with publication evidence reported separately (<a href="/en/track-record">evidence status</a>); trigger lines are machine-watched every 30 minutes; falsification conditions and review dates are registered together with the call. When the method is revised, the old rules and the conflict ruling stay on file — this page is part of the ledger too.</div></div>
${CTA_EN}
<p class="meta">Research framework, not investment advice. Specific levels, stops and sizing are Pro content.</p>
</div></body></html>`;
}

// 对抗审查台:方法论第 7 层的公开产品面——每条在档判断的幸存概率、最强反方攻击、
// 证伪条件。这是订阅钩子所在:「信心变动/触发器响/结案——当天一封邮件」。
// 幸存概率只来自建档的对抗复核(CORE_SIGNALS 2026-08-08),这里只渲染不新编。
const oddsBar = (odds) =>
  `<div style="display:flex;align-items:center;gap:10px;margin:6px 0 2px"><div style="flex:1;height:8px;background:color-mix(in srgb,var(--muted) 18%,transparent);border-radius:99px;overflow:hidden"><div style="width:${odds}%;height:100%;background:${odds >= 60 ? "#16803c" : odds >= 50 ? "#b7791f" : "#b42318"}"></div></div><b style="font-size:15px">${odds}%</b></div>`;

export function renderRedTeam(forecasts) {
  const items = forecastSlugs(forecasts).filter(({ f }) => f.verdict === "pending" && f.odds != null);
  const cards = items.map(({ id, f }) =>
    `<div class="card"><b>${f.date}</b> · <span class="tag">幸存概率</span>${oddsBar(f.odds)}
<div style="margin-top:6px">${escS(f.call.split(":")[0])}</div>
<div class="meta" style="margin-top:6px"><b>⚔️ 最强反方:</b>${escS(f.attack)}</div>
<div class="meta" style="margin-top:5px"><b>🧾 证伪条件与验证窗口:</b>${escS((f.outcome || "").slice(0, 200))}${(f.outcome || "").length > 200 ? "…" : ""} <a href="/forecast/${id}">全文 →</a></div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>对抗审查台:每条在档判断的幸存概率 | SunWatch Pro</title>
<meta name="description" content="方法论第 7 层的公开产品面:每条在档判断先经多轮多空对抗,幸存概率、最强反方攻击、证伪条件全部公开。信心变动当天邮件通知。">
<meta property="og:title" content="对抗审查台:我们先攻击自己的判断,再让你订阅结果">
<link rel="canonical" href="https://invest.agiscorecard.com/red-team">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/red-team">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/red-team">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/red-team">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:"对抗审查台:每条在档判断的幸存概率",author:{"@type":"Organization",name:"SunWatch Pro"},dateModified:"2026-08-08"})}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="/">SunWatch Pro</a> › 对抗审查 · <a href="/en/red-team">English</a></p>
<h1>🛡 对抗审查台</h1>
<p>每条重大判断入台账前,先经<b>多轮多空对抗</b>(<a href="/method">方法论第 7 层</a>):多头全力证伪空头,空头全力证伪多头,裁判给幸存概率——低于 50% 不入档。在档判断遇重大反证<b>当日复审并公开下调信心</b>(例:太空顶部 60%→52%,2026-08-08)。下面是当前全部在档判断的攻防现场。</p>
<div class="card" style="border-left:3px solid var(--accent)"><b>📮 订阅对抗结果,而不是订阅观点</b><div class="meta" style="margin-top:4px">信心上调或下调、证伪线被触发、判断结案——<b>当天一封邮件,其余时候不写</b>。这是可以被检验的承诺:每封邮件对应台账里一次真实变动。</div><div style="margin-top:8px"><a href="https://agiscorecard.beehiiv.com/subscribe?utm_source=sunwatch&utm_medium=red_team" target="_blank" rel="noopener" style="display:inline-block;background:var(--accent);color:#fff;padding:9px 18px;border-radius:8px;font-weight:600">免费订阅 →</a> <a href="/#pricing" style="margin-left:10px">要具体价位与实时报警?Pro →</a></div></div>
${cards}
<div class="card"><b>🚨 系统级绊线(防相关性错误)</b><div class="meta" style="margin-top:4px">存储/太空/光通信三个顶部判断共享同一前提「AI capex 是周期而非结构」。任两个被证伪,顶区清单整体停用并复盘框架——不逐条零敲碎打认错。</div></div>
<p class="meta">幸存概率是编辑性评估,非市场赔率;n 小,校准分随样本公开。研究框架,非投资建议。</p>
${CTA}
</div></body></html>`;
}

export function renderRedTeamEN(forecasts) {
  const items = forecastSlugs(forecasts).filter(({ f }) => f.verdict === "pending" && f.odds != null);
  const cards = items.map(({ id, f }) =>
    `<div class="card"><b>${fmtEN(f.date)}</b> · <span class="tag">survival odds</span>${oddsBar(f.odds)}
<div style="margin-top:6px">${escS(FORECAST_EN[id] || f.call.split(":")[0])}</div>
<div class="meta" style="margin-top:6px"><b>⚔️ Strongest counter-case:</b> ${escS(f.attackEn || "see the Chinese ledger for the full bull-vs-bear round")} <a href="/forecast/${id}">details →</a></div></div>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Red-team desk: survival odds for every open call | SunWatch</title>
<meta name="description" content="Every open market call survives multiple bull-vs-bear rounds before entering the ledger. Survival odds, strongest counter-case and falsification lines — all public. One email when confidence moves.">
<meta property="og:title" content="We attack our own calls first. Subscribe to the results.">
<link rel="canonical" href="https://invest.agiscorecard.com/en/red-team">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en/red-team">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/red-team">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/red-team">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:"Red-team desk: survival odds for every open call",author:{"@type":"Organization",name:"SunWatch Pro"},dateModified:"2026-08-08"})}</script><style>${PAGE_CSS}</style></head><body><div class="wrap">
<p class="meta"><a href="https://agiscorecard.com">AGI Scorecard</a> › <a href="/en">Invest</a> › Red team · <a href="/red-team">中文</a> · <b>English</b></p>
<h1>🛡 Red-team desk</h1>
<p>Before a call enters the public ledger it survives <b>multiple bull-vs-bear rounds</b> (<a href="/en/method">Layer 7 of the method</a>): each side attacks at full strength, a referee assigns survival odds, and anything under 50% is rejected. When material counter-evidence lands, confidence cuts are published the same day (e.g. the space-top call, 60% → 52% on Aug 8, 2026). Below: the live attack-and-defense state of every open call.</p>
<div class="card" style="border-left:3px solid var(--accent)"><b>📮 Subscribe to the outcomes, not the opinions</b><div class="meta" style="margin-top:4px">One email when confidence moves, a falsification line is hit, or a call is graded — <b>and not otherwise</b>. A checkable promise: every email maps to a real ledger change.</div><div style="margin-top:8px"><a href="https://agiscorecard.beehiiv.com/subscribe?utm_source=sunwatch&utm_medium=red_team_en" target="_blank" rel="noopener" style="display:inline-block;background:var(--accent);color:#fff;padding:9px 18px;border-radius:8px;font-weight:600">Subscribe free →</a> <a href="/#pricing" style="margin-left:10px">Need levels &amp; real-time alerts? Pro →</a></div></div>
${cards}
<div class="card"><b>🚨 System-level tripwire</b><div class="meta" style="margin-top:4px">The memory, space and optics top calls share one macro premise — "AI capex is a cycle, not a new structure". Any two falsifications suspend the whole top-zone pattern for framework review.</div></div>
<p class="meta">Survival odds are editorial estimates, not market odds; sample is small and calibration will be published as it grows. Research framework, not investment advice.</p>
${CTA_EN}
</div></body></html>`;
}

// 仪表盘:单文件 HTML,数据由 /api/feed 与 /api/archive 提供
export function renderDashboard() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch Pro · AI 热点赛道投资罗盘</title>
<meta name="description" content="存储/物理AI/能源/加密五大赛道深度分析,A股·港股·美股三市场推荐,实时触发线与 Telegram 信号。公开预测战绩,命中失误同等展示。">
<meta property="og:title" content="SunWatch Pro · AI 热点赛道投资罗盘">
<meta property="og:description" content="五大AI赛道深度分析 × 三市场推荐 × 实时触发线信号。免费查看赛道分析与公开战绩。">
<meta property="og:type" content="website">
<meta property="og:url" content="https://invest.agiscorecard.com/">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="https://invest.agiscorecard.com/">
<link rel="alternate" hreflang="zh-CN" href="https://invest.agiscorecard.com/">
<link rel="alternate" hreflang="en" href="https://invest.agiscorecard.com/en">
<link rel="alternate" hreflang="x-default" href="https://invest.agiscorecard.com/">
<style>
  :root{
    --bg:#f6f7f9; --card:#ffffff; --ink:#1a202c; --muted:#64748b;
    --line:#e2e8f0; --accent:#2563eb; --hit:#16803c; --miss:#b42318;
    --partial:#b45309; --mkt:#7c3aed; --risk:#be123c;
  }
  @media (prefers-color-scheme: dark){
    :root{ --bg:#0f141a; --card:#171e26; --ink:#e6edf3; --muted:#8b98a5;
      --line:#2a3441; --accent:#60a5fa; --hit:#4ade80; --miss:#f87171;
      --partial:#fbbf24; --mkt:#c4b5fd; --risk:#fb7185; }
  }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.65 -apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}
  .wrap{max-width:1080px;margin:0 auto;padding:24px 16px 64px}
  header h1{font-size:26px;margin:0 0 4px} header p{color:var(--muted);margin:0 0 20px}
  h2{font-size:19px;margin:36px 0 12px;border-left:4px solid var(--accent);padding-left:10px}
  .stats{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;
    padding:12px 18px;min-width:150px}
  .stat b{display:block;font-size:22px} .stat span{color:var(--muted);font-size:13px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;
    padding:14px 16px;margin-bottom:10px}
  .chip{display:inline-block;font-size:12px;padding:1px 9px;border-radius:999px;
    border:1px solid var(--line);color:var(--muted);margin-right:6px;cursor:pointer}
  .chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
  .tag{display:inline-block;font-size:11px;padding:0 7px;border-radius:999px;
    background:color-mix(in srgb, var(--accent) 12%, transparent);color:var(--accent);margin-left:6px}
  .v-hit{color:var(--hit)} .v-miss{color:var(--miss)} .v-partial{color:var(--partial)}
  .v-marketing{color:var(--mkt)} .v-risk{color:var(--risk)} .v-hit-weak{color:var(--partial)}
  .meta{color:var(--muted);font-size:12.5px}
  .pred .row{display:grid;grid-template-columns:110px 1fr;gap:4px 14px}
  .pred .row b{color:var(--muted);font-weight:600;font-size:13px}
  a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
  .stocks{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px}
  .stars{letter-spacing:2px;color:var(--accent)}
  .feed-title{font-weight:600}
  button{background:var(--accent);color:#fff;border:0;border-radius:8px;
    padding:7px 16px;font-size:14px;cursor:pointer}
  footer{margin-top:48px;color:var(--muted);font-size:12.5px;border-top:1px solid var(--line);padding-top:16px}
  .scroll{overflow-x:auto}
</style>
</head>
<body><div class="wrap">
<header>
  <h1>🔭 SunWatch Pro · AI 热点赛道投资罗盘</h1>
  <p>存储 / 物理AI / 能源 / 加密五大赛道深度分析 · A股/港股/美股三市场推荐 · 实时触发线 + Telegram 信号 · <a href="/track-record">📊 公开战绩</a> · <a href="/red-team">🛡 对抗审查</a> · <a href="/method">🧭 方法论</a> · <a href="/faq">❓FAQ</a> · <a href="/go/tg" rel="nofollow">🤖 免费订阅信号预告</a> · <a href="/en">🇬🇧 English</a> · <a href="https://agiscorecard.com/cn">🏠 AGI 记分牌</a></p>
  <div id="trackNav" style="margin:10px 0 4px"></div>
  <div id="proBar" style="margin:6px 0"></div>
</header>

<div class="stats" id="stats"></div>
<div><button onclick="refresh()">立即抓取最新信息</button> <button onclick="refreshQuotes()" style="margin-left:8px">刷新行情</button> <span class="meta" id="refreshMsg"></span></div>

<h2>📌 今日要做</h2>
<div id="todayActions"></div>

<h2>今日行动面板(实时行情 × 触发线)</h2>
<p class="meta">现价来自 Yahoo Finance,每 30 分钟自动刷新;价格穿越触发线时 Telegram 实时报警。🔴=触发线已穿越(执行动作) 🟡=距触发线 3% 以内(备战) 🟢=安全距离。</p>
<div id="actionboard"><div class="card meta">行情加载中…</div></div>

<h2>🧭 核心信号清单(完整版)</h2>
<p class="meta">历史观点需重新复核，不能把页面刷新当作判断更新。<a href="/research">查看公司披露监控与复核状态 →</a></p><div id="coreSignals"></div>

<h2>预测记录与打分(给自己建档)</h2>
<p class="meta">本系统每次明确判断都在此公开记档——命中与失误同等展示,与孙宇晨预判档案同一标准。</p>
<p class="meta">此处是编辑复盘，不是交易胜率或已验证盈利。事前公开证据覆盖见 <a href="/track-record">证据状态</a>。</p>
<div id="forecasts"></div>

<h2>主题周期定位与操盘框架</h2>
<p class="meta">四阶段模型:早期信号 → 中期主升 → 高峰泡沫 → 退潮。阶段判定附依据;各阶段给出可观测信号与对应标的;操盘纪律含具体触发条件。非投资建议。</p>
<div id="playbook"></div>

<h2>跨市场标的映射:美股 / 港股 / A股(关联强度 ★)</h2>
<p class="meta">除 TRON 外均为"预判主题 → 标的"映射,不代表其实际持仓;A股无直接加密标的。市值/估值等数字为 2026-07 初快照(标注日期的以该日为准,"待核"表示未经二次核验),交易前请以实时行情为准。</p>
<div id="stocks"></div>

<h2>实时监控流</h2>
<div id="filterBar"></div>
<div id="feed" style="margin-top:10px"><div class="card meta">加载中…</div></div>

<h2>预判档案:预判 → 结果 → 他的操作</h2>
<div id="archive"></div>

<h2 id="pricing">订阅 Pro</h2>
<div class="stocks">
  <div class="card"><b>免费版</b><div style="font-size:22px;font-weight:700;margin:4px 0">¥0</div>
    <div style="font-size:14px">✅ 五大赛道深度分析与周期定位<br>✅ 实时行情与新闻监控流<br>✅ 孙宇晨预判档案 + 系统预测记录<br>🔒 具体买卖价位与触发线<br>🔒 操盘纪律与仓位方案<br>🔒 Telegram 实时信号</div></div>
  <div class="card" style="border-color:var(--accent)"><b>Pro 会员</b> <span class="tag">推荐</span><div style="font-size:22px;font-weight:700;margin:4px 0">¥199/月 <span class="meta" style="font-size:13px">或 ¥1999/年</span></div>
    <div style="font-size:14px">✅ 免费版全部内容<br>✅ <b>全部买入区间 / 止损线 / 仓位方案</b><br>✅ <b>实时触发线报警(价格穿越秒推 TG)</b><br>✅ 每日双简报(北京 08:30 / 20:30)<br>✅ 重要信号快讯(SKHY/宇树/Optimus/合约价拐点等)</div>
    <div style="margin-top:8px"><a href="/go/buy" rel="nofollow" style="display:inline-block;background:var(--accent);color:#fff;padding:9px 18px;border-radius:8px;font-weight:700;text-decoration:none">立即购买 →</a></div>
    <div class="meta" style="margin-top:6px">点击后在 Telegram 里完成:机器人当场给出 USDT(BEP20)收款地址,付完把交易哈希发回,站长上链核对后发激活码(也可走微信/支付宝)→ 向 @sunwatchBot 发送 <code>/start 激活码</code> 绑定信号,或在下方输入解锁网站价位</div></div>
</div>
<div class="card" style="margin-top:10px"><b>激活 Pro</b>
  <div style="margin-top:6px"><input id="proKey" placeholder="输入激活码 SW-XXXXXX" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:220px">
  <button onclick="activatePro()">激活</button> <span class="meta" id="proMsg"></span></div></div>

<footer>
  数据信源:Google News RSS(英/中/TRON Inc. 三路)+ 可选 X API;每 30 分钟自动抓取,按关键词自动打标。
  详细调研与引用见仓库 <code>report/</code> 目录。<br>
  <b>免责声明:</b>本站为公开信息研究工具,不构成投资建议;标注 ⚠ 的条目未完成三票核验,关键决策请以 SEC/EDGAR 与法院文书为准。
</footer>
</div>
<script>
let FEED=[], FILTER=null;
const VERDICT={hit:["✅ 命中","v-hit"],["hit-weak"]:["✅ 命中(弱)","v-hit-weak"],
  partial:["🟡 部分命中","v-partial"],miss:["❌ 落空","v-miss"],
  marketing:["📣 营销造势","v-marketing"],risk:["⚠️ 风险事件","v-risk"],
  pending:["⏳ 待验证","v-partial"]};

let WATCH=[],ARCH=null,QDATA={quotes:[]},TRACK='all';
const TRACK_MATCH={all:()=>true,storage:g=>/存储/.test(g||''),['physical-ai']:g=>/物理AI|潜伏/.test(g||''),energy:g=>/能源|太空/.test(g||''),crypto:g=>/加密|稳定币|币库|特朗普|直接载体|孙宇晨/.test(g||'')};
function proKey(){return localStorage.getItem('swkey')||''}
async function load(){
  const key=proKey();
  const [a,f,q]=await Promise.all([
    fetch('/api/archive'+(key?'?key='+encodeURIComponent(key):'')).then(r=>r.json()),
    fetch('/api/feed').then(r=>r.json()),
    fetch('/api/quotes').then(r=>r.json()).catch(()=>({quotes:[]}))
  ]);
  FEED=f.items||[]; WATCH=a.watchlist||[]; ARCH=a; QDATA=q;
  renderTrackNav(a.tracks||[]); renderProBar(a.pro);
  renderStats(a,f); renderAll(); renderFilters(); renderFeed();
}
function renderAll(){
  const m=TRACK_MATCH[TRACK]||(()=>true);
  renderArchive(ARCH.predictions);
  renderStocks((ARCH.stocks||[]).filter(s=>TRACK==='all'||m(s.theme)));
  renderPlaybook((ARCH.playbook||[]).filter(p=>TRACK==='all'||m(p.theme)));
  renderForecasts(ARCH.forecasts||[]);
  renderActionBoard({...QDATA,quotes:(QDATA.quotes||[]).filter(x=>TRACK==='all'||m(x.group))});
}
function renderTrackNav(tracks){
  document.getElementById('trackNav').innerHTML=tracks.map(t=>
    '<span class="chip'+(TRACK===t.id?' active':'')+'" onclick="setTrack(\\''+t.id+'\\')" style="font-size:14px;padding:4px 14px">'+t.name+'</span>').join('');
}
function setTrack(id){TRACK=id;renderTrackNav(ARCH.tracks||[]);renderAll();}
function renderProBar(pro){
  document.getElementById('proBar').innerHTML=pro
    ?'<span class="tag" style="font-size:13px;padding:2px 10px">✨ Pro 已激活:全部价位与信号可见</span>'
    :'<span class="meta">当前为免费版:具体买卖价位/触发线/操盘纪律为 🔒 Pro 内容 — <a href="#pricing">订阅 Pro</a></span>';
}
async function activatePro(){
  const code=document.getElementById('proKey').value.trim().toUpperCase();
  const el=document.getElementById('proMsg');
  if(!code){el.textContent='请输入激活码';return}
  const r=await fetch('/api/activate?code='+encodeURIComponent(code)).then(r=>r.json());
  if(r.ok){localStorage.setItem('swkey',code);el.textContent='✅ 激活成功,刷新数据…';load();}
  else el.textContent='❌ '+(r.error||'激活失败');
}
async function refreshQuotes(){
  const el=document.getElementById('refreshMsg');el.textContent='刷新行情中…';
  try{
    await fetch('/api/refresh-quotes');
    const q=await fetch('/api/quotes').then(r=>r.json());
    renderActionBoard(q); el.textContent='行情已更新 '+(q.at||'').replace('T',' ').slice(0,16);
  }catch(e){el.textContent='行情刷新失败:'+e.message}
}
function renderActionBoard(q){
  const quotes=q.quotes||[];
  if(!quotes.length){document.getElementById('actionboard').innerHTML='<div class="card meta">暂无行情——点「刷新行情」初始化(部署后首次需手动触发一次)。</div>';return;}
  const qm=Object.fromEntries(quotes.map(x=>[x.symbol,x]));
  document.getElementById('actionboard').innerHTML='<div class="stocks">'+WATCH.map(w=>{
    const qt=qm[w.symbol];
    if(!qt)return '<div class="card meta">'+esc(w.name)+':行情不可用</div>';
    const rows=(w.levels||[]).map(lv=>{
      const dist=(lv.price-qt.price)/qt.price*100;
      const crossed=(lv.dir==='below'&&qt.price<=lv.price)||(lv.dir==='above'&&qt.price>=lv.price);
      const near=!crossed&&Math.abs(dist)<=3;
      const light=crossed?'🔴':near?'🟡':'🟢';
      return '<div style="font-size:13px;margin-top:3px">'+light+' '+esc(lv.label)+' <b>'+lv.price.toLocaleString()+'</b>'+
        ' <span class="meta">(距离 '+(dist>0?'+':'')+dist.toFixed(1)+'%)</span>'+
        (crossed?'<div style="color:var(--miss);font-weight:600">→ '+esc(lv.act)+'</div>':'')+
      '</div>';
    }).join('');
    const chg=qt.changePct;
    return '<div class="card"><b>'+esc(w.name)+'</b> <span class="tag">'+esc(w.group)+'</span>'+
      '<div style="font-size:20px;font-weight:700;margin-top:2px">'+qt.price.toLocaleString()+
      ' <span style="font-size:14px" class="'+(chg>=0?'v-hit':'v-miss')+'">'+(chg>0?'+':'')+chg+'%</span></div>'+
      (rows||'<div class="meta" style="font-size:12.5px">无触发线(仅监控)</div>')+'</div>';
  }).join('')+'</div><div class="meta" style="margin-top:6px">行情时间:'+(q.at||'—').replace('T',' ').slice(0,16)+' UTC</div>';
}
const F_VERDICT={hit:['✅ 命中','v-hit'],miss:['❌ 失误','v-miss'],partial:['🟡 部分','v-partial'],pending:['⏳ 验证中','v-partial']};
function renderForecasts(fc){
  const scored=fc.filter(x=>['hit','miss'].includes(x.verdict));
  const hits=scored.filter(x=>x.verdict==='hit').length;
  document.getElementById('forecasts').innerHTML=
    '<div class="meta" style="margin-bottom:8px">可评分 '+scored.length+' 条,命中 '+hits+' 条'+(scored.length?'(编辑命中比率 '+Math.round(hits/scored.length*100)+'%)':'')+'</div>'+
    fc.map(x=>{
      const[v,c]=F_VERDICT[x.verdict]||[x.verdict,''];
      return '<div class="card"><b>'+x.date+'</b> · <b class="'+c+'">'+v+'</b><div style="margin-top:4px">'+esc(x.call)+'</div>'+
      '<div class="meta" style="margin-top:3px">依据:'+esc(x.basis)+'</div>'+
      '<div style="margin-top:3px;font-size:13.5px">结果:'+esc(x.outcome)+'</div></div>';
    }).join('');
}
const STAGE_META={early:['早期信号','v-hit'],mid:['中期主升','v-partial'],peak:['高峰泡沫','v-miss'],exit:['退潮','v-risk']};
function renderPlaybook(pb){
  const order=['early','mid','peak','exit'];
  document.getElementById('playbook').innerHTML=pb.map(p=>{
    const bar=order.map(s=>{
      const on=s===p.stage;
      return '<span style="flex:1;text-align:center;padding:4px 2px;border-radius:6px;font-size:12px;'+
        (on?'background:var(--accent);color:#fff;font-weight:700':'border:1px solid var(--line);color:var(--muted)')+'">'+
        STAGE_META[s][0]+'</span>';
    }).join('');
    const rows=order.map(s=>{
      const st=p.stages[s]; if(!st)return'';
      const td='padding:6px 8px 6px 0;border-top:1px solid var(--line);vertical-align:top';
      return '<tr'+(s===p.stage?' style="background:color-mix(in srgb,var(--accent) 8%,transparent)"':'')+'>'+
        '<td style="white-space:nowrap;'+td+'"><b class="'+STAGE_META[s][1]+'">'+STAGE_META[s][0]+'</b><div class="meta">'+esc(st.window)+'</div></td>'+
        '<td style="'+td+'">'+esc(st.signals)+'</td><td style="'+td+'">'+esc(st.tickers)+'</td></tr>';
    }).join('');
    return '<div class="card">'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:16px">'+esc(p.theme)+'</b>'+
      '<span class="tag">'+esc(p.stageNote)+'</span></div>'+
      '<div style="display:flex;gap:6px;margin:10px 0">'+bar+'</div>'+
      '<div style="margin:6px 0"><b style="font-size:13px">阶段判定依据</b><ul style="margin:4px 0 8px 18px;padding:0">'+
      p.basis.map(b=>'<li style="margin:2px 0">'+esc(b)+'</li>').join('')+'</ul></div>'+
      '<div class="scroll"><table style="width:100%;border-collapse:collapse;font-size:13.5px">'+
      '<tr style="color:var(--muted)"><th style="text-align:left;padding:4px 8px 4px 0">阶段</th><th style="text-align:left;padding:4px 8px 4px 0">可观测信号</th><th style="text-align:left;padding:4px 0">对应标的/动作</th></tr>'+rows+'</table></div>'+
      '<div style="margin-top:8px;padding:8px 10px;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent);border-radius:4px"><b style="font-size:13px">操盘纪律</b><div style="margin-top:2px">'+esc(p.tactics)+'</div></div>'+
      '</div>';
  }).join('');
}
function renderStats(a,f){
  const hits=a.predictions.filter(p=>p.verdict.startsWith('hit')).length;
  const scored=a.predictions.filter(p=>!['marketing','risk','pending'].includes(p.verdict)).length;
  document.getElementById('stats').innerHTML=
    stat(f.count,'监控条目')+stat(a.predictions.length,'档案条目')+
    stat(hits+'/'+scored,'可评分预判命中')+
    stat(latest(f.items),'最新条目时间');
}
const stat=(v,l)=>'<div class="stat"><b>'+v+'</b><span>'+l+'</span></div>';
const latest=items=>items&&items[0]&&items[0].published?items[0].published.slice(0,10):'—';
function renderFilters(){
  const tags=[...new Set(FEED.flatMap(i=>i.tags))];
  document.getElementById('filterBar').innerHTML=
    '<span class="chip'+(FILTER?'':' active')+'" onclick="setF(null)">全部</span>'+
    tags.map(t=>'<span class="chip'+(FILTER===t?' active':'')+'" onclick="setF(\\''+t+'\\')">'+t+'</span>').join('');
}
function setF(t){FILTER=t;renderFilters();renderFeed();}
function renderFeed(){
  const list=FILTER?FEED.filter(i=>i.tags.includes(FILTER)):FEED;
  document.getElementById('feed').innerHTML=list.length?list.slice(0,80).map(i=>
    '<div class="card"><div class="feed-title"><a href="'+i.link+'" target="_blank" rel="noopener">'+esc(i.title)+'</a>'+
    i.tags.map(t=>'<span class="tag">'+t+'</span>').join('')+'</div>'+
    '<div class="meta">'+(i.published?i.published.replace('T',' ').slice(0,16):'')+' · '+esc(i.origin||'')+' · via '+i.via+'</div></div>'
  ).join(''):'<div class="card meta">暂无数据——点击上方「立即抓取」初始化。</div>';
}
function renderArchive(preds){
  document.getElementById('archive').innerHTML=preds.map(p=>{
    const[v,c]=VERDICT[p.verdict]||[p.verdict,''];
    return '<div class="card pred"><div><b>'+p.date+'</b> · <span class="meta">'+esc(p.channel)+'</span> · <b class="'+c+'">'+v+'</b></div>'+
    '<div class="row" style="margin-top:6px">'+
    '<b>预判/言论</b><div>'+esc(p.prediction)+'</div>'+
    '<b>验证结果</b><div>'+esc(p.outcome)+'</div>'+
    '<b>他的操作</b><div>'+esc(p.action)+'</div>'+
    '<b>核验状态</b><div class="meta">'+esc(p.note)+'</div></div></div>';
  }).join('');
}
function renderStocks(st){
  const markets=['美股','港股','A股'];
  document.getElementById('stocks').innerHTML=markets.map(m=>{
    const list=st.filter(s=>s.market===m).sort((a,b)=>b.relation-a.relation);
    if(!list.length)return '';
    return '<h3 style="margin:16px 0 8px;font-size:16px">'+m+'('+list.length+')</h3><div class="stocks">'+
      list.map(s=>{
        const f=s.fund||{};
        const row=(k,v)=>v&&v!=='—'?'<div style="font-size:13px;margin-top:3px"><b style="color:var(--muted)">'+k+'</b> '+esc(v)+'</div>':'';
        return '<div class="card"><b>'+s.ticker+'</b> · '+esc(s.name)+
        ' <span class="tag">'+esc(s.theme||'')+'</span> <span class="stars">'+'★'.repeat(s.relation)+'☆'.repeat(5-s.relation)+'</span>'+
        '<div style="margin-top:4px">'+esc(s.logic)+'</div>'+
        row('市值/规模',f.mcap)+row('估值',f.val)+row('存货/库存',f.inv)+row('稀缺性',f.moat)+row('竞对',f.comp)+
        '<div class="meta" style="margin-top:5px">风险:'+esc(s.risk)+'</div></div>';
      }).join('')+
      '</div>';
  }).join('');
}
async function refresh(){
  const el=document.getElementById('refreshMsg');el.textContent='抓取中…';
  try{const r=await fetch('/api/refresh').then(r=>r.json());
    el.textContent='新增 '+r.added+' 条,共 '+r.total+' 条'+(r.errors&&r.errors.length?';部分信源失败':'');
    const f=await fetch('/api/feed').then(r=>r.json());FEED=f.items||[];renderFilters();renderFeed();
  }catch(e){el.textContent='抓取失败:'+e.message}
}
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
load();
</script>
</body></html>`;
}

