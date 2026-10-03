# sunPredition 项目记忆(每次会话必读)

## 核心工作协议:先生成 PROMPT,再执行

**用户的每个任务请求,必须按以下两步处理:**

1. **先生成并完善 PROMPT 并写入记忆**:把用户的原始请求扩写为结构化任务描述(目标、需实时核实的数据、执行步骤、交付物、验证方式),**追加写入仓库 `PROMPTS.md`(随代码一起 commit)**,展示给用户后立即执行(不等确认,除非有真歧义)。
   - 增长事项可自主决策执行(用户已授权"自主安装技能、实现营销增长,不依赖用户"),涉及对外发布/收费变更仍需告知。
2. **再执行任务**:按 PROMPT 逐项完成,结论写入系统(见下),通过部署流水线推送到用户 Telegram。

## 项目是什么

SunWatch:孙宇晨预判监控 + 跨市场(美/港/A)投资执行系统。
- 线上地址:https://invest.agiscorecard.com(Cloudflare Worker `sunwatch`;旧地址 sunwatch.tuoqiantu.workers.dev 继续可用)
- 部署:推送到分支 `claude/sun-yuchen-investment-research-yzz9mx` 自动触发 GitHub Actions 部署(secret `CLOUDFLARE_API_TOKEN` 已配置),部署后自动推送 TG 摘要(兼部署通知)
- 数据层:`src/data.js`(PREDICTIONS 孙宇晨档案 / STOCKS 标的卡 / PLAYBOOK 操盘框架 / CORE_SIGNALS 核心信号 / IMPORTANT_RULES 快讯规则 / WATCHLIST 实时行情触发线 / FORECASTS 自我预测档案)
- 行情:Yahoo Finance 每 30 分钟刷新,价格穿越 WATCHLIST 触发线 → TG 秒报
- TG:每日北京 08:30 / 20:30 双简报(cron `30 0 * * *` 与 `30 12 * * *`,UTC);长消息自动分段(勿再出现截断 HTML 的 bug)
- 定时任务(claude-code-remote triggers,2026-07-20 重建——旧 trigger 曾全部丢失致循环中断 7/17-19,教训:每轮顺手 list_triggers 核对心跳):每周一 05:00 UTC 存储清仓周检(trig 见下次周检记录);**每日 02:00 UTC(北京10:00)自主优化循环(trig_01PiwKEKQsJXDDkueQ8yKXGi,从 BACKLOG.md 取件,用户已授权全程自主决策不询问)**;一次性任务按事件另设

## 铁律(教训换来的)

1. **所有价格/市值/估值必须当场 WebSearch 核实并标注日期**——2026-07-05 曾因引用 6 月峰值数据在崩盘后给出错误情景权重(已记入 FORECASTS 失误档案)。
2. **每次明确判断必须写入 FORECASTS 建档**,命中与失误同等展示;错了就在档案里写明教训。
3. **不做"预测",做"触发执行"**:判断写成"若价格穿越 X 则做 Y"并加入 WATCHLIST,让机器盯守。
4. 结论必须落到 `CORE_SIGNALS`(带日期标注)→ commit → push → 部署自动推 TG;聊天里说了但没入库 = 没做。
5. 沙箱出网受限:workers.dev / 多数财经站直连 403,验证线上状态用 GitHub Actions 冒烟测试日志;GitHub MCP 的 actions_list 结果过大时用 python 解析保存的文件。
6. 免责声明:所有产出为研究框架,非投资建议。

## 机械执行层(2026-09-10 上线,站长指令:「机械式而不是代情绪」)

- 代码:`src/rules.js`(纯算术,无 I/O)+ `test/rules.test.mjs`(26 条离线断言,进 CI)。
  面:简报最前面的【持仓执行】段 · `/api/holdings`(原始读数)· `/rules`(参数表)。
- 数据不新增:`fetchQuote` 早就在拉 `interval=1d&range=1y`,均线/ATR/唐奇安全部从
  这份已有的日线里算,**零新增网络请求**。
- **三条不许放松的约束**(每一条都是为了把情绪挡在外面):
  1. **不看成本价。** 输入只有价格序列。系统一旦知道站长套了多少,「等回本再走」就有了入口。
  2. **参数写死并在 `/rules` 公开。** 事后调参去迎合已经发生的行情,是最隐蔽的一种自欺;
     公开了才会有人对得出来。
  3. **只在规则状态翻转时推送**(KV `hold-state-<symbol>`,首次运行只建基线)。
     每 30 分钟重复推同一个「持有」会把人训练成无视通知,而无视通知之后接管决策的就是情绪。
- **判定一律落在最后一根走完的日线**,盘中价只用于算「距离还有多远」。
  首次部署实测暴露过:措辞是「收盘 < X」却在盘中判定,港股 13:58 触发的清仓收盘前可能自己收回。
