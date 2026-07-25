# PROMPT 日志(工作协议:每个任务先生成 PROMPT 写入本文件,再执行)

## 2026-07-11 · 自主营销增长系统

**目标**:不依赖站长人工操作,为 SunWatch Pro 建立自动化获客-转化增长循环,并把"先写 PROMPT 入库再执行"固化为协议。

**需核实的数据**:企业插件市场可用的营销/SEO 技能(已查:marketing 已启用但技能未暴露,searchfit-seo 待用户一键安装,不阻塞)。

**执行步骤**:
1. 协议固化:创建本 PROMPTS.md 日志;更新 CLAUDE.md——每任务先写 PROMPT 至此文件,commit 后执行。
2. SEO 基建:页面加 meta description / Open Graph / Twitter Card;新增 /robots.txt 与 /sitemap.xml(Worker 路由)。
3. 免费线索漏斗(核心增长循环):任何人向 @sunwatchBot 发 /start(不带码)→ 自动注册为免费订户 → 每日 20:30 摘要向免费订户发送"预告版"(周期定位+锁定的信号数量+升级 CTA)→ 转化为 Pro。bot 链接 t.me/sunwatchBot 即传播物料,可贴任何社群。
4. 公开战绩页 /track-record:服务端渲染预测档案命中率(含 OG 标签),作为可分享的获客素材;首页导航加入口。
5. 部署验证:冒烟测试 + TG 确认;PROMPT 与结论入库。

**交付物**:上线的 SEO 标签/站点地图、免费订户漏斗、战绩分享页、协议更新。
**验证**:流水线日志(bootstrap/webhook/broadcast 状态)+ 页面渲染检查。

## 2026-07-11 · 全自动获客 v2(零人工分享依赖)

**目标**:移除"站长手动分享"环节,建立完全自动化的流量获取管道。
**边界**:不做假账号/群发/灌水等灰产;只做程序化 SEO 与开放协议分发。
**执行步骤**:
1. 程序化 SEO(pSEO):为全部 34 只标的生成 /stock/<slug> 独立页(标的分析+免费层数据+实时行情+CTA),为五大赛道生成 /track/<id> 长文页——每页锚定真实搜索词(如"SNDK 触发线""海力士ADR 分析""宇树 IPO 打新"),搜索引擎自动收录带来长尾流量。
2. IndexNow 集成:站内托管密钥文件,每日 cron + 每次部署自动 ping api.indexnow.org,新内容秒级推送 Bing/Yandex/Naver 收录(无需任何账号)。
3. RSS 输出 /feed.xml:每日预告+最新信号进 RSS,聚合器/RSS 读者自动分发。
4. sitemap.xml 扩展至全部页面;部署流水线加 ping 步骤。
**交付**:约 40 个可收录页面 + 自动收录管道 + RSS 分发。
**验证**:各路由 200、IndexNow ping 返回、冒烟日志。

## 2026-07-11 · 自动化基建调研与安装(skills/开源项目)

**目标**:系统调研可复用的自动化组件(Claude skills 市场、npx skills 生态、GitHub 开源项目),能装即装、能用即用,加速营销自动化的规模化;不可自主使用的(需账号/服务器)输出评估矩阵。
**执行步骤**:
1. 调研三源:① 企业插件市场(SearchPlugins/ListPlugins 全量)② npx skills CLI 生态 ③ GitHub 开源(社媒排程/OG图/RSS/SEO/TG增长类,按 stars 与可嵌入 Cloudflare Workers 筛选)。
2. 立即安装可自主使用的组件并接入。
3. 无法自主使用的输出"待用户一键"清单(所需凭证、预期收益)。
4. 自建缺口组件:增长度量层(页面访问/CTA点击/激活转化 KV 计数 + 每日增长数据入 TG 简报)——规模化的前提是可度量。
**交付**:调研矩阵 + 已安装组件 + 增长度量上线。

## 2026-07-11 · 安装用户指定的 ECC skills(affaan-m/ECC)

