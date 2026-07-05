import { PREDICTIONS, STOCKS, SOURCES, TAG_RULES, PLAYBOOK, CORE_SIGNALS, IMPORTANT_RULES } from "./data.js";
import { renderDashboard } from "./html.js";

const KV_KEY = "feed-items"; // KV 主键:去重后的监控条目列表
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
        return json({ predictions: PREDICTIONS, stocks: STOCKS, playbook: PLAYBOOK });
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
      // 把当前监控结论(命中统计+最新动态+跨市场核心映射+跟踪点)推送到 Telegram
      case "/api/push-summary": {
        const cfg = await getTgConfig(env);
        if (!cfg)
          return json({ ok: false, error: "未配置 Telegram。访问 /api/setup-telegram?token=<bot token> 一键配置" });
        const items = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
        const r = await sendTelegram(cfg, buildSummary(items, url.origin));
        return json(r);
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

  async scheduled(event, env, _ctx) {
    const result = await refreshFeed(env);
    const cfg = await getTgConfig(env);
    if (!cfg) return;
    if (event.cron === "0 4 * * *") {
      // 每日北京时间 12:00:完整监控结论(含核心信号)
      const items = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
      await sendTelegram(cfg, buildSummary(items, "https://sunwatch.tuoqiantu.workers.dev")).catch(() => {});
    } else if (result.important.length) {
      // 30 分钟轮询:仅命中重要信号时额外推送
      await sendTelegram(cfg, buildAlert(result.important)).catch(() => {});
    }
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

  // 标记命中重要信号的新条目(推送决策由 scheduled 处理:日常静默,重要信号才实时推)
  const important = fresh
    .map((i) => {
      const rule = IMPORTANT_RULES.find((r) => r.re.test(i.title));
      return rule ? { ...i, signal: rule.label } : null;
    })
    .filter(Boolean);
  return { added: fresh.length, total: merged.length, errors, important };
}

// 重要信号即时推送
function buildAlert(items) {
  const lines = items.slice(0, 5).map(
    (i) => `🚨 <b>[${i.signal}]</b> <a href="${escAttr(i.link)}">${escHtml(i.title).slice(0, 100)}</a>`
  );
  return `⚡ <b>SunWatch 重要信号</b>\n\n${lines.join("\n")}\n\n对照操盘纪律执行,详见监控台核心信号清单。`;
}

// ---- 监控结论摘要 ----

function buildSummary(items, origin) {
  const scored = PREDICTIONS.filter((p) => !["marketing", "risk", "pending"].includes(p.verdict));
  const hits = scored.filter((p) => p.verdict.startsWith("hit")).length;
  const latest = items.slice(0, 5).map(
    (i) => `• [${i.tags.join("/")}] <a href="${escAttr(i.link)}">${escHtml(i.title).slice(0, 80)}</a>`
  );
  const byMarket = (m) =>
    STOCKS.filter((s) => s.market === m)
      .sort((a, b) => b.relation - a.relation)
      .slice(0, 5)
      .map((s) => `${s.name}(${s.ticker.split(".")[0]})`)
      .join(" / ");
  const STAGE_CN = { early: "早期信号", mid: "中期主升", peak: "高峰区间", exit: "退潮" };
  const stages = PLAYBOOK.map((p) => `• ${p.theme}:<b>${STAGE_CN[p.stage] || p.stage}</b> — ${p.stageNote}`);
  return [
    `🔭 <b>SunWatch 监控结论</b> ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `📊 <b>预判档案</b>:共 ${PREDICTIONS.length} 条;可评分 ${scored.length} 条中命中 ${hits} 条(其余为营销造势/风险事件/待验证)`,
    `核心结论:他的言论不是可靠信号,资本动作才是`,
    ``,
    `📈 <b>主题周期定位</b>:`,
    ...stages,
    ``,
    `🧭 <b>核心信号(触发即执行)</b>:`,
    ...CORE_SIGNALS.map((s) => `• ${escHtml(s)}`),
    ``,
    `🆕 <b>最新动态</b>(库存 ${items.length} 条):`,
    ...(latest.length ? latest : ["• 暂无,等待下轮抓取"]),
    ``,
    `🎯 <b>跨市场映射</b>(按关联度):`,
    `美股:${byMarket("美股")}`,
    `港股:${byMarket("港股")}`,
    `A股:${byMarket("A股")}`,
    ``,
    `👁 <b>跟踪点</b>:SKHY(海力士ADR)上市=存储派发窗口 / 宇树科创板挂牌定价=物理AI温度计 / 优必选万台订单收入确认 / Optimus 量产节点 / MU 财报与合约价月报 / WLFI 互诉`,
    ``,
    `详见监控台:${origin} (非投资建议)`,
  ].join("\n");
}

// ---- Telegram 推送 ----

// 配置优先级:Cloudflare secrets(TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)> KV(/api/setup-telegram 写入)
async function getTgConfig(env) {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)
    return { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID };
  return (await env.SUNWATCH_KV.get("tg-config", "json")) || null;
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
