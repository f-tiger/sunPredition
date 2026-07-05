import { PREDICTIONS, STOCKS, SOURCES, TAG_RULES } from "./data.js";
import { renderDashboard } from "./html.js";

const KV_KEY = "feed-items";
const MAX_ITEMS = 300;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/":
        return new Response(renderDashboard(), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      case "/api/feed": {
        const items = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
        return json({ count: items.length, items });
      }
      case "/api/archive":
        return json({ predictions: PREDICTIONS, stocks: STOCKS });
      case "/api/refresh": {
        const result = await refreshFeed(env);
        return json(result);
      }
      case "/favicon.ico":
      case "/favicon.svg":
        return new Response(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🔭</text></svg>`,
          { headers: { "content-type": "image/svg+xml" } }
        );
      default:
        return new Response("Not found", { status: 404 });
    }
  },

  async scheduled(_event, env, _ctx) {
    await refreshFeed(env);
  },
};

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

// ---- 抓取与合并 ----

async function refreshFeed(env) {
  const existing = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
  const seen = new Set(existing.map((i) => i.id));
  const fresh = [];
  const errors = [];

  const results = await Promise.allSettled([
    ...SOURCES.map((s) => fetchRss(s)),
    fetchXTimeline(env),
  ]);
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const item of r.value) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          fresh.push(item);
        }
      }
    } else {
      errors.push(String(r.reason).slice(0, 200));
    }
  }

  fresh.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
  const merged = [...fresh, ...existing].slice(0, MAX_ITEMS);
  await env.SUNWATCH_KV.put(KV_KEY, JSON.stringify(merged));
  await env.SUNWATCH_KV.put(
    "last-refresh",
    JSON.stringify({ at: new Date().toISOString(), added: fresh.length, errors })
  );
  return { added: fresh.length, total: merged.length, errors };
}

async function fetchRss(source) {
  const resp = await fetch(source.url, {
    headers: { "user-agent": "sunwatch/1.0 (+cloudflare-worker)" },
  });
  if (!resp.ok) throw new Error(`${source.name}: HTTP ${resp.status}`);
  const xml = await resp.text();
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && items.length < 40) {
    const block = m[1];
    const title = decodeEntities(pick(block, "title"));
    const link = decodeEntities(stripCdata(pick(block, "link")));
    const pubDate = pick(block, "pubDate");
    const sourceName = decodeEntities(pick(block, "source")) || source.name;
    if (!title || !link) continue;
    items.push(makeItem({ title, link, published: toIso(pubDate), origin: sourceName, via: source.name }));
  }
  return items;
}

// X API 直连(可选):设置 X_BEARER_TOKEN 后启用
async function fetchXTimeline(env) {
  if (!env.X_BEARER_TOKEN) return [];
  const auth = { authorization: `Bearer ${env.X_BEARER_TOKEN}` };
  const u = await fetch(
    "https://api.twitter.com/2/users/by/username/justinsuntron",
    { headers: auth }
  );
  if (!u.ok) throw new Error(`X user lookup: HTTP ${u.status}`);
  const uid = (await u.json())?.data?.id;
  if (!uid) return [];
  const t = await fetch(
    `https://api.twitter.com/2/users/${uid}/tweets?max_results=25&tweet.fields=created_at`,
    { headers: auth }
  );
  if (!t.ok) throw new Error(`X timeline: HTTP ${t.status}`);
  const tweets = (await t.json())?.data || [];
  return tweets.map((tw) =>
    makeItem({
      title: tw.text,
      link: `https://x.com/justinsuntron/status/${tw.id}`,
      published: tw.created_at,
      origin: "X @justinsuntron",
      via: "X-API",
    })
  );
}

function makeItem({ title, link, published, origin, via }) {
  return {
    id: fnv1a(link || title),
    title,
    link,
    published: published || null,
    origin,
    via,
    tags: tagFor(title),
  };
}

function tagFor(text) {
  const tags = TAG_RULES.filter((r) => r.re.test(text)).map((r) => r.tag);
  return tags.length ? tags : ["其他"];
}

// ---- 小工具 ----

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : "";
}
function stripCdata(s) {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}
function decodeEntities(s) {
  return stripCdata(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}
function toIso(d) {
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36);
}