**目标**:安装用户点名的 GitHub 项目 claude code skills,提升能力。
**步骤**:1) 先审查仓库内容(README/skills 结构/有无可疑指令与脚本) 2) 审查通过后克隆并安装至项目 .claude/skills(随 git 持久化) 3) 记录安装清单与生效方式(新会话加载) 4) 有可疑内容则停止并报告。
**执行结果**:审查通过(纯Markdown指令、无脚本、无可疑模式);选择性安装 7/889:seo、marketing-campaign、content-engine、brand-voice、market-research、social-publisher(需SocialClaw key,备用)、growth-log → .claude/skills/(随仓库持久化,新会话自动加载)。全量889个技能不装,防上下文污染。

## 2026-07-11 · 内容飞轮 + 结构化数据(应用 ECC seo 技能)

**目标**:让站点每天自动"上新"可收录内容(搜索引擎偏好活跃站点),并按 seo 技能方法论补结构化数据,提升富结果概率。
**步骤**:
1. 读取 .claude/skills/seo/SKILL.md 方法论对照现状。
2. 每日复盘页 /daily/<date>:每日 cron 把当日摘要快照存 KV 并生成独立文章页(JSON-LD Article),/daily 索引页列出近30天;sitemap 动态纳入 → 站点每天自动+1页新内容。
3. 结构化数据:标的页/赛道页/战绩页注入 JSON-LD(BreadcrumbList + Article),提升搜索富结果。
4. 测试→部署→IndexNow 自动收录。

## 2026-07-13 · 每日自主优化循环(常设)

**目标**:建立每天自动执行的网站优化任务,全程自主决策(用户已授权),用户只看结果。
**机制**:
1. 定时任务每日 06:00 UTC(北京14:00)唤醒本会话 → 从 BACKLOG.md 按优先级取 1-2 项(或优先修复自检发现的故障)→ PROMPT 记入本文件 → 实现 → 本地验证 → push 部署 → TG 自动确认。
2. 创建 BACKLOG.md 优化待办池(初始15项,持续补充);每完成一项勾销并在底部记录完成日期。
3. 纪律:不破坏免费/Pro分层与既有功能;每次必须冒烟验证;涉及对外收费/大改版仍需告知用户;增长数据(PV/订户)连续恶化时优先诊断。
**今日首轮执行**:Telegram webhook 安全加固(secret_token 校验+每日自愈重注册)。

## 2026-07-15 · TG 精炼改版 + 网站行动化升级

**目标**:TG 推送从 2-3 条长文精炼为一屏短报(行动导向);网站承接全部细节并升级"今日行动+新机会"监控。
**设计**:
1. 每日简报新结构(≤15行):【今日要做】(ACTION_QUEUE 数据化的当期动作,≤3条)→【风险灯】(五赛道一行 emoji)→【异动】(|±3%|以上,≤5条)→【下一触发】(距离最近的买/卖触发线2条,含新机会买点)→ 增长一行(仅站长)→ 详情链接。
2. CORE_SIGNALS 长文本退出 TG,改由网站 Pro 区展示(/api/archive 分层输出,dashboard 顶部新增"今日要做"条)。
3. 新机会监控:下一触发同时覆盖买入触发线(优必选/绿的/OSL入局区、潜伏池恐慌日),不只存储卖出。
4. 免费预告同步精简;穿线快讯/重要信号保持原有短格式。

## 2026-07-16 · 每日优化循环 #2(自动执行)

**取件**:BACKLOG #2 标的页注入最新新闻 + #3 bot /status /help 命令。
**步骤**:
1. /stock/<slug> 路由:从 KV feed 按标的名/代码关键词匹配最新新闻(≤5条),页面新增『最新动态』区(内容加厚→排名权重;每30分钟随抓取自动更新=页面持续新鲜)。
2. tg-webhook:新增 /status(识别 Pro/免费/未订阅并返回对应状态与引导)与 /help(命令说明);未知命令回 /help 提示。
3. dry-run + dev 冒烟 → push 部署 → BACKLOG 勾销。

## 2026-07-17 · 每日优化循环 #3(手动触发一次;定时改为北京10:00)

**取件**:BACKLOG #4 FAQ页+FAQPage schema + #8 潜伏池标的补入实时监控(含恐慌买点自动报警)。
**步骤**:
1. /faq 页:8 个常见问题(触发线是什么/信号频率/如何订阅/绑定TG/激活码规则/数据来源/与荐股的区别/免责),FAQPage JSON-LD 富结果;入 sitemap 与 IndexNow;首页导航加入口。
2. WATCHLIST 补入鸣志/北特/柯力/奥比/越疆(潜伏池组);refreshQuotes 新增恐慌检测:潜伏池标的单日 ≤-5% → TG 即时推『🟢 恐慌买点候选』(对应"只在恐慌日买"纪律的自动执行器)。
3. dry-run + 冒烟 → push → BACKLOG 勾销。

