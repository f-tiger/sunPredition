import { PREDICTIONS, STOCKS, SOURCES, TAG_RULES, PLAYBOOK, CORE_SIGNALS, IMPORTANT_RULES, WATCHLIST, FORECASTS, TRACKS, ACTION_QUEUE } from "./data.js";
import { renderDashboard, renderTrackRecord, renderStockPage, renderTrackPage, renderDailyPage, renderDailyIndex, renderFaq, slugify, forecastSlugs, renderForecastPage, renderForecastIndex, renderLandingEN, renderTrackRecordEN, renderMethod, renderMethodEN, renderRedTeam, renderRedTeamEN } from "./html.js";

// IndexNow 密钥(托管于站内,协议要求;无需注册任何账号)
const INDEXNOW_KEY = "a7f3c9e2b8d14f60b5e21c47d903aa58";
// Telegram webhook 校验密钥(防伪造 webhook 调用;每日 cron 自愈重注册)
const WEBHOOK_SECRET = "swhk-9d2f7c41e8b3a650c7d19e84f2b5a3c8";
const SITE = "https://invest.agiscorecard.com";

// USDT 收款(站长 2026-08-06 指定)。**只在 bot 私信里给出,不渲染到公开页面**——
// 公开页上的地址会被抓取归档,且链上余额与全部往来记录任何人都能查。
// 地址经两个独立来源逐字符核对(钱包截图 + 站长粘贴文本)。链错=资金不可找回,所以
// 每次给地址都必须同时给出链名警告。
const USDT_ADDR = "0xBc2a5eB76170DfE6d1A4FbFD966a27E5F2B93221";
const USDT_CHAIN = "BNB Smart Chain (BEP20)";
// 按 ¥199 / ¥1999 以约 7.15 折算取整,不借汇率换算悄悄涨价。改价改这里一处。
const USDT_MONTH = 28;
const USDT_YEAR = 280;
// BSC 交易哈希:0x + 64 位十六进制。买家把它发给 bot → 转给站长人工核对后发码。
const TXID_RE = /^0x[a-fA-F0-9]{64}$/;
const TRACK_MATCHERS = {
  storage: (g) => /存储/.test(g || ""),
  "physical-ai": (g) => /物理AI|潜伏/.test(g || ""),
  energy: (g) => /能源|太空/.test(g || ""),
  crypto: (g) => /加密|稳定币|币库|特朗普|直接载体|孙宇晨/.test(g || ""),
};
function allUrls() {
  const urls = [SITE + "/", SITE + "/track-record", SITE + "/faq", SITE + "/feed.xml", SITE + "/forecast", SITE + "/en", SITE + "/en/track-record", SITE + "/method", SITE + "/en/method", SITE + "/red-team", SITE + "/en/red-team"];
  for (const t of TRACKS.filter((x) => x.id !== "all")) urls.push(`${SITE}/track/${t.id}`);
  for (const s of STOCKS) urls.push(`${SITE}/stock/${slugify(s.ticker)}`);
  for (const { id } of forecastSlugs(FORECASTS)) urls.push(`${SITE}/forecast/${id}`);
  return urls;
}

