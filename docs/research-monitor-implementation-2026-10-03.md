# SEC disclosure monitor — implementation record

## Delivered scope

- Twelve issuer CIKs verified against the SEC official ticker file on 2026-10-03; all twelve submissions JSON files validated using the production parser.
- Company disclosure metadata and original SEC document links. Reports, current reports, amendments and selected issuance documents are monitored. Form 4 and 13F interpretation, paid news/research and financial metric extraction are outside this version.
- Initial snapshot records up to five relevant historical documents per issuer (60 in the live source sample). It establishes a baseline without backfill notifications. Same accession never becomes a new signal merely because its fetch timestamp changed.
- Source filing date, report date, raw acceptance timestamp and SunWatch first-observed time remain separate. The raw SEC acceptance timestamp is not independently timezone-verified.
- Durable owner outbox, bounded delivery, retained failures, one outage warning after grace and recovery acknowledgement. Existing 30-minute cron; no extra paid scheduler.
- `/research` and `/en/research`, `/api/research`, bounded public `POST /api/research-refresh`. Public refresh sends no Telegram messages. Existing portfolio and trading rule parameters are untouched.
- `/research`, `/research_pause`, `/research_resume` owner commands. Missing webhook headers are rejected; the private webhook secret derives from bot credentials and replaces the old public constant.
- 33 legacy core records receive pending-review status. A 30-day publication-age expiry is an operational policy; it is not an invented review. No record has a fabricated `reviewed_at`, invalidation condition or fresh endorsement.
- Public pages use canonical/hreflang, original evidence links, sitemap and llms discovery. Optional GA4 uses the AGI property, only after consent; private bot data and URL query strings are excluded. Existing IndexNow release mechanism handles the new canonical pages.

## Validation

18 focused tests cover issuer/schema validation, future dates, path validation, provenance, baseline/new/late events, rollback/history gaps, legacy review status, concurrency, failed acknowledgements, bounded batches, pause/resume, source outage/recovery, stale reads, public refresh permissions, private owner controls and bilingual SSR/analytics boundaries. Existing portfolio, mechanical rules, growth and ledger suites pass.

Both mobile (390px) and desktop (1280px) pages are rendered with Playwright. Mobile overflow and English visible-text checks pass. Production smoke additionally checks all twelve source statuses, public no-send behavior, duplicate polling, private webhook registration, unauthenticated webhook rejection, SEO discovery and both rendered languages.

## Important limits

This is evidence monitoring, not an assessment of current fair value or a trading recommendation. Financial deltas are explicitly unverified. The new strategy does not claim better returns. No source rights are assumed for commercial redistribution of premium feeds. Telegram acknowledgement and durable persistence cannot be one atomic transaction; a crash between them can repeat a message. Missing history anchors or rollbacks stop that issuer instead of silently substituting data. A delivery backlog over 500 ids stops ingestion for affected issuers until it drains. New filings discovered after baseline are retained up to the visible window; pending events are protected from eviction. Raw source snapshots for arbitrary past-time backtests are not offered.

Deployment and live receipts are verified separately from these source-code tests.

## Private configuration migration

Deployment moves missing legacy cross-service and payment bindings from the previous revision into the same existing Cloudflare Worker secrets, before new code deploys. Existing bindings are preserved; values are never printed. The current source and task history no longer embed those values. Historical Git objects are not rewritten; the legacy integration key has not been rotated across its counterpart services by this migration. New research controls use the separately derived private webhook secret.

## Release state

Prepared and locally committed; not deployed. Automatic approval review rejected publishing the full repository changes because they retain existing internal project records and payment/operations descriptions in a public repository, even after the plaintext credential and address removal. No alternative upload channel was used. Explicit authorization to publish those materials is required before another attempt. The private-binding migration is prepared, not executed. Three additional offline tests verify missing-binding migration, preservation of existing secrets and fail-closed behavior.

2026-10-03 authorization update: the user explicitly approved public publication of this code and the existing project documents, including payment/operations descriptions after plaintext credential/address removal, and deployment. The previous approval gate is resolved. Deployment verification follows.

First deployment: private-binding migration, build and existing production smoke checks succeeded. The SEC live gate caught an unsupported redirect mode before the monitor was reported as healthy. Fix uses manual redirect mode with non-2xx rejection, backed by a request-boundary regression test. Collector revision causes one new check without resetting baselines or notifications.