## 2026-07-20 · 每日优化循环 #4(循环重建后首轮;数据补课 + BACKLOG #5)

**背景**:每日循环 trigger 曾丢失,7/17-19 中断;今日以新 trigger(trig_01PiwKEKQsJXDDkueQ8yKXGi,每日北京10:00)重建并首跑。每周一周检 trigger 同样丢失,本轮一并重建。
**目标**:①补课中断期行情并把触发判定入库 ②取件 BACKLOG #5 licenses 管理端点 ③修复定时任务记录。
**需实时核实的数据**(已 WebSearch,标注日期):SKHY 7/17 收 $154.03;SNDK 7/17 收 $1354.82(7/13 -12.6%、7/16 再 -8%,破 $1745 触发线=更低低点确认);MU 7/17 收 $848.95(破 $1010 线);海力士正股 000660 7/20 晨 182.9万韩元(深破 218.7万应急线);Evercore 逆势上调 SNDK 目标至 $3,100(对手盘信息)。
**步骤**:
1. CORE_SIGNALS 顶部新增【周初快照判定 2026-07-20】(触发线盘点+执行结论);ACTION_QUEUE 清理 7/17 过期项、新增本周行动;FORECASTS 建档"下行趋势确认"判断。
2. src/index.js 新增 /api/licenses(站长 bot token 鉴权):GET 列表(码/状态/绑定/时间);&revoke=码 吊销(移入 licenses-revoked 审计,isPro/广播即刻失效)。BACKLOG #5 勾销。
3. 重建每周一 05:00 UTC 存储清仓周检 trigger;CLAUDE.md 定时任务段更新为新 trigger ID。
4. 验证:wrangler deploy --dry-run 通过 → push 部署分支 → Actions 日志确认部署与 TG 推送。
**交付**:数据入库 + licenses 管理端点 + 双 trigger 恢复 + 本记录。

## 2026-07-20 · 周检 #3(重建后周检 trigger 首跑,trig_01TDZnEwc4BUgdVoFk6J2tmX)

**目标**:按三硬指标做存储清仓周检并入库。
**核实数据**(WebSearch,标日期):正股 000660 7/20 收 185.8万韩元(+0.7%);TrendForce 7/3:3Q26 DRAM +13~18%/NAND +10~15%(增速三连降,消费端承受力见顶);MU 无下修(FQ3 营收 $414.6亿/EPS $25.11);SKHY 7/14 因两倍杠杆 ETF 上市单日 +19% 冲高后回落至 $154.03(7/17);板块官方入熊(距高点 -20%+)。
**判定**:清仓触发 0/3(①半触发:更低低点成立但 SKHY 未破发 ②合约价未转负 ③MU 未下修)→ 底仓 1/3 维持;回补条款暂停(趋势破坏),重启前提入 WATCHLIST(正股收复 218.7万 above 线新增)。
**交付**:CORE_SIGNALS 周检判定置顶 + FORECASTS 建档 + WATCHLIST 企稳触发线 + 部署推送 TG。

## 2026-07-21 · 每日优化循环 #5(BACKLOG #6:IndexNow 健壮化)

**目标**:①隔夜行情核查(SKHY 是否测试 $149 破发线,若破发清仓触发①成立须入库) ②BACKLOG #6:IndexNow 429 重试 + 最近状态记录(KV) + 简报收录健康度。
**步骤**:
1. WebSearch 核实 7/20 美股收盘:SKHY/SNDK/MU;有触发即入 CORE_SIGNALS/FORECASTS。
2. 新增 pingIndexNow(env, urls):429/5xx/网络失败重试≤2次(退避1s/3s),结果写 KV `indexnow-status`(时间/状态码/尝试次数/URL数);两处调用点(/api/ping-indexnow 与每日 cron)改走该函数。
3. growthLine 追加收录健康度(读 indexnow-status:✅状态码+日期 / ⚠️失败+次数)→ 每日简报站长行自动携带。
4. dry-run + push 部署 + Actions 验证;BACKLOG 勾销 #6。
**验收**:dry-run 通过;/api/ping-indexnow 返回含 attempts/status;简报增长行含收录段。