- **两个被单元测试抓出来的真 bug,别再犯**:
  ① 唐奇安通道曾把**今天**算进窗口 → 「跌破 N 日最低」在直线下跌里永远不成立(今天自己
     就是那个最低),R1 清仓与 R5 加仓都是死代码。经典形态用今天的收盘比**此前** N 根的极值。
  ② ATR 必须先 `alignBars` 把 high/low/close 按同一组下标对齐再算;停牌的 null 会把不同
     交易日的字段配到一起,**不报错,只算出一个看起来很合理的错数字**。
- **没有回测,也不要伪造一个。** 沙箱直连财经站 403(铁律 5),拿不到历史就不声称任何历史
  表现。这套东西是执行纪律,不是收益承诺;机械不等于正确,只等于可复算、可审计。
- 杠杆品(`lev>1`,当前只有 7709.HK)走收紧的 L 系规则梯且**没有加仓项**——每日重置,
  横盘本身就损耗净值,与 CLAUDE.md 原有的「杠杆品仅事件窗,严禁长持」一致。

## 用户背景(操盘相关)

- 持仓涉及:美股存储(派发中,SKHY 事件驱动)、港股 7709(两倍海力士,重点标的)、关注物理AI建仓(优必选/潜伏池)
- 关键日程:SKHY 已于 2026-07-10 挂牌($149 发行/首日收 $168);上市周(7/13-17)执行第二段派发降至 1/3 底仓;MU 财报 9 月下旬;宇树科创板挂牌在即
- 用户偏好:结论先行、给具体价位和仓位、诚实认错、TG 触达确认


## AGI twelve-stock portfolio owner alerts (2026-10-03)

`src/portfolio-alerts.js` exposes `PortfolioAlerts`, bound by `PORTFOLIO_ALERTS` to a SQLite-backed Durable Object. Existing 30-minute cron reads `https://agiscorecard.com/api/portfolio` before unrelated feed refresh. Fixed cohort `social-basket-2026-10-02-close`, October 2 NY close, twelve stocks vs SPY/QQQ/TQQQ; no personal trading and no copy of return calculations. Initial baseline, new complete valuation and actual source correction send only to the already configured owner chat, never free/pro subscribers.

Serial durable delivery state, successful Telegram message ID before acknowledgement, retry on failure. One warning per outage after 25-minute grace, one recovery. A crash between external acknowledgement and durable persistence may duplicate; do not claim exactly-once. `/portfolio` reads, `/portfolio_pause` and `/portfolio_resume` control owner alerts; all require verified webhook header, private chat and configured owner chat match. `POST /api/portfolio-alerts?action=run|status` reuses existing owner integration Bearer authentication for verification, no arbitrary messages/recipients. Never print tokens, chat IDs or webhook secrets.

## SEC evidence monitor (2026-10-03)

`src/research-monitor.js` / `RESEARCH_MONITOR` collect SEC submissions for the fixed twelve-stock cohort on existing cron. `/research` and `/en/research` render server-side evidence; `/api/research` is public metadata. Bounded `POST /api/research-refresh` collects without sending Telegram. First observations are historical baselines; only unseen, non-backfilled accessions enter the durable owner outbox. Failed source checks retain evidence; failed delivery retains pending ids. The external Telegram acknowledgement and storage are not atomic; do not claim exactly-once delivery.

`/research`, `/research_pause`, `/research_resume` require authenticated private owner updates. Webhook authentication now derives from the private bot token (or `TELEGRAM_WEBHOOK_SECRET` env), with automatic registration; never reintroduce public source constants or missing-header bypasses. Public refresh cannot choose a recipient, send text, pause/resume or invoke the delivery action.

Legacy `CORE_SIGNALS` gain review metadata and pending-review labels; publication dates are not fresh reviews. SEC filing metadata does not establish financial deltas, guidance changes or buy/sell direction. No portfolio baseline/price-rule changes, no customer broadcasts or paid data subscriptions. Source polling is bounded to one collection per 20 minutes, with one request at a time spaced by 250 ms. `SEC_USER_AGENT` may supply an operator contact identifier. Test via `node test/research-monitor.test.mjs`; live smoke via `node test/research-live.mjs` (no message sends).


## Official company announcement sources (2026-10-03 23:02 CST)

Default research collection now uses `src/official-ir.js`: ten company-owned RSS feeds, Tesla’s company-authorized Business Wire RSS, and the public Palantir IR JSON endpoint used by its own site. Revision `official-ir-v2`, same durable object and existing cron; no email or paid account required. SEC collection remains paused; retain the 60 verified SEC filings separately in `sec_archive`. Never describe company press releases as complete regulatory filing coverage. Keep date-only PLTR releases date-only; same-baseline-day inserts remain silent. Tesla IR returned 403 in production; no continued requests or proxy. Its company-specific Business Wire RSS can legitimately be empty: show feed_empty and retain dedup history. New-source Telegram connection receipt is separate from old configuration messages. No source follows redirects; URLs are source-host allowlisted. Test `test/official-ir.test.mjs` with existing monitor tests. Do not reset the IR baseline on later collector revisions.