const KV_KEY = "feed-items"; // KV 主键:去重后的监控条目列表(手动触达 2026-07-05)
const MAX_ITEMS = 300;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // pSEO 动态路由(含 PV 计数)
    if (url.pathname === "/" || url.pathname.startsWith("/stock/") || url.pathname.startsWith("/track") || url.pathname.startsWith("/forecast") || url.pathname.startsWith("/en")) {
      ctx.waitUntil(bumpGrowth(env, "pv"));
    }
    if (url.pathname.startsWith("/stock/")) {
      const slug = url.pathname.slice(7);
      const s = STOCKS.find((x) => slugify(x.ticker) === slug);
      if (!s) return new Response("Not found", { status: 404 });
      const q = ((await env.SUNWATCH_KV.get("quotes", "json")) || { quotes: [] }).quotes.find((x) => x.symbol && slugify(x.symbol) === slug || x.name === s.name);
      const related = STOCKS.filter((x) => x.theme === s.theme && x.ticker !== s.ticker).slice(0, 6);
      // 注入该标的最新新闻(随 30 分钟抓取自动更新 → 页面持续新鲜)
      const feed = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
      const nameCore = s.name.replace(/\(.*?\)|(重点)/g, "").trim();
      const tickerCore = s.ticker.replace(/\.(SH|SZ|HK|KS)$/i, "").replace(/[^A-Za-z0-9一-龥]/g, "");
      const news = feed.filter((i) => {
        const t = i.title || "";
        return (nameCore.length >= 2 && t.includes(nameCore)) || (tickerCore.length >= 3 && t.toUpperCase().includes(tickerCore.toUpperCase()));
      }).slice(0, 5);
      return new Response(renderStockPage(s, q, related, news), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/daily") {
      const list = await env.SUNWATCH_KV.list({ prefix: "daily-" });
      const dates = list.keys.map((k) => k.name.slice(6)).sort().reverse().slice(0, 30);
      return new Response(renderDailyIndex(dates), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname.startsWith("/daily/")) {
      const d = url.pathname.slice(7);
      const snap = await env.SUNWATCH_KV.get(`daily-${d}`, "json");
      if (!snap) return new Response("Not found", { status: 404 });
      return new Response(renderDailyPage(snap), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }
    if (url.pathname === "/red-team") {
      return new Response(renderRedTeam(FORECASTS), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/en/red-team") {
      return new Response(renderRedTeamEN(FORECASTS), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/method") {
      return new Response(renderMethod(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/en/method") {
      return new Response(renderMethodEN(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/en") {
      return new Response(renderLandingEN(FORECASTS), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/en/track-record") {
      return new Response(renderTrackRecordEN(FORECASTS), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname === "/forecast") {
      return new Response(renderForecastIndex(forecastSlugs(FORECASTS)), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    if (url.pathname.startsWith("/forecast/")) {
      const id = decodeURIComponent(url.pathname.slice(10));
      const all = forecastSlugs(FORECASTS);
      const hit = all.find((x) => x.id === id);
      if (!hit) return new Response("Not found", { status: 404 });
      const related = all.filter((x) => x.id !== id).slice(-4).reverse();
      return new Response(renderForecastPage(hit.f, hit.id, related), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }
    if (url.pathname.startsWith("/track/") && url.pathname !== "/track-record") {
      const id = url.pathname.slice(7);
      const t = TRACKS.find((x) => x.id === id && x.id !== "all");
      if (!t) return new Response("Not found", { status: 404 });
      const m = TRACK_MATCHERS[id] || (() => false);
      return new Response(renderTrackPage(t, PLAYBOOK.filter((p) => m(p.theme)), STOCKS.filter((s) => m(s.theme))), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=1800" } });
    }
    switch (url.pathname) {
      case "/": {
        // 语言协商(站长指令 2026-08-08:配置多语言,符合欧美习惯):
        // Accept-Language 首选非中文的真人访客 302 到 /en;点"中文"带 ?lang=zh 落回
        // 并记一年 cookie,此后不再跳。爬虫一律豁免——把 Googlebot 重定向走会直接
        // 毁掉中文版的索引,这比任何本地化收益都贵。
        const ua = request.headers.get("user-agent") || "";
        const isBot = /bot|crawler|spider|slurp|preview|fetch|curl|python/i.test(ua);
        const cookie = request.headers.get("cookie") || "";
        if (url.searchParams.get("lang") === "zh") {
          return new Response(renderDashboard(), {
            headers: { "content-type": "text/html; charset=utf-8",
                       "set-cookie": "lang=zh; Path=/; Max-Age=31536000; SameSite=Lax" } });
        }
        const first = ((request.headers.get("accept-language") || "").split(",")[0] || "").toLowerCase();
        if (!isBot && first && !first.startsWith("zh") && !/(?:^|;\s*)lang=zh(?:;|$)/.test(cookie)) {
          return Response.redirect(SITE + "/en", 302);
        }
        return new Response(renderDashboard(), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      case "/api/feed": {
        const items = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
        return json({ count: items.length, items });
      }
      case "/api/archive": {
        const pro = await isPro(env, url.searchParams.get("key"));
        const full = { predictions: PREDICTIONS, stocks: STOCKS, playbook: PLAYBOOK, forecasts: FORECASTS, watchlist: WATCHLIST, tracks: TRACKS.map(t => ({ id: t.id, name: t.name })), pro, actions: ACTION_QUEUE, coreSignals: CORE_SIGNALS };
        return json(pro ? full : redact(full));
      }
      // ---- Pro 会员体系 ----
      // 生成激活码(站长专用,以 bot token 鉴权):/api/gen-code?token=<bot token>
      case "/api/gen-code": {
        const cfg = await getTgConfig(env);
        if (!cfg || url.searchParams.get("token") !== cfg.token)
          return json({ ok: false, error: "鉴权失败:需携带 bot token" });
        const code = "SW-" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
        const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
        lic[code] = { createdAt: new Date().toISOString(), chatId: null };
        await env.SUNWATCH_KV.put("licenses", JSON.stringify(lic));
        return json({ ok: true, code, note: "发给订户:网页输入激活,或向 bot 发 /start " + code + " 绑定TG信号" });
      }
      // 激活码管理(站长专用,bot token 鉴权)。列表:/api/licenses?token=<bot token>;吊销:&revoke=SW-XXXXXX
      case "/api/licenses": {
        const cfg = await getTgConfig(env);
        if (!cfg || url.searchParams.get("token") !== cfg.token)
          return json({ ok: false, error: "鉴权失败:需携带 bot token" });
        const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
        const revoke = (url.searchParams.get("revoke") || "").trim().toUpperCase();
        if (revoke) {
          if (!lic[revoke]) return json({ ok: false, error: "激活码不存在:" + revoke });
          const revoked = (await env.SUNWATCH_KV.get("licenses-revoked", "json")) || {};
          revoked[revoke] = { ...lic[revoke], revokedAt: new Date().toISOString() };
          delete lic[revoke];
          await env.SUNWATCH_KV.put("licenses", JSON.stringify(lic));
          await env.SUNWATCH_KV.put("licenses-revoked", JSON.stringify(revoked));
          return json({ ok: true, revoked: revoke, note: "已吊销:网页/API 即刻失效,TG 广播自下一轮起不再包含该订户" });
        }
        const revokedAll = (await env.SUNWATCH_KV.get("licenses-revoked", "json")) || {};
        const list = Object.entries(lic).map(([code, l]) => ({
          code,
          status: l.chatId ? "已绑定TG" : "未绑定",
          createdAt: l.createdAt || null,
          activatedAt: l.activatedAt || null,
          chatId: l.chatId || null,
          note: l.note || undefined,
        }));
        return json({ ok: true, total: list.length, revokedTotal: Object.keys(revokedAll).length, licenses: list, usage: "吊销:本接口加 &revoke=<码>;吊销记录存 licenses-revoked(审计)" });
      }
      case "/api/activate": {
        const ok = await isPro(env, url.searchParams.get("code"));
        return json({ ok, error: ok ? undefined : "激活码无效" });
      }
      // Telegram webhook:订户 /start <code> 绑定信号推送
      case "/tg-webhook": {
        if (request.method !== "POST") return new Response("ok");
        // 软校验:带 secret 头但不匹配 → 拒;未带头(重注册前的旧 webhook)暂放行,每日 cron 重注册后恒有头
        const sec = request.headers.get("x-telegram-bot-api-secret-token");
        if (sec && sec !== WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
        const upd = await request.json().catch(() => ({}));
        const msg = upd.message;
        const cfg = await getTgConfig(env);
        if (msg?.chat?.id && cfg) {
          const m = (msg.text || "").match(/\/start\s+(SW-[A-Z0-9]+)/i);
          // 欧美改造(站长 2026-08-08):按 Telegram language_code 双语回复。
          // 未知语言默认中文(存量用户全是中文);站长侧通知永远中文。
          const EN_U = !!(msg.from && msg.from.language_code) && !/^zh/i.test(msg.from.language_code);
          // 购买意向:/buy,或站点「立即购买」按钮带来的 /start buy。必须在免费订阅分支
          // 之前拦截——否则 "/start buy" 会落进无码 /start,买家只收到一句欢迎语,意向就丢了。
          if (/^\/buy\b/i.test(msg.text || "") || /^\/start\s+buy\b/i.test(msg.text || "")) {
            const freeB = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
            if (!freeB.includes(msg.chat.id)) {
              freeB.push(msg.chat.id);
              await env.SUNWATCH_KV.put("free-subs", JSON.stringify(freeB));
            }
            ctx.waitUntil(bumpGrowth(env, "buyRequests"));
            await tgSend({ token: cfg.token, chatId: msg.chat.id }, EN_U
              ? "🧾 <b>SunWatch Pro</b> — <b>" + USDT_MONTH + " USDT / month</b> · <b>" + USDT_YEAR + " USDT / year</b>\n\n"
                + "Includes: every entry zone / stop line / sizing plan · instant alerts when price crosses a trigger · two daily briefs · breaking-signal pushes\n\n"
                + `<b>USDT address</b> (tap to copy):\n<code>${USDT_ADDR}</code>\n`
                + `⚠️ <b>${USDT_CHAIN} only.</b> Funds sent on the wrong chain are <b>unrecoverable</b> — double-check the network before sending.\n\n`
                + "After paying, send the <b>transaction hash (TxID)</b> right here; the operator verifies it on-chain and sends your activation code.\n"
                + "Then send <code>/start YOURCODE</code> to bind real-time signals.\n\n"
                + "Check the record before you decide: " + SITE + "/en/track-record (hits and misses side by side)"
              : "🧾 <b>Pro 会员</b> ¥199/月 · ¥1999/年\n"
              + `USDT 付款:<b>${USDT_MONTH} USDT / 月</b> · <b>${USDT_YEAR} USDT / 年</b>\n\n`
              + "包含:全部买入区间 / 止损线 / 仓位方案 · 价格穿越触发线秒推 · 每日双简报(北京 08:30 / 20:30) · 重要信号快讯\n\n"
              + `<b>收款地址</b>(点一下即可复制):\n<code>${USDT_ADDR}</code>\n`
              + `⚠️ 只走 <b>${USDT_CHAIN}</b>。走错链的资金<b>无法找回</b>,转账前请务必核对网络。\n\n`
              + "付完把<b>交易哈希(TxID)</b>直接发到这里,站长上链核对后给你激活码。\n"
              + "拿到码后发送 <code>/start 激活码</code> 绑定实时信号。\n"
              + "用微信 / 支付宝也可以——直接在这里说一声,站长会发收款码。\n\n"
              + "先看战绩再决定:" + SITE + "/track-record(命中与失误同等展示)", "HTML");
            const who = [msg.chat.username ? "@" + msg.chat.username : null, msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ");
            await tgSend({ token: cfg.token, chatId: cfg.chatId },
              `💰 <b>有人要买 Pro</b>\n对方:${escHtml(who || "(无用户名)")}\nchat_id:<code>${msg.chat.id}</code>\n\n`
              + `对方已拿到 USDT 地址(${USDT_MONTH}/月 · ${USDT_YEAR}/年);付款后他会把 TxID 发过来。\n`
              + `核对无误后回一条 <code>/code ${msg.chat.id}</code> 即可发码。\n`
              + `若他要走微信/支付宝,直接私信发收款码。`, "HTML").catch(() => {});
            return new Response("ok");
          }
          // 站长发码:/code <chat_id> [年]。Telegram 不允许 bot 主动私信陌生人,而买家若没设
          // 用户名,站长根本搜不到这个人——只有 bot 能回那个 chat_id。所以发码这一步交给 bot 代劳。
          //
          // 鉴权刻意做成 fail-closed:必须同时满足「私聊」且「chat.id 等于配置里的站长会话」。
          // 若 TELEGRAM_CHAT_ID 指向的是群/频道,群里任何人的 chat.id 都等于群 id——那样
          // 只判 id 就等于谁都能发码。加上 type === "private" 后,这种情形下本命令直接不生效,
          // 宁可失效也不能误放行。
          if (/^\/code\b/i.test(msg.text || "")
              && msg.chat.type === "private"
              && String(msg.chat.id) === String(cfg.chatId)) {
            const parts = msg.text.trim().split(/\s+/);
            const target = (parts[1] || "").replace(/[^0-9-]/g, "");
            if (!target) {
              await tgSend({ token: cfg.token, chatId: cfg.chatId },
                "用法:<code>/code &lt;chat_id&gt; [年]</code>\n例:<code>/code 123456789</code> 或 <code>/code 123456789 年</code>\nchat_id 见「付款回执待核对」那条通知。", "HTML");
              return new Response("ok");
            }
            const plan = /年|year/i.test(parts[2] || "") ? "年" : "月";
            const code = "SW-" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
            const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
            lic[code] = { createdAt: new Date().toISOString(), chatId: null, note: `${plan}付 · 发给 ${target}` };
            await env.SUNWATCH_KV.put("licenses", JSON.stringify(lic));
            const sent = await tgSend({ token: cfg.token, chatId: target },
              `✅ <b>收到款项,Pro 已开通(${plan}付)</b>\n\n你的激活码:<code>${code}</code>\n\n`
              + `绑定实时信号:直接发送 <code>/start ${code}</code>\n`
              + `解锁网站价位:在 ${SITE}/#pricing 底部输入同一个码。`, "HTML").catch(() => ({ ok: false }));
            await tgSend({ token: cfg.token, chatId: cfg.chatId },
              sent && sent.ok
                ? `✅ 已生成并发给 <code>${escHtml(target)}</code>:<code>${code}</code>(${plan}付)`
                : `⚠️ 码已生成:<code>${code}</code>(${plan}付),但<b>发送给 ${escHtml(target)} 失败</b>——对方可能从未与 bot 对话过。请手动转给他。`, "HTML");
            return new Response("ok");
          }
          // 付款回执:买家把 BSC 交易哈希发进来。**不自动发码**——没有上链核对就发码,
          // 等于任何人贴一串 64 位十六进制就能白嫖。这里只做"转交 + 留痕"。
          if (TXID_RE.test((msg.text || "").trim())) {
            const tx = msg.text.trim().toLowerCase();
            ctx.waitUntil(bumpGrowth(env, "payClaims"));
            // 交易哈希是公开数据:任何人都能从链上抄一条别人的转账贴过来。
            // 所以记下每个哈希首次由谁提交,重复出现时直接给站长打红旗。
            const seen = (await env.SUNWATCH_KV.get("paid-tx", "json")) || {};
            const dup = seen[tx] && String(seen[tx].chatId) !== String(msg.chat.id);
            if (!seen[tx]) {
              seen[tx] = { chatId: msg.chat.id, at: new Date().toISOString() };
              await env.SUNWATCH_KV.put("paid-tx", JSON.stringify(seen));
            }
            await tgSend({ token: cfg.token, chatId: msg.chat.id }, EN_U
              ? "📩 Got your transaction hash. The operator will verify it on-chain and send your activation code here.\nVerification is usually quick; if you hear nothing within a day, just ping this chat."
              : "📩 收到你的交易哈希,站长会上链核对后把激活码发到这里。\n"
              + "核对通常很快;若超过一天没回,直接在这里追问一句即可。", "HTML");
            const who2 = [msg.chat.username ? "@" + msg.chat.username : null, msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" ");
            await tgSend({ token: cfg.token, chatId: cfg.chatId },
              `🧾 <b>付款回执待核对</b>${dup ? "\n🚩 <b>这个哈希此前已由别人提交过——大概率是抄的链上公开交易,核对前先看这一条</b>" : ""}\n`
              + `对方:${escHtml(who2 || "(无用户名)")}\nchat_id:<code>${msg.chat.id}</code>\n`
              + `TxID:<code>${escHtml(tx)}</code>\n`
              + `链上核对:https://bscscan.com/tx/${escHtml(tx)}\n\n`
              + `请确认:① 收款地址是 ${USDT_ADDR} ② 金额 ≥ ${USDT_MONTH}(月)或 ${USDT_YEAR}(年) ③ 交易已确认 ④ 这笔没被用过。\n`
              + `无误后直接回一条:<code>/code ${msg.chat.id}</code>(年付加个「年」),bot 会生成激活码并替你发给他。`, "HTML").catch(() => {});
            return new Response("ok");
          }
          // 无码 /start:注册为免费订户(线索漏斗),每日收预告版
          if (!m && /^\/start/.test(msg.text || "")) {
            const free = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
            if (!free.includes(msg.chat.id)) {
              free.push(msg.chat.id);
              await env.SUNWATCH_KV.put("free-subs", JSON.stringify(free));
            }
            await tgSend({ token: cfg.token, chatId: msg.chat.id }, EN_U
              ? "👋 Welcome! You are subscribed to the free SunWatch daily preview (cycle-stage map + how many trigger lines fired).\n\nThe full version adds specific entry/exit levels, stop lines and real-time trigger alerts → send /buy for Pro (28 USDT/mo)\nPublic track record: https://invest.agiscorecard.com/en/track-record"
              : "👋 欢迎!你已订阅 SunWatch 免费信号预告(每日一条:赛道周期定位 + 当日触发信号数量)。\n\n完整版包含具体买卖价位、止损线、实时触发报警 → 发送 /buy 了解 Pro(¥199/月)\n公开战绩:https://invest.agiscorecard.com/track-record", null);
            return new Response("ok");
          }
          if (!m && /^\/(status|help)/.test(msg.text || "")) {
            const cmd = msg.text.trim().split(/\s/)[0];
            if (cmd === "/status") {
              const lic0 = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
              const isProSub = Object.values(lic0).some((l) => String(l.chatId) === String(msg.chat.id));
              const free0 = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
              const isFree = free0.includes(msg.chat.id);
              const txt = isProSub
                ? (EN_U ? "✨ You are a Pro member: two daily briefs + trigger-line alerts + breaking signals, all included." : "✨ 你是 Pro 会员:每日双简报 + 价格触发报警 + 重要信号快讯全量接收。")
                : isFree
                ? (EN_U ? "🆓 Free subscriber: you get the nightly preview. Upgrade to Pro for specific levels and real-time alerts → send /buy" : "🆓 你是免费订户:每晚收信号预告。升级 Pro 解锁具体价位与实时报警 → 发送 /buy")
                : (EN_U ? "Not subscribed yet. Send /start for the free daily preview." : "你还未订阅。发送 /start 即可免费订阅每日信号预告。");
              await tgSend({ token: cfg.token, chatId: msg.chat.id }, txt, null);
            } else {
              await tgSend({ token: cfg.token, chatId: msg.chat.id }, EN_U
                ? "Commands:\n/start — free daily preview\n/buy — get Pro (payment details in reply)\n/start CODE — bind Pro signals\n/status — subscription status\n/help — this message\nSite: https://invest.agiscorecard.com/en"
                : "可用命令:\n/start — 免费订阅每日预告\n/buy — 购买 Pro(站长私信你付款方式)\n/start 激活码 — 绑定 Pro 信号\n/status — 查询订阅状态\n/help — 本说明\n网站:https://invest.agiscorecard.com", null);
            }
            return new Response("ok");
          }
          if (m) {
            const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
            const code = m[1].toUpperCase();
            if (lic[code] && (!lic[code].chatId || String(lic[code].chatId) === String(msg.chat.id))) {
              lic[code].chatId = msg.chat.id;
              lic[code].activatedAt = new Date().toISOString();
              await env.SUNWATCH_KV.put("licenses", JSON.stringify(lic));
              await tgSend({ token: cfg.token, chatId: msg.chat.id }, "✅ Pro 已激活!你将收到:每日双简报(北京 08:30/20:30)、价格触发线报警、重要信号快讯。", null);
            } else {
              await tgSend({ token: cfg.token, chatId: msg.chat.id }, EN_U
                ? "❌ Invalid activation code, or already bound to another account.\n\nTo buy, send /buy — you'll get payment details and a code."
                : "❌ 激活码无效或已被他人绑定。\n\n要购买请发送 /buy,站长会私信你付款方式并发码。", null);
            }
          }
        }
        return new Response("ok");
      }
      // 一次性自举(仅在无任何激活码时可用,幂等安全):配置 webhook + 生成首个激活码
      case "/api/bootstrap-pro": {
        const cfg = await getTgConfig(env);
        if (!cfg) return json({ ok: false, error: "未配置 Telegram" });
        const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
        if (Object.keys(lic).length) return json({ ok: true, already: true, note: "已初始化过,不再重复" });
        const wh = await fetch(`https://api.telegram.org/bot${cfg.token}/setWebhook?url=${encodeURIComponent(SITE + "/tg-webhook")}`).then((r) => r.json()).catch(() => ({}));
        const code = "SW-" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
        lic[code] = { createdAt: new Date().toISOString(), chatId: null, note: "首个激活码(自举生成)" };
        await env.SUNWATCH_KV.put("licenses", JSON.stringify(lic));
        return json({ ok: true, webhook: wh.ok === true, firstCode: code });
      }
      // 一次性配置:把 bot 的 webhook 指到本 Worker(站长专用)
      case "/api/set-webhook": {
        const cfg = await getTgConfig(env);
        if (!cfg || url.searchParams.get("token") !== cfg.token)
          return json({ ok: false, error: "鉴权失败" });
        const r = await fetch(`https://api.telegram.org/bot${cfg.token}/setWebhook?url=${encodeURIComponent(SITE + "/tg-webhook")}`);
        return json(await r.json().catch(() => ({})));
      }
      case "/api/quotes": {
        const q = (await env.SUNWATCH_KV.get("quotes", "json")) || { at: null, quotes: [] };
        return json(q);
      }
      case "/api/refresh-quotes": {
        const r = await refreshQuotes(env);
        return json(r);
      }
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
        await refreshQuotes(env).catch(() => null);
        const q = (await env.SUNWATCH_KV.get("quotes", "json")) || { quotes: [] };
        // 固定用 SITE:此接口由部署流程经 workers.dev 调用,url.origin 会把旧域名写进推送(站长 8-8 指出)
        const r = await sendTelegram(cfg, buildSummary(items, SITE, null, q.quotes));
        return json(r);
      }
      case "/faq":
        return new Response(renderFaq(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" } });
      case "/track-record":
        return new Response(renderTrackRecord(FORECASTS, PREDICTIONS), { headers: { "content-type": "text/html; charset=utf-8" } });
      case "/feed.xml": {
        const items = ((await env.SUNWATCH_KV.get(KV_KEY, "json")) || []).slice(0, 15);
        const STAGE_CN = { early: "早期信号", mid: "中期主升", peak: "高峰区间", exit: "退潮" };
        const daily = PLAYBOOK.slice(0, 5).map((p) => `${p.theme}:${STAGE_CN[p.stage] || p.stage}`).join(";");
        const today = new Date().toISOString().slice(0, 10);
        const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SunWatch Pro · AI 赛道信号</title><link>${SITE}/</link><description>五大AI赛道周期定位与市场信号(免费预告版)</description>
<item><title>【每日预告 ${today}】${xmlEsc(daily)}</title><link>${SITE}/</link><guid>${SITE}/daily-${today}</guid></item>
${items.map((i) => `<item><title>${xmlEsc(i.title)}</title><link>${xmlEsc(i.link)}</link><guid>${i.id}</guid>${i.published ? `<pubDate>${new Date(i.published).toUTCString()}</pubDate>` : ""}</item>`).join("\n")}
</channel></rss>`;
        return new Response(rss, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
      }
      case `/${INDEXNOW_KEY}.txt`:
        return new Response(INDEXNOW_KEY, { headers: { "content-type": "text/plain" } });
      case "/api/ping-indexnow": {
        const rec = await pingIndexNow(env, allUrls());
        return json(rec);
      }
      case "/robots.txt":
        return new Response("User-agent: *\nAllow: /\nSitemap: https://invest.agiscorecard.com/sitemap.xml\n", { headers: { "content-type": "text/plain" } });
      case "/sitemap.xml": {
        const list = await env.SUNWATCH_KV.list({ prefix: "daily-" }).catch(() => ({ keys: [] }));
        const dailies = list.keys.map((k) => `${SITE}/daily/${k.name.slice(6)}`).slice(-30);
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...allUrls(), SITE + "/daily", ...dailies].map((u) => `<url><loc>${u}</loc><changefreq>daily</changefreq></url>`).join("\n")}\n</urlset>`, { headers: { "content-type": "application/xml" } });
      }
      // 增长度量:CTA 点击计数 → 跳转 bot
      case "/go/tg": {
        ctx.waitUntil(bumpGrowth(env, "tgClicks"));
        return Response.redirect("https://t.me/sunwatchBot", 302);
      }
      // 购买入口。此前定价卡只写"联系站长付款",而全站没有任何联系方式——
      // 买家走到这一步就断了,所以"零成交"从来不是需求证据。现在跳进 bot 的
      // /start buy,由 bot 同时回复买家并通知站长。
      case "/go/buy": {
        ctx.waitUntil(bumpGrowth(env, "buyClicks"));
        return Response.redirect("https://t.me/sunwatchBot?start=buy", 302);
      }
      // Pro 升级点击归因(免费预告 A/B 文案分变体计数):/go/pro?v=<变体id>
      case "/go/pro": {
        const v = (url.searchParams.get("v") || "").slice(0, 2).replace(/[^a-z0-9]/gi, "");
        ctx.waitUntil(bumpGrowth(env, "proClicks"));
        if (v) ctx.waitUntil(bumpGrowth(env, `proClick_${v}`));
        return Response.redirect(SITE + "/#pricing", 302);
      }
      case "/api/growth": {
        const g = (await env.SUNWATCH_KV.get("growth", "json")) || {};
        const free = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
        const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
        const proBound = Object.values(lic).filter((l) => l.chatId).length;
        return json({ pv: g.pv || 0, tgClicks: g.tgClicks || 0, freeSubs: free.length, codesIssued: Object.keys(lic).length, proBound });
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
    const quoteResult = await refreshQuotes(env).catch(() => null);
    const cfg = await getTgConfig(env);
    if (!cfg) return;
    // 价格穿越触发线:实时报警(独立于新闻)
    if (quoteResult && quoteResult.crossings.length) {
      const lines = quoteResult.crossings.map(
        (c) => `🎯 <b>${escHtml(c.name)}</b> ${c.dir === "below" ? "跌破" : "升破"} <b>${escHtml(c.label)}</b>(${c.level})\n现价 ${c.price} → 动作:${escHtml(c.act)}`
      );
      const alertText = `⚡ <b>价格触发</b>\n\n${lines.join("\n\n")}`;
      await sendTelegram(cfg, alertText).catch(() => {});
      await broadcastPro(env, alertText).catch(() => {});
    }
    if (quoteResult && quoteResult.panics && quoteResult.panics.length) {
      const pl = quoteResult.panics.map((p) => `• ${p.name} ${p.changePct}%(恐慌日纪律:分批小仓,批间≥10%回调或≥4周)`);
      const t = `🟢 <b>恐慌买点候选(潜伏池)</b>\n\n${pl.join("\n")}`;
      await sendTelegram(cfg, t).catch(() => {});
      await broadcastPro(env, t).catch(() => {});
    }
    const DAILY = {
      "30 0 * * *": "🌅 早盘简报(美股隔夜复盘 · A/H 开盘前)",
      "30 12 * * *": "🌇 美股开盘前简报(A/H 收盘复盘 · 执行提醒)",
    };
    // 趋势雷达·即时档:强动量/20日突破(48h 冷却,≤2 条,静默降级)
    if (quoteResult) {
      try {
        const strong = quoteTrends((await env.SUNWATCH_KV.get("quotes", "json"))?.quotes).filter((t) => t.strong);
        const picked = await pickTrends(env, strong, { limit: 2, cooldownSec: 172800, prefix: "talert" });
        if (picked.length) {
          const t = `📡 <b>趋势雷达</b>\n\n${picked.map((x) => "• " + x.text).join("\n")}\n\n行动项均为已预登记纪律,非新决策。`;
          await sendTelegram(cfg, t).catch(() => {});
          await broadcastPro(env, t).catch(() => {});
        }
      } catch (e) {}
    }
    if (DAILY[event.cron]) {
      const items = (await env.SUNWATCH_KV.get(KV_KEY, "json")) || [];
      const q = (await env.SUNWATCH_KV.get("quotes", "json")) || { quotes: [] };
      const gLine = await growthLine(env).catch(() => "");
      // 趋势雷达·简报档:三源合并,20h 冷却(两场简报不重复),≤3 条
      let trendLines = [];
      try {
        const cands = [...quoteTrends(q.quotes), ...feedTrends(items), ...(await siteTrends())];
        trendLines = (await pickTrends(env, cands, { limit: 3, cooldownSec: 72000, prefix: "tbrief" })).map((x) => "• " + x.text);
      } catch (e) {}
      const text = buildSummary(items, "https://invest.agiscorecard.com", DAILY[event.cron], q.quotes, trendLines);
      await sendTelegram(cfg, text + (gLine ? `\n\n${gLine}` : "")).catch(() => {}); // 站长版含增长数据
      await broadcastPro(env, text).catch(() => {}); // 订户版不含
      // 免费订户:仅晚间发预告版(周期定位+被锁信号数,升级CTA)
      if (event.cron === "30 12 * * *") {
        await broadcastFree(env, buildTeaser(q.quotes)).catch(() => {});
      }
      // 早间:保存每日复盘快照(内容飞轮:站点每天自动+1个可收录页面)
      if (event.cron === "30 0 * * *") {
        const today = new Date().toISOString().slice(0, 10);
        const STAGE_CN = { early: "早期信号", mid: "中期主升", peak: "高峰区间", exit: "退潮" };
        const snapshot = {
          date: today,
          stages: PLAYBOOK.map((p) => ({ theme: p.theme, stage: STAGE_CN[p.stage] || p.stage, note: p.stageNote })),
          movers: (q.quotes || []).filter((x) => Math.abs(x.changePct) >= 2).slice(0, 8).map((x) => ({ name: x.name, pct: x.changePct })),
          headlines: items.slice(0, 6).map((i) => ({ title: i.title, link: i.link })),
        };
        await env.SUNWATCH_KV.put(`daily-${today}`, JSON.stringify(snapshot)).catch(() => {});
        // webhook 自愈重注册(带 secret_token,幂等)
        await fetch(`https://api.telegram.org/bot${cfg.token}/setWebhook?url=${encodeURIComponent(SITE + "/tg-webhook")}&secret_token=${WEBHOOK_SECRET}`).catch(() => {});
        // IndexNow:全站 URL + 今日新页(429/5xx 自动重试,状态入 KV 供简报健康度)
        await pingIndexNow(env, [...allUrls(), `${SITE}/daily/${today}`, `${SITE}/daily`]).catch(() => {});
      }
    } else if (result.important.length) {
      // 30 分钟轮询:仅命中重要信号时额外推送
      const text = buildAlert(result.important);
      await sendTelegram(cfg, text).catch(() => {});
      await broadcastPro(env, text).catch(() => {});
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

// ---- 实时行情引擎(Yahoo Finance chart API) ----

async function refreshQuotes(env) {
  const prev = (await env.SUNWATCH_KV.get("quotes", "json")) || { quotes: [] };
  const prevMap = Object.fromEntries(prev.quotes.map((q) => [q.symbol, q]));
  const results = await Promise.allSettled(WATCHLIST.map((w) => fetchQuote(w)));
  const quotes = [];
  const crossings = [];
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const q = r.value;
    quotes.push(q);
    const prevQ = prevMap[q.symbol];
    const w = WATCHLIST.find((x) => x.symbol === q.symbol);
    if (!prevQ || !w) continue;
    for (const lv of w.levels) {
      const crossedBelow = lv.dir === "below" && prevQ.price > lv.price && q.price <= lv.price;
      const crossedAbove = lv.dir === "above" && prevQ.price < lv.price && q.price >= lv.price;
      if (crossedBelow || crossedAbove) {
        crossings.push({ name: w.name, dir: lv.dir, label: lv.label, level: lv.price, price: q.price, act: lv.act });
      }
    }
  }
  const payload = { at: new Date().toISOString(), quotes };
  await env.SUNWATCH_KV.put("quotes", JSON.stringify(payload));
  // 恐慌买点候选:潜伏池标的单日 ≤ -5%(『只在恐慌日买』纪律的自动执行器);当日去重
  const panics = [];
  for (const q of quotes) {
    const w = WATCHLIST.find((x) => x.symbol === q.symbol);
    if (w && w.group === "潜伏池" && q.changePct <= -5) {
      const key = `panic-${q.symbol}-${new Date().toISOString().slice(0, 10)}`;
      if (!(await env.SUNWATCH_KV.get(key))) {
        await env.SUNWATCH_KV.put(key, "1", { expirationTtl: 172800 });
        panics.push(q);
      }
    }
  }
  return { count: quotes.length, crossings, panics };
}

async function fetchQuote(w) {
  // interval=1d & range=1y:一次调用同时拿到 ①真昨收(倒数第二根日线收盘)
  // ②52 周高低点(v8 meta 不带 fiftyTwoWeek 字段,2026-08-07 实测为空,须自算)。
  // 教训链:range=5d 时代的 chartPreviousClose 是 5 天前收盘,"日涨幅"虚高;
  // 改 1wk 后 meta 又没有昨收字段,全表 0%——日线全年是唯一两全的粒度。
  const resp = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(w.symbol)}?interval=1d&range=1y`,
    { headers: { "user-agent": "Mozilla/5.0 (sunwatch)" } }
  );
  if (!resp.ok) return null;
  const result = (await resp.json())?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta || !meta.regularMarketPrice) return null;
  const price = meta.regularMarketPrice;
  let prevClose = meta.regularMarketPreviousClose || null;
  let hi52 = null, lo52 = null, chg5dPct = null, newHigh20 = false, newLow20 = false;
  try {
    const q = result.indicators.quote[0];
    const closes = (q.close || []).filter((v) => v != null);
    // 最后一根日线是今天(盘中=现价),昨收取倒数第二根;停牌等边缘情况回退到最后一根。
    if (!prevClose && closes.length >= 2) prevClose = closes[closes.length - 2];
    if (!prevClose && closes.length) prevClose = closes[closes.length - 1];
    const his = (q.high || []).filter((v) => v != null);
    const los = (q.low || []).filter((v) => v != null && v > 0);
    if (his.length) hi52 = Math.max(...his, price);
    if (los.length) lo52 = Math.min(...los, price);
    // 趋势雷达用:5 日动量 + 20 日突破(今天以外的最近 20 根收盘为基准)
    if (closes.length >= 7) {
      const base5 = closes[closes.length - 6];
      if (base5) chg5dPct = Math.round(((price - base5) / base5) * 1000) / 10;
    }
    if (closes.length >= 21) {
      const win = closes.slice(-21, -1);
      newHigh20 = price > Math.max(...win);
      newLow20 = price < Math.min(...win);
    }
  } catch (e) {}
  if (!prevClose) prevClose = price;
  return {
    symbol: w.symbol,
    name: w.name,
    group: w.group,
    price,
    changePct: prevClose ? Math.round(((price - prevClose) / prevClose) * 1000) / 10 : 0,
    fromLowPct: lo52 ? Math.round(((price - lo52) / lo52) * 100) : null,
    offHighPct: hi52 ? Math.round(((price - hi52) / hi52) * 100) : null,
    chg5dPct, newHigh20, newLow20,
    currency: meta.currency || "",
    at: new Date().toISOString(),
  };
}

// ---- 趋势雷达(涌现引擎,2026-08-08 站长指令) ----
// 三个信号源:①行情动量(5日/20日突破) ②新闻标签加速 ③网站需求(agiscorecard D1 聚合)。
// 铁规:行动项只引用已预登记的纪律,趋势永远不发明新交易;每条趋势 KV 冷却去重防轰炸;
// 任一信号源失败静默降级,绝不打断简报。
const TREND_ACTIONS = [
  [/存储|光通信/, "顶区纪律:不追;持有者反弹分批派发;若涉证伪线由触发系统另行报警"],
  [/潜伏|机器人/, "恐慌日分批小仓纪律(涨停禁买);8-19 前宇树禁买窗生效"],
  [/太空/, "顶部回避判定(信心52%):不追;SPCX $135 周线线由系统盯守"],
  [/加密|孙宇晨/, "事件窗口短线纪律;杠杆品仅事件窗,严禁长持"],
];
const trendAction = (group) => (TREND_ACTIONS.find(([re]) => re.test(group || "")) || [null, "观察位:只拿读数,无预登记动作,不动钱"])[1];

function quoteTrends(quotes) {
  const out = [];
  for (const q of quotes || []) {
    const parts = [];
    if (q.chg5dPct != null && Math.abs(q.chg5dPct) >= 12) parts.push(`5日${q.chg5dPct > 0 ? "+" : ""}${q.chg5dPct}%`);
    if (q.newHigh20) parts.push("创20日新高");
    if (q.newLow20) parts.push("创20日新低");
    if (!parts.length) continue;
    const strong = Math.abs(q.chg5dPct || 0) >= 18 || ((q.newHigh20 || q.newLow20) && Math.abs(q.chg5dPct || 0) >= 12);
    out.push({ key: `q-${q.symbol}-${q.newLow20 ? "lo" : q.newHigh20 ? "hi" : "mo"}`, strong,
      text: `[市场] ${q.name} ${parts.join("·")} → ${trendAction(q.group)}` });
  }
  return out;
}

function feedTrends(items) {
  // 标签热度加速:近 24h 条数 ≥3 且 > 前 6 天日均 2 倍(自检:样本太小不叫趋势)
  const now = Date.now(), day = 86400000;
  const n24 = {}, n7 = {};
  for (const i of items || []) {
    const t = Date.parse(i.published || "") || 0;
    if (!t || now - t > 7 * day) continue;
    for (const tag of i.tags || []) {
      if (tag === "其他") continue;
      if (now - t <= day) n24[tag] = (n24[tag] || 0) + 1;
      else n7[tag] = (n7[tag] || 0) + 1;
    }
  }
  return Object.entries(n24)
    .filter(([tag, n]) => n >= 3 && n > 2 * ((n7[tag] || 0) / 6))
    .slice(0, 2)
    .map(([tag, n]) => ({ key: `f-${tag}`, strong: false,
      text: `[新闻] 「${tag}」24h 内 ${n} 条,热度加速 → 读要闻;若触及在档判断的证伪条件,当日红队复审(第7层)` }));
}

async function siteTrends() {
  try {
    const r = await fetch("https://agiscorecard.com/api/trends", { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const d = await r.json();
    const out = [];
    for (const z of (d.zeroResults || []).slice(0, 2))
      out.push({ key: `s-zero-${z.label}`, strong: false,
        text: `[网站] 搜索「${escHtml(z.label)}」零结果 ×${z.n} → 产品缺口已捕捉,内容机器排产(选题一级种子)` });
    for (const p of (d.risingPages || []).slice(0, 2))
      out.push({ key: `s-rise-${p.path}`, strong: false,
        text: `[网站] ${escHtml(p.path)} 周流量 ${p.prev}→${p.h} 翻倍 → 检查该页工具漏斗与订阅钩子是否到位` });
    return out;
  } catch (e) { return []; }
}

// dedupe: 简报 20h 冷却(两场简报不重复喊同一条),即时警报 48h 冷却
async function pickTrends(env, cands, { limit, cooldownSec, prefix }) {
  const out = [];
  for (const c of cands) {
    if (out.length >= limit) break;
    const key = `${prefix}-${c.key}`;
    if (await env.SUNWATCH_KV.get(key)) continue;
    await env.SUNWATCH_KV.put(key, "1", { expirationTtl: cooldownSec });
    out.push(c);
  }
  return out;
}

// 重要信号即时推送
function buildAlert(items) {
  const lines = items.slice(0, 5).map(
    (i) => `🚨 <b>[${i.signal}]</b> <a href="${escAttr(i.link)}">${escHtml(i.title).slice(0, 100)}</a>`
  );
  return `⚡ <b>SunWatch 重要信号</b>\n\n${lines.join("\n")}\n\n对照操盘纪律执行,详见监控台核心信号清单。`;
}

// 增长计数(低频写,容忍并发损耗)
async function bumpGrowth(env, key) {
  const g = (await env.SUNWATCH_KV.get("growth", "json")) || {};
  g[key] = (g[key] || 0) + 1;
  await env.SUNWATCH_KV.put("growth", JSON.stringify(g));
}

async function growthLine(env) {
  const g = (await env.SUNWATCH_KV.get("growth", "json")) || {};
  const free = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
  const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
  const proBound = Object.values(lic).filter((l) => l.chatId).length;
  const idx = (await env.SUNWATCH_KV.get("indexnow-status", "json")) || null;
  const idxTxt = idx ? (idx.ok ? ` | 收录✅${idx.status}(${idx.at.slice(5, 10)})` : ` | 收录⚠️${idx.status || "网络失败"}×${idx.attempts}`) : "";
  const ab = ["a", "b", "c"].map((v) => `${v}:${g[`proClick_${v}`] || 0}`).join("/");
  const abTxt = (g.proClicks || 0) ? ` | Pro点击 ${g.proClicks}(A/B ${ab})` : "";
  // 购买按钮 vs 实际询价要分开看:结账断掉时两者会劈叉,而"零成交"再也不能被
  // 误读成"没需求"——这正是 2026-08-06 之前发生的事。
  const buyTxt = (g.buyClicks || g.buyRequests || g.payClaims)
    ? ` | 购买按钮 ${g.buyClicks || 0}→询价 ${g.buyRequests || 0}→付款回执 ${g.payClaims || 0}` : "";
  return `📊 <b>增长</b>:累计PV ${g.pv || 0} | CTA点击 ${g.tgClicks || 0} | 免费订户 ${free.length} | 已发码 ${Object.keys(lic).length} | Pro绑定 ${proBound}${abTxt}${buyTxt}${idxTxt}`;
}

// IndexNow 提交(429/5xx/网络错误退避重试 ≤2 次),最近状态写 KV `indexnow-status` 供简报健康度展示
async function pingIndexNow(env, urlList) {
  // host 必须与 urlList 的域一致(IndexNow 协议),2026-08-08 随并域改造切新域
  const payload = JSON.stringify({ host: "invest.agiscorecard.com", key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList });
  let status = 0;
  let attempts = 0;
  for (const wait of [0, 1000, 3000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    attempts++;
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: payload,
    }).catch(() => null);
    status = r ? r.status : 0;
    if (status === 200 || status === 202) break;
    if (status && status !== 429 && status < 500) break; // 非429的4xx是请求问题,重试无意义
  }
  const rec = { at: new Date().toISOString(), status, ok: status === 200 || status === 202, attempts, urls: urlList.length };
  await env.SUNWATCH_KV.put("indexnow-status", JSON.stringify(rec)).catch(() => {});
  return rec;
}

// ---- Pro 会员工具 ----

async function isPro(env, code) {
  if (!code) return false;
  const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
  return !!lic[String(code).toUpperCase()];
}

// 免费层脱敏:保留赛道分析与周期定位,隐藏具体价位/触发线/操盘纪律
function redact(full) {
  const LOCK = "🔒 Pro 会员可见";
  return {
    ...full,
    watchlist: full.watchlist.map((w) => ({ ...w, levels: [] })),
    playbook: full.playbook.map((p) => ({
      ...p,
      stages: Object.fromEntries(Object.entries(p.stages).map(([k, v]) => [k, { ...v, signals: v.signals, tickers: LOCK }])),
      tactics: LOCK,
    })),
    coreSignals: full.coreSignals.map((s, i) => `🔒 信号 ${i + 1}(Pro 可见)`),
    actions: full.actions.map((a) => ({ until: a.until, text: "🔒 Pro 会员可见" })),
    stocks: full.stocks.map((s) => ({ ...s, logic: s.logic, risk: s.risk, fund: s.fund ? { ...s.fund, mcap: s.fund.mcap, val: LOCK, inv: LOCK, moat: s.fund.moat, comp: s.fund.comp } : s.fund })),
  };
}

// 广播给所有已绑定的 Pro 订户(不含站长,站长走原通道)
async function broadcastPro(env, text) {
  const cfg = await getTgConfig(env);
  if (!cfg) return 0;
  const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
  const chatIds = [...new Set(Object.values(lic).map((l) => l.chatId).filter(Boolean))].filter((id) => String(id) !== String(cfg.chatId));
  let sent = 0;
  for (const chatId of chatIds) {
    const r = await sendTelegram({ token: cfg.token, chatId }, text).catch(() => null);
    if (r && r.ok) sent++;
  }
  return sent;
}

// 免费订户广播(线索漏斗:预告版+升级CTA)
async function broadcastFree(env, text) {
  const cfg = await getTgConfig(env);
  if (!cfg) return 0;
  const free = (await env.SUNWATCH_KV.get("free-subs", "json")) || [];
  const lic = (await env.SUNWATCH_KV.get("licenses", "json")) || {};
  const proIds = new Set(Object.values(lic).map((l) => String(l.chatId)).filter(Boolean));
  let sent = 0;
  for (const chatId of free) {
    if (proIds.has(String(chatId)) || String(chatId) === String(cfg.chatId)) continue;
    const r = await sendTelegram({ token: cfg.token, chatId }, text).catch(() => null);
    if (r && r.ok) sent++;
  }
  return sent;
}

function buildTeaser(quotes) {
  const STAGE_CN = { early: "早期信号", mid: "中期主升", peak: "高峰区间", exit: "退潮" };
  const stages = PLAYBOOK.slice(0, 5).map((p) => `• ${p.theme}:<b>${STAGE_CN[p.stage] || p.stage}</b>`);
  const movers = (quotes || []).filter((q) => Math.abs(q.changePct) >= 3).slice(0, 3)
    .map((q) => `• ${q.name} ${q.changePct > 0 ? "+" : ""}${q.changePct}%`);
  const lockedCount = CORE_SIGNALS.length + WATCHLIST.reduce((n, w) => n + w.levels.length, 0);
  const v = pickTeaserVariant(lockedCount);
  return [
    `🔭 <b>SunWatch 每日预告</b> ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `📈 赛道周期定位:`,
    ...stages,
    ...(movers.length ? [``, `💹 今日异动:`, ...movers] : []),
    ``,
    `🔒 今日 <b>${lockedCount}</b> 条核心信号与触发线状态为 Pro 内容(具体买卖价位/止损/仓位/实时报警)`,
    `${v.text}${SITE}/go/pro?v=${v.id}`,
    `公开战绩:${SITE}/track-record`,
  ].join("\n");
}

// 免费预告升级 CTA 的 A/B 文案变体(按 UTC 年内天数确定性轮换,便于分变体归因点击)
const TEASER_CTA_VARIANTS = [
  { id: "a", text: (n) => `升级 Pro 解锁具体买卖价位与实时触发报警 → ` },
  { id: "b", text: (n) => `别在触发点错过一秒:Pro 价格穿线即时秒报 → ` },
  { id: "c", text: (n) => `今日 ${n} 条触发线已在盯守,升级 Pro 看具体价位 → ` },
];
function pickTeaserVariant(lockedCount) {
  const now = new Date();
  const doy = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  const v = TEASER_CTA_VARIANTS[doy % TEASER_CTA_VARIANTS.length];
  return { id: v.id, text: v.text(lockedCount) };
}

// ---- 监控结论摘要 ----

function buildSummary(items, origin, label, quotes, trendLines) {
  const today = new Date().toISOString().slice(0, 10);
  // 【今日要做】来自 ACTION_QUEUE(过期自动隐藏)
  const actions = ACTION_QUEUE.filter((a) => a.until >= today).slice(0, 3).map((a, i) => `${i + 1}. ${escHtml(a.text)}`);
  // 【风险灯】五赛道一行
  const LIGHT = { early: "🟢", mid: "🟡", peak: "🔴", exit: "⚫" };
  const SHORT = { "存储": "存储", "物理AI": "物理AI", "能源/核电": "能源", "加密/稳定币": "加密", "TRON直接线": "TRON" };
  const lights = PLAYBOOK.filter((p) => SHORT[p.theme]).map((p) => `${SHORT[p.theme]}${LIGHT[p.stage] || "⚪"}`).join(" ");
  // 【异动】|±3%| 以上,最多5条
  const movers = (quotes || []).filter((q) => Math.abs(q.changePct) >= 3)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5)
    .map((q) => `• ${q.name} ${q.changePct > 0 ? "+" : ""}${q.changePct}%`);
  // 【今日操作】按市场分组(站长 8-8:必须明确"今天能不能买/卖、买卖什么、为什么",
  // 且美/港/A 股开盘时间不同——早简报是 A/H/韩的盘前,晚简报是美股的盘前)。
  // "可执行" = 价格已穿越预登记触发线(act 字段就是为什么);没穿越就明说"不动"。
  const qm = Object.fromEntries((quotes || []).map((x) => [x.symbol, x]));
  const marketOf = (s) => /\.S[SZ]$/.test(s) ? "A股" : /\.HK$/.test(s) ? "港股" : /\.KS$/.test(s) ? "韩股" : "美股";
  const OPEN_NOTE = { "A股": "09:30 开盘", "港股": "09:30 开盘", "韩股": "08:00 开盘", "美股": "21:30 开盘(夏令)" };
  const actByMkt = { "A股": [], "港股": [], "韩股": [], "美股": [] };
  const near = [];
  for (const w of WATCHLIST) {
    const q = qm[w.symbol];
    if (!q) continue;
    for (const lv of w.levels) {
      const crossed = (lv.dir === "below" && q.price <= lv.price) || (lv.dir === "above" && q.price >= lv.price);
      if (crossed) {
        actByMkt[marketOf(w.symbol)].push(`• ${w.name} ${fmtPrice(q.price)} 已${lv.dir === "below" ? "跌破" : "站上"}${escHtml(lv.label)} ${fmtPrice(lv.price)} → <b>${escHtml(lv.act || "按预登记纪律执行")}</b>`);
        continue;
      }
      const dist = Math.abs((lv.price - q.price) / q.price) * 100;
      near.push({ dist, line: `• ${w.name} ${fmtPrice(q.price)} → ${escHtml(lv.label)} ${fmtPrice(lv.price)}(差${dist.toFixed(1)}%)` });
    }
  }
  near.sort((a, b) => a.dist - b.dist);
  // 场次感知:早简报(北京 08:30)先讲 A/H/韩的今天,美股给预告;晚简报(20:30)反过来。
  const isMorning = /早盘/.test(label || "");
  const isEvening = /美股开盘前/.test(label || "");
  const sessionMkts = isMorning ? ["韩股", "A股", "港股"] : isEvening ? ["美股"] : ["A股", "港股", "韩股", "美股"];
  const laterMkts = isMorning ? ["美股"] : isEvening ? ["A股", "港股", "韩股"] : [];
  const opsLines = [];
  for (const m of sessionMkts) {
    opsLines.push(`【${m} · ${OPEN_NOTE[m]}】`);
    if (actByMkt[m].length) opsLines.push(...actByMkt[m]);
    else opsLines.push("• 无触发线穿越 → <b>今天不动</b>(买卖只在预登记触发响起时发生)");
  }
  for (const m of laterMkts) {
    const n = actByMkt[m].length;
    opsLines.push(`【${m} · ${OPEN_NOTE[m]}】${n ? `已有 ${n} 条触发待执行,详见${isMorning ? "今晚 20:30" : "明晨 08:30"}简报` : `无触发,${isMorning ? "今晚 20:30" : "明晨 08:30"}简报确认`}`);
  }
  // 心跳检查(7-17~19 循环中断 3 天的教训,台账 2026-07-13 miss 条目明文要求):
  // 行情由 30 分钟 cron 持续刷新,快照最新时间落后 >2.5h = 抓取循环大概率断了,
  // 静默的断链和"没有新信号"在读者眼里一模一样——所以必须在简报里喊出来。
  const newestAt = Math.max(0, ...(quotes || []).map((q) => Date.parse(q.at || "") || 0));
  const staleH = newestAt ? (Date.now() - newestAt) / 3600000 : Infinity;
  const heartbeat = staleH > 2.5
    ? [`⚠️ <b>心跳异常</b>:行情数据${isFinite(staleH) ? `已 ${staleH.toFixed(1)} 小时未刷新` : "为空"},抓取循环可能中断——检查 Cloudflare cron 与 Actions`, ``]
    : [];
  return [
    `🔭 <b>SunWatch</b> ${today}${label ? " · " + label.replace(/(简报|[()·]|美股隔夜复盘|A\/H 开盘前|A\/H 收盘复盘|执行提醒|\s)/g, "") : ""}`,
    ``,
    ...heartbeat,
    `🎯 <b>今日操作</b>(能不能买卖、买卖什么、为什么)`,
    ...opsLines,
    ``,
    `📌 <b>今日要做</b>`,
    ...(actions.length ? actions : ["今日无必做动作,持仓按兵不动"]),
    ``,
    `🚦 ${lights}`,
    ...((trendLines && trendLines.length) ? [``, `📡 <b>趋势雷达 → 行动</b>(行动项=已预登记纪律)`, ...trendLines] : []),
    ...(movers.length ? [``, `💹 <b>异动</b>`, ...movers] : []),
    ...(near.length ? [``, `⏳ <b>最近触发线(未穿越,继续等)</b>`, ...near.slice(0, 3).map((n) => n.line)] : []),
    ``,
    `详情与全部信号:${origin}`,
    `📊 战绩:${origin}/track-record · 🧭 方法论:${origin}/method`,
    `🌐 同网络:agiscorecard.com(AGI 证据层) · compass.agiscorecard.com(13F 罗盘)`,
  ].join("\n");
}

// ---- Telegram 推送 ----

// 配置优先级:Cloudflare secrets(TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)> KV(/api/setup-telegram 写入)
async function getTgConfig(env) {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)
    return { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID };
  return (await env.SUNWATCH_KV.get("tg-config", "json")) || null;
}

// 长消息按行分段(行内 HTML 标签完整,行边界切分不会截断标签);
// 单段解析失败时剥离标签降级纯文本重发,保证必达。
async function sendTelegram(cfg, text) {
  const chunks = splitByLines(text, 3500);
  let last = null;
  for (const chunk of chunks) {
    last = await tgSend(cfg, chunk, "HTML");
    if (!last.ok && /parse entities/i.test(last.description || "")) {
      last = await tgSend(cfg, chunk.replace(/<[^>]+>/g, ""), null);
    }
    if (!last.ok) break;
  }
  return { ok: !!(last && last.ok), parts: chunks.length, status: last?.status, description: last?.description };
}

function splitByLines(text, max) {
  const chunks = [];
  let cur = "";
  for (const line of text.split("\n")) {
    const ln = line.length > max ? line.slice(0, max) : line;
    if (cur && cur.length + 1 + ln.length > max) {
      chunks.push(cur);
      cur = ln;
    } else {
      cur = cur ? cur + "\n" + ln : ln;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : [""];
}

async function tgSend(cfg, text, mode) {
  const resp = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: cfg.chatId,
      text: text.slice(0, 4000),
      ...(mode ? { parse_mode: mode } : {}),
      disable_web_page_preview: true,
    }),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok && body.ok === true, status: resp.status, description: body.description };
}

function xmlEsc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtPrice(p) {
  return p >= 10000 ? Math.round(p).toLocaleString("en-US") : p >= 100 ? p.toFixed(1) : p.toFixed(2);
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
