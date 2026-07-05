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
      case "/api/test-telegram": {
        const cfg = await getTgConfig(env);
        if (!cfg)
          return json({ ok: false, error: "未配置 Telegram。访问 /api/setup-telegram?token=<bot token> 一键配置" });
        const r = await sendTelegram(cfg, "✅ <b>SunWatch</b> 测试消息:Telegram 推送已连通。");
        return json(r);
      }
      // 一键配置:先给机器人发一条消息,再访问 /api/setup-telegram?token=<bot token>
      // 自动通过 getUpdates 发现 chat_id 并存入 KV,随后发送测试消息。
      // 已配置后再次调用需携带与现有配置一致的 token 才能覆盖(防止他人篡改)。
      case "/api/setup-telegram": {
        const token = url.searchParams.get("token")?.trim();
        if (!token) return json({ ok: false, error: "缺少 ?token=<bot token> 参数" });
        const existing = await getTgConfig(env);
        if (existing && existing.token !== token)
          return json({ ok: false, error: "已存在配置,token 不匹配,拒绝覆盖" });
        const upd = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        const body = await upd.json().catch(() => ({}));
        if (!body.ok)
          return json({ ok: false, error: `token 无效或 Telegram API 出错: ${body.description || upd.status}` });
        const chats = (body.result || [])
          .map((u) => u.message?.chat || u.edited_message?.chat || u.channel_post?.chat)
          .filter(Boolean);
        if (!chats.length)
          return json({ ok: false, error: "还没收到消息:请先在 Telegram 里给你的机器人发一条任意消息,再刷新本页面" });
        const chat = chats[chats.length - 1];
        const cfg = { token, chatId: String(chat.id) };
        await env.SUNWATCH_KV.put("tg-config", JSON.stringify(cfg));
        const test = await sendTelegram(cfg, "✅ <b>SunWatch</b> 配置成功!之后每次监控到孙宇晨新动态都会推送到这里。");
        return json({ ok: test.ok, chatId: cfg.chatId, chatName: chat.username || chat.title || chat.first_name || "", test });
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

  // 有新条目时推送 Telegram(失败不影响主流程)
  let telegram = null;
  const cfg = fresh.length ? await getTgConfig(env) : null;
  if (cfg) {
    telegram = await notifyTelegram(cfg, fresh).catch((e) => ({ ok: false, error: String(e) }));
  }
  return { added: fresh.length, total: merged.length, errors, telegram };
}

// ---- Telegram 推送 ----

// 配置优先级:Cloudflare secrets(TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)> KV(/api/setup-telegram 写入)
async function getTgConfig(env) {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)
    return { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID };
  return (await env.SUNWATCH_KV.get("tg-config", "json")) || null;
}

async function notifyTelegram(cfg, items) {
  const top = items.slice(0, 10);
  const lines = top.map(
    (i) =>
      `• [${i.tags.join("/")}] <a href="${escAttr(i.link)}">${escHtml(i.title).slice(0, 120)}</a>` +
      (i.published ? ` <i>(${i.published.slice(0, 10)})</i>` : "")
  );
  const more = items.length > top.length ? `\n…另有 ${items.length - top.length} 条,详见监控台` : "";
  const text = `🔭 <b>SunWatch:孙宇晨监控更新 ${items.length} 条</b>\n\n${lines.join("\n")}${more}`;
  return sendTelegram(cfg, text);
}

async function sendTelegram(cfg, text) {
  const resp = await fetch(
    `https://api.telegram.org/bot${cfg.token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok && body.ok === true, status: resp.status, description: body.description };
}

function escHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s) {
  return String(s || "").replace(/"/g, "%22");
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