## 2026-07-22 · 每日优化循环 #6(BACKLOG #7:FORECASTS 战绩内容矩阵化)

**目标**:把每条 FORECASTS 判断做成独立可收录页 /forecast/<id>,每页含 Article+BreadcrumbList JSON-LD、与战绩页互链,全部进 sitemap 与 IndexNow——让"公开战绩"从 1 页扩成 N 页机流量入口(战绩=本站差异化获客素材)。
**需实时核实**:隔夜 SKHY 是否触及 $149 破发线(触发即入库);其余判断不新增,只做内容矩阵化。
**步骤**:
1. html.js:新增 forecastSlugs(FORECASTS) 生成稳定 id(date+同日序号,append 稳定);renderForecastPage(f,id,related) 单篇复盘页(keyword 化 title/description、命中徽章、依据/结果、JSON-LD、CTA、互链);renderForecastIndex 索引页。
2. index.js:路由 /forecast(索引)与 /forecast/<id>(单篇,404 兜底);/forecast* 计 PV;allUrls() 纳入全部 forecast 页 + 索引 → 自动进 sitemap/IndexNow;战绩页每条卡片链到对应 /forecast/<id>(需 renderTrackRecord 传 id)。
3. dry-run + push 部署 + Actions 验证;BACKLOG 勾销 #7。
**验收**:dry-run 通过;/forecast 列出全部;/forecast/<id> 200 且含 canonical 与 Article schema;sitemap 含 forecast 页。

## 2026-07-23 · 每日优化循环 #7(BACKLOG #9:英文着陆页 /en + 英文战绩页 /en/track-record)

**目标**:开英文获客入口——Serenity 案例证明中英信息差有市场。捕获 "Justin Sun predictions / portfolio tracker" 类英文搜索意图,不重构中文 SPA 首页。
**范围(可评审,纯新增路由)**:
1. /en 英文着陆页:说明 SunWatch 是什么(孙宇晨预判监控+跨市场执行)、可验证命中率(从 FORECASTS 计算,语言中立数字)、CTA 到 /en/track-record 与 TG。
2. /en/track-record 英文战绩页:命中率 + 每条判断(日期+命中徽章+我审校的忠实英文摘要 FORECAST_EN 映射;缺失则只显日期+徽章,优雅降级,绝不在英文页显示中文)。
3. hreflang 双向:/ ↔ /en、/track-record ↔ /en/track-record(en/zh-CN/x-default),中文两页 head 补 alternate。
4. allUrls 纳入 /en 与 /en/track-record → sitemap/IndexNow。
**红线**:英文摘要必须忠实于已建档中文判断,不新增/不夸大;数字沿用已核实值。
**验收**:dry-run 通过;/en 与 /en/track-record 200、含 canonical+hreflang;英文页无中文正文;sitemap 含两页。BACKLOG 勾销 #9(首页 SPA 全量 i18n 留作后续)。

## 2026-07-25 · 每日优化循环 #8(BACKLOG #10:免费预告 A/B 文案轮换 + 点击归因)

**数据核实(铁律#1)**:SKHY 7/24 收 $159.50(未破 $149,反从 7/21 $151 回升,破发压力本周缓解);清仓触发①未成立,底仓判定不变——仅日报记录,无新明确判断入库。
**目标(BACKLOG #10,转化向)**:免费 TG 预告的升级 CTA 做 A/B 文案轮换,并按变体归因点击,用数据找出最能转化的文案。
**范围(可评审,加法)**:
1. TEASER_CTA_VARIANTS(3 条升级文案变体);pickTeaserVariant() 按 UTC 年内天数确定性轮换(无随机,可复现)。
2. buildTeaser 升级行改用当日变体,链接走 /go/pro?v=<id>。
3. 新增 /go/pro 路由:bump growth.proClicks 与 growth[`proClick_<id>`],302 跳 /#pricing。
4. growthLine(仅站长)追加各变体点击对比。
**验收**:dry-run 通过;/go/pro?v=a 302 到 /#pricing 且计数;buildTeaser 含 /go/pro 链接;简报增长行含变体对比。BACKLOG 勾销 #10。