Source access gate: after the runtime fix, both deployment environments received SEC 403. The GitHub response identified an undeclared automated tool. The application now requires SEC_USER_AGENT with an operator contact email before making SEC requests. No proxy or disguised browser identity is used. Until configuration succeeds, the page/API serve the previously verified 60-document snapshot from 2026-10-03T13:55:41.385Z, explicitly marked fixed historical data. No baseline record is queued as a new announcement. One owner configuration notice is allowed; live disclosure notifications remain pending.

## Latest verified release — 2026-10-03 22:33 Asia/Shanghai

- Published commit: `0eebd66b313896e58130bc9eae29401d95ba13f2`; deployment run `37129985278` succeeded. Wrangler is pinned to 4.147.0, matching the project's intended major version and JSON import syntax.
- Private-binding migration completed; subsequent releases preserve existing bindings. Current source no longer includes the old credential or payment-address literals. Git history was not rewritten and the legacy cross-service key was not rotated across counterpart services.
- Production `/research`, `/en/research`, `/api/research` verified. API returns 60 fixed historical records observed at `2026-10-03T13:55:41.385Z` and 33 pending/expired legacy review records. `snapshot_only=true`, `health=not_ready`, all twelve issuers report `sec_contact_required`. This is not live disclosure monitoring.
- Public refresh repeat sends zero messages. Private webhook registration and missing-header rejection checks passed. New research channel has no delivery acknowledgement yet; the existing cron can send one setup-status notice.
- Contact gate prevents new SEC requests until an operator contact email is configured in SEC_USER_AGENT. After configuration, live source access and disclosure notification receipt still need verification.
- Both language pages, canonical/hreflang, GA4 consent controls, sitemap and llms discovery passed checks. IndexNow returned HTTP 429 after three attempts for the existing release batch; submission is not accepted or indexing verified. No extra retry loop was added.


## 23:02 CST 起 — 官方公司公告替代方案

用户要求“用其他方法”，不再要求提供邮箱。本版默认采集公司自己公开的 RSS / IR 新闻接口；SEC 联系人门槛保持原样，未对 SEC 改用代理、浏览器伪装或新出口重试。

| 标的 | 已核验公开来源 | 格式 |
|---|---|---|
| AMD | https://ir.amd.com/news-events/press-releases/rss | RSS |
| TSLA | https://ir.tesla.com/press | 官方公告列表 / 日期 |
| META | https://investor.atmeta.com/rss/pressrelease.aspx | RSS |
| MU | https://investors.micron.com/rss/pressrelease.aspx | RSS |
| NVDA | https://nvidianews.nvidia.com/cats/press_release.xml | RSS |
| PLTR | https://investors.palantir.com/news | 官网 bundle.js 调用的公开 PressRelease.svc 列表 / 日期 |
| SPCX | https://ir.spacex.com/rss/pressrelease.aspx | RSS |
| AMZN | https://ir.aboutamazon.com/rss/pressrelease.aspx | RSS |
| GOOGL | https://abc.xyz/rss/pressrelease.aspx | RSS |
| MSFT | https://news.microsoft.com/source/tag/press-releases/feed/ | RSS |
| NOW | https://newsroom.servicenow.com/rss/pressrelease.aspx | RSS |
| PANW | https://investors.paloaltonetworks.com/rss/news-releases.xml | RSS |

取样实测均成功解析；每源初次展示 5 条，共 60 条公司公告，后续仅新增且不是建基线之前的补录记录入队。仅日期的来源，同基线日新增记录也按保守历史补录处理。RSS 标题与日期/链接元数据保留，正文不复制，原始标题不假装已翻译。

SEC 历史 60 份档案保留在单独折叠区与 API sec_archive，不计入当前 IR 健康状态；公司新闻不是完整法定披露覆盖，不根据标题给买卖建议。收益基准不变。

来源验证/两轮自检：固定公司域名、显式允许 Amazon RSS 引用的 /amazon/ 代理投票文档链接（ezodproxy 为源中实际链接，不作为抓取代理）；拒绝用户信息 URL、恶意协议、未来日期、错误公司、重复 ID、DTD；HTTP 链接仅将已允许公司域名升级为 HTTPS，禁止自动跟随采集重定向；流式响应上限 4MB。新源迁移只建立基线，公开刷新不发消息；owner-only outbox 保留失败重试、暂停恢复与串行化。

验证：十二源真实样本解析；离线新增/补录/重入/迁移/安全边界测试通过。发布沿用现有 CI、GA4 同意设置、canonical/hreflang/sitemap/llms 和原 IndexNow 频率；上线运行与 Telegram 回执将在部署后记录，不提前宣称。
