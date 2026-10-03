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

## 2026-08-06 · 专项调研:孙宇晨为什么赢,以及 2026 年还剩哪条路(用户指令"重点调研分析为什么孙宇晨能赢")

**原始请求**:调研孙宇晨为什么能赢,参照他"试点 web3 + 股票后发现 web3 可暴富"的路径,
为用户设计一个 2026 年内可实现暴富的实验路径;可从知乎当年预测神贴或 Reddit 回溯。

**结构化任务描述**:
- 目标:找出孙宇晨结果的**可迁移机制**(而非叙事),核验每个机制在 2026 年的开/关状态,
  在中国大陆法律边界内给出可执行、可证伪的实验设计。
- 需实时核实的数据(铁律#1):① SEC 案最终结果;② 2017 ICO 队列存活率;③ 中国 2026 加密监管现状;
  ④ 加密财库公司(DAT)mNAV 现状;⑤ 预测市场规模与结算预言机 economics;⑥ 独立开发者收入基准分布。
- 交付物:`report/暴富路径调研-孙宇晨机制分解与2026可行路径.md`
- 验证方式:每条结论附一手/可核查链接;明确标注哪些假设**被自己的调研否掉**。

**核心结论(与用户前提冲突,已在文档中说明)**:
1. **顺序反了**:孙 2013 年即在币圈,2017 发 TRX,**2025 才进美股**(SRM 借壳)。
   不是"多方向试点找赛道",是"一个资产推八年 + 连续换壳"。
2. **幸存者偏差**:2017 年 ICO 队列 **80% 被认定为骗局、704 个 token 归零**。
3. **该路径对中国大陆居民已封死**:2026-02-06 人民银行+公安部联合发文,禁令扩至 RWA 与离岸稳定币。
4. **他 2025 年那招(加密财库壳)2026 年已坍塌**:200+ 家公司近 **40% 跌破净值**,mNAV<1 后增发通道消失。
5. **自我否掉的假设**:做 UMA 结算提案人——押 750 USDC 保证金,单次奖励 **2–5 美元**。不是暴富路径。
6. **五要素分解**:发行侧 / 监管真空 / 制造注意力 / 连续换壳 / 政治庇护 → 2026 年三个不可用,
   仅剩原理:**发行侧 > 购买侧;换壳能力 > 选品能力**。

**对用户三个仓库的判断**:sunPredition(研究强,主分支空)、smarterFuture(引擎全,12 原型零落地)、
agiscorecard(资产扎实,~200 UV/月、0 收入)——**三个引擎,零个仓位**。
缺的不是第四台引擎,是选一个推到底。

**实验设计**:五探针(已有资产变现 / 指数授权 API / 方法换赛道 / 卖研究 / 高单价一对多),
共 12 天工作量,**统一判定日 2026-10-15**,每个探针预先登记杀死条件;
一旦一个跑通,立刻砍掉其余四个全压上去。

**诚实结论**:五个已核验基准数字没有一个支持"5 个月暴富"(独立开发者中位数 12–18 个月到 1 万美元 MRR)。
交付的是**结构正确的 5 个月**,不是暴富承诺。

## 2026-08-06 · P1 执行:修复结账死胡同(暴富路径调研 → 五探针 P1)

**原始请求**:用户看完调研文档后说"开始跑"——即启动 P1(把已有资产变现,最快出钱的那条)。

**结构化任务描述**:
- 目标:让 SunWatch 的 Pro(¥199/月)**真的可以被买到**,并让"零成交"这件事变得可证伪。
- 发现(执行前的诊断,比原计划更重要):定价卡写着"购买:联系站长付款(微信/支付宝/USDT)获取激活码",
  但**站点、bot、FAQ 全部没有任何联系方式**;bot 在激活码无效时也只说"购买请联系站长"。
  → **每一个想付钱的人都会撞墙**。因此此前的零成交**不是需求证据**,是结账走不通。
  更糟的是:这个失败模式和"没人想买"在数据上完全一样,不会报错,所以它可以无限期存在下去。
- 需实时核实的数据(铁律#1):本次不涉及价格/市值判断,无需行情核实;价格未改动(¥199/月不变)。
- 执行步骤:
  1. 新路由 `/go/buy` → 计数 `buyClicks` → 302 到 `https://t.me/sunwatchBot?start=buy`
  2. bot 拦截 `/buy` 与 `/start buy`(**必须在无码 /start 分支之前**,否则意向会被当成普通订阅吞掉):
     回买家一条含价格/权益/下一步的消息 + **同时通知站长**(带对方用户名与 chat_id)+ 计数 `buyRequests`
  3. 修掉三处死文案:激活码无效提示、免费订阅欢迎语、/status 升级提示 → 全部指向 `/buy`
  4. `/help` 增加 `/buy`
  5. 定价卡:把不可执行的说明换成「立即购买 →」按钮;FAQ「如何订阅」同步改写
  6. 增长行拆分 `购买按钮 N→询价 M`——两者劈叉即说明结账又断了
  7. 部署冒烟测试增加三条断言:`/go/buy` 返回 302、跳转目标含 t.me/sunwatchBot、首页含 /go/buy
- 交付物:`src/index.js`、`src/html.js`、`.github/workflows/deploy.yml`
- 验证方式:`node --check` 双文件通过;推送后读 GitHub Actions 冒烟日志(铁律#5,沙箱直连 workers.dev 403)。

**告知(按 CLAUDE.md「涉及对外发布/收费变更仍需告知」)**:
- **价格未变**(¥199/月 · ¥1999/年),权益未变,不涉及自动扣款或任何支付接口。
- 变的只有"怎么联系上你付钱"这一段,以及站长会收到购买通知。
- 收款与发码仍**全部由你手动完成**——没有验证付款就自动发码是不可接受的。

**P1 判定条件(不变,来自调研文档)**:2026-10-15 前付费订阅 < 3 个 → 砍掉 P1,转 P3。
但现在这个判定才第一次成立:此前它测的是"结账能不能用",不是"有没有人愿意付钱"。

## 2026-08-06 · P1 续:USDT 收款接入 bot(站长指定地址,"放到 bot")

**原始请求**:站长给出币安 USDT 收款二维码截图 + 地址文本,指示"放到 bot"。

**结构化任务描述**:
- 目标:让买家在 Telegram 里**自助拿到收款地址并完成付款**,同时让站长能对账;
  地址**不进公开页面**。
- 需核实的数据:**收款地址逐字符核对**——截图 OCR 与站长粘贴文本两个独立来源比对一致
  (`[private worker binding; historical literal redacted]`,40 位十六进制),链为 BNB Smart Chain (BEP20)。
  地址错一个字符 = 全部货款永久打给陌生人,因此不接受单一来源。
- 执行步骤:
  1. `USDT_ADDR / USDT_CHAIN / USDT_MONTH / USDT_YEAR` 四个常量集中在 index.js 顶部,改价改一处
  2. `/buy` 回复带上:USDT 金额、`<code>` 包裹的地址(TG 内点按即复制)、**链名警告**、下一步
  3. 新增付款回执处理:买家发来 BSC 交易哈希(`0x`+64 hex)→ 转给站长(带 BscScan 链接
     与三条核对清单)+ 回执买家 + 计数 `payClaims`。**不自动发码**
  4. 增长行扩为 `购买按钮 → 询价 → 付款回执` 三段漏斗
  5. 定价卡与 FAQ 文案同步为"机器人当场给地址"
  6. 冒烟测试新增**泄露断言**:首页/FAQ/战绩页若出现该地址即 fail
- 交付物:`src/index.js`、`src/html.js`、`.github/workflows/deploy.yml`
- 验证方式:`node --check`;推送后读 Actions 冒烟日志(铁律#5)。

**关键决策与理由**:
- **不自动发码**。没有上链核对就凭一串 64 位十六进制发码,等于任何人贴个哈希就能白嫖。
  站长人工核对三项(收款地址 / 金额 / 已确认)后再发。这条不能为了"全自动"让步。
- **地址只进 bot 私信**。公开页面上的地址会被抓取归档,且链上余额与全部往来记录
  任何人可查——等于把资金流水挂在产品页上。已加冒烟断言防回归。
- **USDT 定价 28 / 280**,按 ¥199 / ¥1999 以约 7.15 折算取整。
  刻意不取 29 / 289 —— 那是借汇率换算悄悄涨价 4%。

**告知(收费相关)**:新增 USDT 支付通道,人民币价格未变;USDT 计价 28/月、280/年为按当前汇率
的等值折算,如需调整改 index.js 顶部两个常量即可。微信/支付宝路径保留。

**风险提示(已在前一轮报告中向站长说明,此处留痕)**:2026-02-06 人民银行+公安部文件将禁令
范围扩至 RWA 与离岸稳定币;**以 USDT 收取经营性货款**与个人持币属不同风险等级。
站长已知悉并指示接入。

## 2026-08-06 · P1 收尾:站长 /code 发码命令(闭合结账最后一跳)

**背景缺口**:Telegram 不允许 bot 主动私信陌生人。买家侧没问题(他先发了 /buy),
但**站长发码那一步**要用自己账号私信对方——若买家没设用户名(隐私设置可关),
站长根本搜不到这个人,只有 bot 能回那个 chat_id。结账的最后一跳因此可能断在这里。

**做法**:新增站长命令 `/code <chat_id> [年]`,bot 生成激活码并**替站长发给买家**,
同时回执站长。付款回执通知里直接把这条命令拼好(带 chat_id),复制即可用。

**鉴权(刻意 fail-closed)**:必须同时满足 `msg.chat.type === "private"` 且
`String(msg.chat.id) === String(cfg.chatId)`。
理由:若 TELEGRAM_CHAT_ID 指向群/频道,群内任何人的 chat.id 都等于群 id——
只判 id 就等于谁都能发码。加上 private 判断后,那种配置下本命令直接不生效。
**宁可失效,不可误放行。**(站长 2026-08-06 确认为私聊,故实际生效。)

**发送失败处理**:若对方从未与 bot 对话过导致投递失败,码仍已生成并入库,
回执明确告知站长"发送失败,请手动转给他",不静默丢失。

---

## 2026-08-06 · 安全事项:bot token 已在对话中明文暴露,需轮换

站长在聊天中粘贴了 bot token 明文。**未写入本仓库任何文件**(已核verified)。

**为什么这不只是"泄露一个 token"**:本项目里 **bot token 就是 worker 的管理员凭据**——
`/api/gen-code`、`/api/licenses`(列表+吊销)、`/api/set-webhook` 三个端点全部以
`url.searchParams.get("token") !== cfg.token` 鉴权。因此持有该 token 的人可以:
1. 无限生成 Pro 激活码
2. 列出并**吊销**现有用户的激活码
3. 把 webhook 改指到自己的服务器
4. 以 bot 身份发消息——**包括给买家发一个不同的 USDT 收款地址**(直接截走每一笔货款)
5. 读取买家发给 bot 的全部消息(含 TxID)

第 4 条是本次接入 USDT 收款之后新增的风险面,必须轮换。

**轮换顺序(次序不能乱,否则会有一段时间失联)**:
1. BotFather → `/revoke` → 拿新 token(旧 token 立即失效)
2. 在 Telegram 里给 bot 随便发一条消息(setup 端点靠 getUpdates 取最后一个 chat)
3. 访问 `/api/setup-telegram?token=<新token>` → 写回 KV `tg-config`
4. `/api/set-webhook?token=<新token>` 重注册(或等每日 cron 自愈)

**长期改进(未做,留待评估)**:把管理端点的鉴权与 bot token 解耦,
改用独立的 admin secret。现在两者同一把钥匙,意味着"泄露聊天凭据"直接等于"泄露管理权限"。

## 2026-08-07 · 十倍工程：SpaceX/存储/机器人三赛道深度分析入库(用户指令"指导我美股投资,目标 1-2 年 10 倍")

**原始请求**:投资板块做 SpaceX、存储、机器人深度分析并指导投资,明确标的,目标 1-2 年 10 倍回报。

**结构化任务描述**:
- 目标:把三赛道的**当日核实事实**+可执行触发线写入系统(STOCKS/PLAYBOOK/WATCHLIST/FORECASTS/CORE_SIGNALS),
  并诚实回答"10 倍"这个目标函数在结构上意味着什么。
- 需实时核实的数据(铁律#1,全部 2026-08-07 WebSearch,标注日期):
  ① **SPCX:SpaceX 已于 6-12 以史上最大 IPO 上市**($1.75T,发行价 $135,高点 $225.64 后约 -45%,已破发;
    Starship 连续推迟,Bloomberg 7-23)——"SpaceX 怎么投"的答案从代理股变成了正主本身;
  ② RKLB $75.67/市值 $447.6 亿(8-06),较 5-27 高点 $150.23 约 -50%,8-10 Q2 财报;
  ③ DXYZ:NAV $19.97(2025-12-31)vs 市价 $28-30 = 溢价 40-50%,SpaceX 仅占 16.2% → 明确回避;
  ④ 存储:SNDK $1,270(8-06)仍低于 7/17 $1,354,单周 -11%/+8% 双向;YTD MU +207%/SNDK +439%;
    "全科技最便宜"抄底叙事进入主流媒体 = 共识化信号;
  ⑤ 宇树:8-10 打新、约 8-19 挂牌,发行价约 104 元/募资约 42 亿/104 天最快审核;
    机构估值口径分歧极大(数百亿~千亿),只用时间线事实,估值以挂牌为准。
- 交付物:data.js 五处(SPCX/RKLB/DXYZ 标的卡 + 十倍工程/太空两个 PLAYBOOK 主题 +
  SPCX/RKLB 触发线 + 2 条 FORECASTS 建档 + 1 条 CORE_SIGNALS 判定)。
- 验证:node --check + import 完整性(STOCKS 46/WATCHLIST 20/PLAYBOOK 9/FORECASTS 11)。

**核心判断(均已按铁律#2 建档,带证伪条件)**:
1. **太空顶部已现于 5-6 月**:SPCX 天量 IPO 破发 + RKLB 腰斩,与 SKHY 之于存储顶完全同构
   (本系统 7 月已验证过一次的模式)。证伪线:SPCX 周线站回 $135 并创新高,或 RKLB 收复前高。
2. **存储 10 倍窗口已关**(自家系统 07-20 顶部判定延续),下个窗口在合约价转负后的周期底。
3. **机器人是唯一中段偏早赛道**,闪迪五要素(纯度×稀缺×低市值×周期起点×经营杠杆)
   只可能出现在瓶颈部件低市值纯标的;宇树首月不追(纪律沿用)。

**对"10 倍"的诚实处理(不可省略)**:10 倍是目标函数不是预期收益;本系统两个亲历样本
(7709 十倍后 -37.8% 回撤、SA 基金 439%→-67%)证明能 10 倍的结构同样能 -70%。
仓位铁律写入 PLAYBOOK:十倍工程仓 ≤ 风险资产 25%、按归零可承受定尺寸。
全部内容为研究框架,非投资建议——免责声明沿用站点既有声明。

## 2026-08-07 · 十倍工程续:标的排序 + 池外扩展(用户指令"哪些赛道标的可以达成,分析推荐;池子没有的继续推荐")

**结构化任务描述**:
- 目标:把"能达成 10 倍"的赛道收敛到有证据的范围,池内标的按闪迪五要素排序,
  并在池外找出结构性缺口层补充推荐。
- 需实时核实(铁律#1):A 股个股实时市值沙箱代理拿不到(已两次尝试)——**不编造**,
  处理方式:①排序基于 7 月已建的 BOM/PS 快照(标注日期);②新增 4 只入 WATCHLIST 行情盯守,
  报价此后随每日双简报自动推送,市值核验交给系统而非猜测;③买前核当日市值 <300 亿的
  硬规则保留在战术里,由下单时点执行。
- 当日核实成功的部分:设备层卡位——华辰装备一次性签约福立旺 100 台丝杠磨床(螺母中径<10mm
  行星滚柱丝杠专用);秦川机床(汉江机床)磨床自供+滚珠丝杠 P2 全覆盖+特斯拉链;
  华西证券测算磨床占丝杠产线成本约 46%。⚠️该层 2025-03 已被券商命名"铲子股",共识度打折。

**排序结论(已入 FORECASTS 建档,带三条验证/认错条件)**:
- 赛道:只有两个能承载 10 倍结构——机器人瓶颈件(窗口开着)、存储下轮周期底(触发线在守)。
- 第一梯队:五洲新春(五要素最全)、柯力传感(未点名=免费期权);
- 第二梯队:鸣志电器(独家但子池小)、奥比中光(引爆最近但 8-19 宇树挂牌=共识化风险);
- 第三梯队:北特科技、兆威机电(仅恐慌日);
- 池外新增:秦川机床/华辰装备/日发精机(设备层)+汉威科技(触觉前沿,仅观察);
- 回避:绿的谐波、Rainbow、整机追高、DXYZ。
- 最硬的下一步:8-10 后逐条核对宇树招股书供应商名单——定点证据替代产业链猜测。

**交付物**:PLAYBOOK 潜伏池 basis +3 条(设备层/触觉层/招股书挖掘)+ stages 更新;
WATCHLIST +4 只观察位;FORECASTS +1 条排序建档;CORE_SIGNALS +1 条(随部署推 TG)。
非投资建议声明沿用。

## 2026-08-07 · 十倍工程续:赛道全扫描(站长问"其他赛道呢")

**任务**:除已判定的存储/太空/机器人/能源/加密外,其余主流赛道逐一过两道闸门
(①周期时钟够早 ②存在低市值纯标的),当日核实关键事实(铁律#1):
- 空间计算:光波导出货 2025H2 同比+600%、份额 13%→38%、IDC 2026 预测 2369 万台(带源)
- 低空经济:亿航 AC+TC+PC+OC 四证齐全(中国唯一)+常态化试运行+2026 TC 集中取证(带源)
- 固态电池:2026 中试线集中投产(奇瑞/比亚迪/宁德/丰田)+装车验证,量产 2027-28(带源)

**结论**:✅空间计算=第二开窗赛道(载体:蓝特光学/水晶光电;毛利弱于机器人一档,同等条件机器人优先);
✅低空经济=半窗口(亿航唯一纯标的但已共识,买点在取证潮后证伪恐慌);⚠️固态=只看二线设备,
先导智能入观察作温度计;❌淘汰七赛道各一句理由。孙宇晨物理AI四赛道谱系闭环。
**交付**:PLAYBOOK 新主题"赛道全扫描·其他"+WATCHLIST 观察位 4 只(蓝特/水晶/EH/先导)+
FORECASTS 建档(三条认错条件,含"若淘汰赛道走出10倍则复盘漏筛")+CORE_SIGNALS 推 TG。
观察位只拿 52 周读数不动钱;非投资建议。

## 2026-08-07 · 十倍工程续:能源子赛道扫描(站长问"能源行业呢")

**任务**:能源在系统里已有"压舱石"判定,但按十倍工程标准拆成子赛道逐个过闸门,
当日核实(铁律#1,带源):
- 燃气轮机:GEV 积压 Q2'26 116GW(Q1 100GW)、年底目标 125GW、产能 2026 20GW→2030 30GW
- 铀:现货 ~$85/长协 $90 创纪录、Citi 看 $100-125、CCJ 2025 +55% 后续涨被列"2026 最大赢家"
- SMR:媒体共识"有效产能最早 2030+"

**结论**:能源全部子赛道无十倍结构——燃机被千亿市值完全定价且无二线纯标的;铀是龙头共识
完成后的商品 beta(每磅无差别,不满足纯度×稀缺);SMR 无收入共识彩票维持回避(诚实加注:
OKLO 确实 10 倍过,不买它是纪律的成本);光伏/储能/氢能/聚变产品无差别或无载体。
能源角色=压舱石(CEG/GEV+A/H 核电股息),不是进攻。
**认错条件**:2027 前铀站稳 $125 且小矿商利润兑现型 10 倍出现,则复盘"商品 beta 不算结构"界定。
**交付**:PLAYBOOK 能源主题 basis +5 条子赛道扫描;CORE_SIGNALS 推 TG。非投资建议。

## 2026-08-08 · 十倍工程续:机器人执行清单(站长问"要购买的标的是哪些")

**任务**:把已建档的排序收敛为可执行的买入清单(标的/仓位/价格/时机),并核对触发线当前状态。
**执行前核对发现两个必须先说的状态**:
1. 优必选 90 港元正压在 7 月计划的止损线上(两个买区 120-130/100-110 已全部跌穿)——
   按系统自身规则该笔交易已死,清单里明确列为"不买";
2. 绿的谐波 347.76 刚跌进 7 月主仓计划 350-380 买区,但 8 月十倍工程判定其已共识化——
   **两套计划冲突,以新框架为准(不买),冲突入档**。这类新旧计划打架必须显式裁决,不能静默。
**清单结构**:A 打新(宇树 8-10 顶格申,首日首月禁追)/ B 彩票池 6 只等权 0.3%(恐慌日🟢推送触发)/
C 设备层先核后买 / D 定点公告升级单(0.3%→1%)/ E 压舱石(NVDA+CEG,让进攻仓敢承受-50%)。
明确不买:优必选、绿的、TSLA 重仓、Rainbow、任何整机追高。
**交付**:CORE_SIGNALS 执行清单一条(随部署推 TG)。非投资建议。

## 2026-08-08 · 十倍工程续:美股机器人为什么缺席(站长问"美股没有推荐标的")

**任务**:正面回答美股机器人标的问题,不回避。当日核实(铁律#1):SERV $3.72亿市值、
季收 $324 万(+404% 仍 miss)、2026 指引大幅下调;SYM $276 亿、仓储自动化非人形。
**结论**:结构性缺席,非筛选疏漏——瓶颈件供应链地理在中日,美股无对应上市公司。
美股机器人敞口的诚实答案:NVDA(全栈卖水人,已在压舱石,占大头)+ TSLA 小仓期权
(180x PE 不重仓,维持)+ SERV 观察位。日股正主(THK/Harmonic/发那科/安川)备注留档,
现有账户体系无此选项。美股的下一个十倍窗口大概率是存储周期底(上一个十倍 SNDK
就在美股),触发线已在守。
**交付**:STOCKS +2(SERV/SYM 带判定)、WATCHLIST +1 观察(SERV)、CORE_SIGNALS 推 TG。

## 2026-08-08 · 十倍工程续:存储暴跌后还是不是十倍(站长问)+预登记购物清单

**当日核实(铁律#1)**:TrendForce 3Q26 合约价 DRAM +13~18%/NAND +10~15%——仍正但减速极陡
(1Q +90-95% → 2Q +58-75% → 3Q +13-18%);新产能 2027底-2028 集中投放。
**结论三段**:①暴跌≠底——SNDK 距高 -48% 但距 52 周低仍 +2900%,离闪迪式起点(PS≈0.7 微利)
差一整个下行周期;②存储仍是下一个十倍窗口最可能来源(系统亲证过的周期性十倍机器),
窗口预计 2027 中后期,恰接 1-2 年十倍时间线;③购物清单预登记:SNDK 主力/MU 均衡/
SKHY 正主(本轮新增美股直买通道),三触发器(合约价转负→减产公告→PS≈1x+企稳)响了照单执行,
杠杆 ETF 禁用。证伪条件同步预登记(增速重新加速+SNDK 收复 $2000 → 认错回补)。
**交付**:CORE_SIGNALS 推 TG + FORECASTS 建档。非投资建议。

## 2026-08-08 · 十倍工程续:光通信暴涨里有没有十倍(站长以存储对照发问,追问 AAOI)

**当日核实(铁律#1,带源)**:中际旭创新高 743 元/市值超 8100 亿/单日成交 675 亿创纪录/
港股近年最大 IPO+拟 80 亿回购;新易盛新高 528 元/市值超 5100 亿;1.6T 良率 95%/92%、
订单排到 2027-28;AAOI 两周 $90→$120+(财报日 $140+)、Q2 营收 $1.919 亿连续第五季创纪录、
全年指引 $11 亿,**但 GAAP 亏损 $2280 万/利润率 -8.5%**。
**结论**:光通信 ≈ 存储的 6 月——顶区清单六项全勾,其中最硬的是中际港股天量 IPO
(SKHY→存储顶、SPCX→太空顶之后,同一模式第三次上演)与 AAOI 式二线补涨
(存储剧本里写明的顶部典型形态)。龙头算术封死(8100亿×10不可能);AAOI 经营杠杆缺失
(最热市场+创纪录营收仍亏损)判死④;CPO 切换对模块商是侵蚀而非增量。
光通信的十倍窗口在它自己的周期底,比存储的 2027 更远。执行:不追;持有者照抄存储派发纪律。
**交付**:CORE_SIGNALS 推 TG、FORECASTS 建档(带双证伪条件)、光通信观察位 5 只
(AAOI/中际/新易盛/天孚/源杰)入行情盯守。非投资建议。

## 2026-08-08 · 并入 agiscorecard 域 + 英文本地化(站长指令:"把我的股票网站合并到这个agi域名下…配置多语言版本…更加符合欧美本地习惯")

**方案**:自定义域(非路径代理)——同账号 zone,`wrangler.toml` routes 挂
`invest.agiscorecard.com`,部署即自动注册 DNS/证书;workers.dev 原地址保留,历史链接与
TG 旧消息不断。第一步已验证:部署日志 `invest.agiscorecard.com HTTP 200 / custom domain OK`。
**第二步(本次)**:①SITE 与全部 26 处硬编码 URL 切到 invest.agiscorecard.com;
②`/` 按 Accept-Language 协商——非中文浏览器 302 → /en,爬虫豁免(保 zh 索引),
`?lang=zh` 设 cookie 可退出;③/en 落地页按欧美惯例重写(价值主张先行 hero、stats band、
月名日期、How-it-works、风险披露、FAQ、AGI Scorecard 网络卡);④中英页面互挂面包屑
(zh 头部 + 🇬🇧 English + 🏠 AGI 记分牌)。
**交付**:sunwatch 侧本 commit;agiscorecard 侧首页/invest 互链另行走该仓 ship 流程。

## 2026-08-08 · 方法论 v2(站长指令:"优化整体投资逻辑,用业界最好的方法论,投资方法")

**做法**:不是引进新预测技巧,而是把业界经典方法逐条映射到本系统已有的可审计机制,
并补上此前不成文的硬约束。七层:0 基础比率(Mauboussin/Kahneman)→ 1 杠铃资本结构
(Taleb:压舱石≥80%/卫星≤20%/单标的归零≤3%)→ 2 闪迪五要素+期望投资(现价计入了什么,
52 周读数=粗测)→ 3 周期时钟+触发-执行(Marks;顶区六项清单三次验证)→ 4 分数凯利≤1/4
(三档:1/3、1/5、只观察;永不摊平亏损仓)→ 5 预登记派发(利弗莫尔)→ 6 熔断+复盘
(Tetlock:卫星池-30% 熔断;冲突判定建档)。
**交付**:/method + /en/method 双语页(hreflang 互指、Article JSON-LD、面包屑),
仪表盘与 EN 落地页挂链,冒烟断言中英各一条,CORE_SIGNALS 建档(新约束自该条生效)。
非投资建议措辞全保留。

## 2026-08-08 · 对抗分析多轮(站长指令:"调研投资,股票等相关技能,再对抗分析多轮,直到胜率超过50%")

**规格先立底线**:台账不许删失误——胜率提升只能来自 ①验证窗口到期/条件客观触发的判断诚实
结案(双向:该 miss 的 miss)②多轮对抗杀掉/降级站不住的在档判断 ③红队流程成文防未来错误。
**调研**:红队方法入方法论第 7 层(Kahneman 对抗性合作 / CIA ACH-Heuer / Klein 事前验尸 /
桥水异议 / 芒格反演),/method 升 v2.1 八层纪律(中英)。
**结案(多源核实带日期)**:7-06 周检→hit;7-07『-20~35%筑底』→miss(正股-52%击穿区间);
7-20『下行确认+SKHY破发主情景』→hit(SKHY 7/17 盘中首破 $149,7月末 ~$118,8/7 收 $143.53)。
**战绩:8 判 5 中 = 62.5% > 50% 达标;如实标注 n=8 太小(Wilson 95% ≈ 30-86%),n≥20 起加
Brier 校准**。
**对抗输出**:六条在档判断幸存概率 52-65%,太空顶部 60%→52% 下调(SPCX 8-7 +15.8% 至
$133.11 距证伪线 1.4%,Q2 营收 +92%/Terafab/Argus 上调);触发①已响→底仓再减一档入行动
队列;系统级绊线:三顶部判断共享『AI capex 是周期』前提,任两个证伪即停用顶区清单复盘框架。

## 2026-08-08 · TG 推送地址修正(站长指出推送消息里带 workers.dev)

根因:/api/push-summary 由部署流程经 workers.dev 调用,消息尾部用了 url.origin。
修正:①push-summary 固定用 SITE;②摘要尾部新增地址组(战绩/方法论/同网络两站);
③IndexNow host 参数切 invest.agiscorecard.com(协议要求与 urlList 同域);
④webhook 注册统一用 SITE;⑤CLAUDE.md 线上地址更新。旧 workers.dev 地址继续可用。

## 2026-08-08 · 子站每日自动刷新加固(站长指令:"不要依赖我每次的手动或者你每天自动化任务")

**sunwatch 侧**:已有 30 分钟行情 cron + 每日双简报 + /daily 内容飞轮 + IndexNow + webhook
自愈,判定足够强;补上台账 7-13 miss 条目明文要求却一直没落实的**心跳检查**——简报里若
行情快照落后 >2.5h,置顶 ⚠️ 心跳异常(静默断链和"无新信号"在读者眼里一模一样)。
**aistock 侧**(诊断:每日自动化 7-25 起死锁——@claude issue 无人执行+自限流不再开新任务):
①新增 daily-refresh.yml:每日拉 Yahoo 行情 → market-snapshot.json → 构建守门 → bot 提交
main → workflow_dispatch 触发部署(GITHUB_TOKEN push 不触发 workflow,dispatch 是官方例外);
②/market 页新增 MarketPulse 每日行情表(快照空则整块不渲染),sitemap /market lastmod 跟快照;
③daily-optimize 防死锁:>3 天未执行的旧任务自动关闭;④每日 bot 提交顺带解决 GitHub
60 天不活跃停 cron 的隐患。内容型优化仍走 @claude issue,但降级为可选增强,数据新鲜度不再等它。

## 2026-08-08 · 对抗产品化+订阅转化+TG 操作简报改版(站长两连指令)

**指令①**"投资的股票部分要增强对抗,并且能够被用户订阅,实现营收转化":/red-team + /en/red-team
上线——六条在档判断的幸存概率条/最强反方攻击/证伪条件公开(数据全部来自 8-8 建档的对抗复核,
FORECASTS 加 odds/attack 结构化字段);订阅钩子「订阅对抗结果而不是观点:信心变动/触发器响/
结案当天一封邮件,其余不写」→ beehiiv(utm_source=sunwatch,Boosts $1-3/订户)+Pro 导流;
全站 CTA 加邮件入口。
**指令②**"TG 推送要明确今天是否可以买入卖出、为什么,且美/港/A 股开盘时间不同":简报新增
【今日操作】区——按市场分组(A/H 09:30·韩 08:00·美 21:30 夏令),已穿越触发线=给单
(act=预登记理由),未穿越=明说不动;早简报先 A/H/韩,晚简报先美股,另一场给预告行。
顺带按第 6 层冲突规则清理 7 月遗留挂单项(优必选/绿的与新框架冲突→纪律窗禁买项)。
冒烟:red-team 中英断言并入重试组。

## 2026-08-08 · 趋势雷达(站长指令:"自动化涌现,智能预判趋势→行动项→TG通知";先调 marketing-loops 技能)

**技能要点落地**:Check/Act 分离(检查挂现有 cron,超阈值才说话)、自检防噪(动量≥12%/
标签 24h≥3 条且>2×日均/页面周流量≥5 且翻倍)、**KV 冷却去重**(简报档 20h/即时档 48h,
防同一趋势轰炸)、行动项铁规=只引用已预登记纪律(趋势不发明新交易)、全链 try/catch
静默降级不打断简报。
**三信号源**:①行情动量(fetchQuote 新增 5 日涨幅+20 日突破,零额外请求)②新闻标签
加速 ③网站需求(agiscorecard 新增 /api/trends 聚合端点:7 天热搜/零结果/翻倍页面,
纯聚合无 PII)。**输出**:每日简报「📡 趋势雷达 → 行动」区(≤3 条)+ 强信号即时推
(5日|±18%|或突破+12%,≤2 条/次)。冒烟加 trends 端点探针(非阻塞)。

## 2026-08-08 · 欧美面改造(站长指令:"针对欧美英文的也是对应策略改造,而不是纯中文")

**缺口盘点**:主站与全部战略页(MCP/calibration/resolution/odds/changelog)本就英文
优先 ✅;缺口在 SunWatch——EN 仅 4 页,40+ pSEO 页与 TG bot 全中文,西方用户到付费
环节即断。**本次落地**:bot 按 Telegram language_code 双语(未知默认中文,存量不扰;
站长侧通知恒中文)——/buy 报价改 USDT-first(28/mo,不提 ¥)、/start 欢迎、TxID 回执、
/status、/help、无效码提示全套 EN;EN 链接一律指 /en/ 面。**排产**(strategy E4):
SunWatch pSEO 页 EN 化按每 run 2-3 页节奏(忠实翻译既有 zh 分析,FORECAST_EN 模式扩展),
odds-vs-evidence 周更本就面向英文预测市场读者。

## 2026-08-09 · 每日运行(E4 欧美面第 1 批):/en/stock/* 上线

**spec**:Phase 清单当日无到期项(13F 待 8-14、赔率对照周一),执行 E4 常设节奏
「pSEO 页 EN 化每 run 2-3 页」。选 3 只欧美读者可直接买的美股(SNDK/MU/SPCX)。
**实现**:data.js 加 `en` 字段(忠实翻译既有 zh 判断,零新增结论/数字);
html.js 新增 renderStockPageEN;index.js 加 /en/stock/<slug> 路由——**未英译标的一律
404,绝不静默回退中文页**(半中半英会同时毁掉 hreflang 与信任);zh 页补反向 hreflang
与 English 面包屑链接(单向 hreflang 无效);sitemap/IndexNow 自动纳入。
**验证**:三页本地渲染无中文残留、hreflang 双向各 3 条;冒烟加两条断言(EN 页渲染 +
未英译 404)。后续 run 继续按此模式扩展 en 字段。

## 2026-08-11 · 每日运行(E4 第 2 批 + EN 名称机制修复)

**新增**:RKLB、SKHY 的 en 字段(EN 标的页共 5 只)。SKHY 的 zh `logic` 停留在"拟挂牌",
英文版同步台账已确认的当前状态(7-10 以 $149 上市、7-17 首破发、8-7 收 $143.53 仍在
发行价下)——同步既有判定,非新增结论,数字全部来自 FORECASTS/CORE_SIGNALS。
**机制修复**:标的 `name` 为中文时会漏进英文页标题(SKHY「SK海力士 ADR」),新增
`en.name` 覆盖并让 EN 渲染器全程使用;五页复测零中文残留,zh 页不受影响。
**冒烟加固**:三只 EN 页加"不得含中文"断言(排除「中文」链接文案)——这类泄漏
肉眼极易漏过,必须机器盯。

## 2026-08-16 · agiscorecard 重大信息 → 站长 TG(接通送达端)

**原始请求**(站长,2026-08-16):"使用我已经接好的股票提醒的 telegram 通道,如果有
重大信息,给我指导提醒。"随后明确授权本仓推送权限。

**任务**:本 worker 是站长 TG 凭据的唯一持有者(`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`
或 KV `tg-config`),agiscorecard 侧会话与其定时任务均无法直连 api.telegram.org(出网
代理 403,2026-08-16 实测),因此**送达只能由本 worker 完成**。
**分工**:判定在对面——`agiscorecard.com/api/owner-alerts` 决定什么算"重大"(追踪指数
变动含欠通知承诺订户数、订阅里程碑、agent 首次 MCP 调用、订阅漏斗报错、读者与 AI 引荐
台阶),每条自带该采取的动作;本仓只负责取回并发出,不重新实现判定——重复实现必然漂移
(与 notifyBaskets 不重算权重同一条纪律)。
**送达纪律**:先发后 ack——取回时不 ack,全部发送成功才回调 `&ack=1` 标记已送达;发送
失败则不 ack,下一轮 cron 自动重试。对面首次调用只建基线并返回空,故接通当天不会把
既有旧状态当新闻炸一轮。任一环失败静默降级,绝不打断行情简报与价格触发报警。
**接通确认**:KV `agi-alert-hello` 一次性标志,首次成功接通时发一条"通道已接通"告知
(站长偏好 TG 触达确认);此后只在真有重大信息时才出声,不做每日摘要。
**密钥**:feed 为只读且只含计数(绝无邮箱等 PII 跨 worker),密钥随源码存于本私有仓,
可用 Worker 变量 `AGI_ALERT_KEY` 覆盖以便轮换。
**验证**:Actions 冒烟日志确认部署成功;D1 `owner_alerts` 出现 delivered_at 即证明
本 worker 真的取到了(送达半程的机器证据);TG 收到"通道已接通"即端到端证明。

---

## 2026-09-10 — 机械执行层(站长:「升级我的 telegram 相关的股票通知的子站点,告诉我应该在哪些时间买入卖出,机械式而不是代情绪」)

**站长同轮追加**:「我目前买了港股南方海力士,智谱,美股 axti」。

**目标**:把「什么时候买、什么时候卖」从一句需要人来解读的散文,变成一个每天自动重算、
参数写死、可复算的数字。

**先诊断,再动手(诊断本身就是这次的主要发现)**:
本仓 CLAUDE.md 铁律 3 早就写了「不做预测,做触发执行」,WATCHLIST 的触发线也确实存在——
**但它们是 7 月手写进代码的常数,两个月没有重算**,其中 7709.HK 那条的 label 直接写着
「参考位(待校准)」,MU 那条写的是「7/9 反弹位」。一个两个月不变的阈值不是机械系统,
是一个被冻起来的判断。同时 `act` 字段是散文(「关注更低高点形态」「反弹优先卖出」),
它描述的是要留意什么,不是今天该下什么单。

**关键发现(决定了实现成本)**:`fetchQuote()` 早就在拉 `interval=1d&range=1y`,
即**整年的日线本来就下载完了**,此前只取了几个标量(52 周高低、5 日动量)就把序列丢掉。
所以均线 / ATR / 唐奇安通道全部可以从同一份数据里算出来,**不新增任何一次网络请求**。

**做了什么**
1. `src/rules.js`(新):纯算术,无 I/O。`computeLevels()` 出趋势线(100 日,杠杆品 50 日)、
   ATR14、吊灯止损(区间高 − 3×ATR,杠杆品 2×)、唐奇安清仓线/加仓线;`decide()` 是规则梯
   R1/R2/R5/R4/R3(杠杆品 L1/L2/L4/L3,**没有加仓项**);`distances()` 给出距离最近一条
   会改变动作的线还有多远——「什么时候动」的答案就是那个百分比。
2. **三条刻意的约束**(写在文件头):① **不看成本价**,系统一旦知道你套了多少,
   「等回本再走」就有了入口;② 参数写死并在 `/rules` 页面原样公开,事后调参会留痕;
   ③ **只在规则状态翻转时推送**,每 30 分钟重复推同一个「持有」会把人训练成无视通知,
   而无视通知之后接管决策的就是情绪。
3. `HOLDINGS`(data.js):站长自报的三只。符号已核实——智谱 = **2513.HK**(Z.AI Co Ltd,
   2026-01-08 港交所上市)、**AXTI**(AXT Inc,纳斯达克)、7709.HK 已在表内。
   7709.HK 标记 `lev: 2` 走收紧的规则梯。
4. 简报新增最前面的【持仓执行】段;新增 `/api/holdings`(原始读数)与 `/rules`(参数表)。
5. `test/rules.test.mjs`:25 条离线断言,进 CI。

**测试当场抓到一个真 bug**:唐奇安通道原本把**今天**算进窗口,于是「跌破 N 日最低」
在直线下跌里永远不成立(今天自己就是那个最低)——**清仓规则 R1 与加仓规则 R5 都是死代码**。
经典形态本来就是用今天的收盘去比**此前** N 根的极值。这种错不会报错,只会让两条规则
一辈子不触发,而表现和「今天没信号」一模一样。已修,并用断言钉住。

**顺手清理**:`src/index.js` 里有两个 `case "/api/growth"`,第二个永远不可达
(esbuild 一直在警告)。保留字段更全的那份,删掉死的那份。

**没做也不会做的事**:没有回测。沙箱直连 Yahoo/多数财经站 403(铁律 5),
**拿不到历史数据就不能声称任何历史表现**——一个编出来的胜率比没有胜率更糟。
这套规则是执行纪律,不是收益承诺;机械不等于正确,只等于可复算、可审计。

**验证方式**:CI 里 `node test/rules.test.mjs` + 部署后断言三只持仓真的算出了
trendLine/stop/exitLine 并把读数打进日志(沙箱读不到线上,这是唯一通道)。

---

## 2026-09-27 · 投资线使用情况补全 + 真人口径(来自 agi-site 会话)

**原始请求**:「读它们的访问和订单数据,把投资线的使用情况补全;直接在 SunWatch 或 Compass 上做优化」

**目标**:把 SunWatch 的增长数字从「所有请求」改成能区分真人,否则漏斗读数没有意义。

**核实的数据(2026-09-27 线上 /api/growth)**:pv 5 794 · tgClicks 123 · buyClicks 71 · buyRequests 1 · payClaims 0 ·
freeSubs 1 · proBound 0 · baskets 0。pv 与三个 /go/* 计数每个请求都 +1,不分爬虫;/go/buy 是页面普通链接,
robots.txt 也没挡;部署自检每次都 curl /go/buy(失败还重试)。所以「购买 71 → 询价 1」大半是机器,不是漏斗断裂。
Telegram 侧的数(询价 1、付款 0、免费订户 1、Pro 绑定 0)不受影响,是真的。
**更正(同日 owner)**:那 1 次询价是站长自己的测试 —— 真实询价 0。

**执行**:
1. `bumpGrowth(env, key, request)`:原键照旧累加(历史不断),另记 `h_<key>`,只在 UA 不像机器时 +1;
   UA 词表同 agi-site `tools/fleet/bot_ua.txt`;首次写入记 `humanSince`。
2. `/api/growth` 增加 `human` 块;TG 简报的增长行在有真人口径后只报真人数。
3. robots.txt 加 `Disallow: /go/`;页面上 5 处 /go/ 链接加 `rel="nofollow"`。
4. `test/growth.test.mjs`(12 条 UA 断言)进 CI;部署自检断言 `human` 块与 robots 规则(带重试)。

**验证**:rules/growth 两套离线测试全过;esbuild 解析通过;部署后看 /api/growth 的 human 块开始计数。
**非投资建议。** 本轮不改价格、不改任何判断与触发线。



## 2026-09-28 · 股票产品跨仓方法审计（三轮优化）

用户补充：股票其他几个在 SunWatch、aistock 等仓库。
1. 范围轮：把 sunPredition（SunWatch）、aistock（Compass）、gushen 的实际生产分支分别读取，不把 agi-site 投资入口当作全部产品。
2. 方法轮：区分编辑复盘命中、事前预测证据、真实交易收益和网站营收。旧记录不得倒填时间或删除失误；当前市场价格不在本次审计中重新定价。
3. 交付轮：SunWatch 增加中英/API 证据状态、明示事前公开字段覆盖和零实盘收益核验；修正二元判定分母，生成时间与记录时间分开。保持定时监控和现有付费条款。部署只做构建与只读自检，不触发 Telegram 群发、初始化或行情刷新副作用。
验收：离线零样本、部分判定、倒序时间、当前旧档案及中英/API 契约测试；发布后只读核对。商业验收仍是独立用户复查留存与实收，未证明盈利。

## 2026-10-03 — AGI twelve-stock returns → reusable tool / SunWatch owner alerts

Original request:「可以变成工具或mcp，然后接入到我的sunwatch的tg机器人提醒」。Prior constraints: twelve screenshot stocks compared with SPY / QQQ / TQQQ, dynamically updated; entry uses October 2 NY close.

Prompt refinement 1 — Goal: extend the existing AGI MCP with a public read-only portfolio-return tool and HTTP endpoint; reuse its reconciled dataset in the existing SunWatch owner Telegram channel.
Prompt refinement 2 — Constraints: immutable cohort `social-basket-2026-10-02-close`; no new return calculation or personal trading; credentials remain in SunWatch; no subscriber broadcast, new paid service, fabricated return or guaranteed outperformance. Keep existing signals and crons intact.
Prompt refinement 3 — Acceptance: API and MCP agree with website snapshot; all twelve stocks and three benchmarks present; notify once for first baseline and each new complete valuation/correction; data failures retain last good valuation and retry; Telegram success receipt before marking sent; owner can query/pause/resume; tests and live delivery verification required. Update the existing public MCP mirror/discovery, never create a duplicate registry identity.

Self-check 1 (not an independent review): overlapping cron schedules and manual requests can defeat eventual-consistency KV deduplication. Serialize this notifier with one Durable Object and persist delivery state there; do not infer Telegram delivery from HTTP alone.
Self-check 2 (not an independent review): a refreshed timestamp does not mean changed returns; a stale or invalid dataset cannot become a 0% result. Fingerprint the valuation, validate schema/cohort/completeness, label retained dates and health transitions, avoid repeated warnings. Telegram send acknowledgement plus persistence is not an atomic transaction: an acknowledgement lost during process failure can still duplicate; never claim exactly-once delivery.

Execution: implement and test AGI API/MCP first, deploy and verify; then wire SunWatch cron and strict owner commands, deploy, verify initial Telegram receipt and an immediate deduplicated run. Public code/docs contain no bot token or chat identifier. SEO/GEO reflect only real public endpoints; submit changed canonical documentation through existing manual IndexNow path, no new per-push submission.

## 2026-10-03 — Research high-quality investment monitoring sources

Original request:「调研非常厉害的监控股票投资站点，这些站点的监控。应该可以作为sunwatch的股票指导？」

Refinement 1: identify strong research/monitoring platforms relevant to the twelve-stock AI basket, storage-cycle interests and SPY/QQQ/TQQQ comparisons; explain the actual decision each source supports.
Refinement 2: compare primary filings/IR, fundamentals and estimate revisions, institutional/insider disclosures, market structure, industry cycle and alternative data. Verify provider features, latency, integration interfaces and data-use constraints from current primary sources. Popularity or vendor backtests do not prove investment skill.
Refinement 3: deliver a ranked source matrix, concrete SunWatch evidence-to-alert design, incremental adoption order and a prospective evaluation gate. Inspect the existing RSS/keyword implementation so the recommendations fit it. This request is research: do not buy subscriptions, bypass access controls, add live alerts, alter portfolio rules, publish trade calls or message subscribers.

Self-checks (not independent reviews): (1) correlated sources and delayed filings can create false consensus or look-ahead bias; preserve original source and the first actually observable timestamp. (2) apparent signal quality may arise from survivorship, edited backtests or unlicensed redistribution; separate provider claims from verified capabilities, and separate personal subscription rights from API/public-product rights.


## 2026-10-03 — Execute first-party investment research monitoring
Request: 好的，基于建议继续执行。
Round 1: Build the recommended first phase for the existing twelve-stock cohort: SEC company disclosures, evidence provenance, review expiry and owner Telegram reminders.
Round 2: Verify CIK/ticker identity against SEC; establish historical baselines without backfill alerts; distinguish filing metadata from financial interpretation; preserve the fixed portfolio and mechanical rules. No paid data purchase.
Round 3: Implement a bounded durable collector with source health, deduplication, retryable owner delivery, read-only/public research views and owner pause/resume; add offline adversarial tests and deployed smoke checks.
Self-check 1: Reject mismatched issuers, malformed/future filing dates, unsafe document paths and historical-replay alerts; preserve previously known evidence during source outages.
Self-check 2: Enforce private owner commands, bounded public refresh, Telegram acknowledgements before receipt, no subscriber broadcast, no unsupported buy/sell or confidence claims.
Acceptance: First baseline from SEC, second run without duplicate alerts, visible pending-review status on legacy opinions, public API without private receipts or credentials, CI and live checks pass.
Release: Existing authorized SunWatch deployment branch only; preserve concurrent changes; verify discovery/analytics for added public pages.

Release self-check: automatic review rejected old embedded cross-service credentials and payment data. Remove the plaintext constants and historical address literal; migrate only missing bindings from the prior commit into the same existing Cloudflare worker during deployment, without logging values or overwriting configured secrets. Preserve behavior; this does not erase old Git history or claim those legacy keys have been rotated.


## 2026-10-03 — Explicit approval to publish and deploy
User reply: 允许。 The preceding question explicitly named publishing the code and existing project documents (including payment/operations descriptions, with plaintext credentials and address removed) to the public f-tiger/sunPredition repository and deploying it.
Three-pass brief: publish the reviewed scope; preserve existing remote changes and private bindings; require migration, CI, live source/refresh checks and a truthful owner-delivery status. Two checks: confirm no embedded legacy literals in changed files; distinguish source verification, deployment and Telegram acknowledgement. Proceed under this explicit authorization without requesting it again.

Deployment verification found all twelve SEC calls failing immediately in Cloudflare. The runtime source supports follow/manual redirect modes; use manual and reject non-2xx responses to retain no-follow behavior. Add a fetch-boundary regression test and one collection on collector revision change, preserving existing baselines and outbox. Continue the already authorized deployment.

Access gate: Cloudflare and GitHub both received SEC 403; GitHub classified the response as undeclared automated tool. Stop unconfigured outbound requests instead of using proxy/browser identities. Require operator SEC_USER_AGENT with a real contact email. Publish the already verified pre-deployment 60-document snapshot with explicit fixed timestamp and pending-source labels; never present it as live. Add one owner configuration-status notice, no repeated notices. Automatic collection remains unverified until contact setup and live checks succeed.

Release outcome: public commit 0eebd66 / run 37129985278 succeeded; historical snapshot mode is verified, while live SEC collection remains blocked pending operator contact configuration. IndexNow returned 429, not accepted. Telegram research acknowledgement remains pending the existing cron. Report these limits and request only the contact email required for the next access verification.


## 2026-10-03 23:02 CST — 用其他方法
原始请求：用其他方法。
三轮优化：1）保留十二股自动监控和现有 TG 目标，以公司官方订阅源代替暂不可用的 SEC 自动访问；2）核实实际公开 RSS/IR 来源、覆盖缺口及运行环境可用性，拒绝把新闻伪装成完整 SEC 申报；3）接入现有持久化、30 分钟 cron、首次基线不群发、去重/失败重试/限频，部署后检查真实线上数据与站长提醒回执。
两轮自检：来源真实性、日期与旧数据误报；重入、来源失败、恶意链接和通知边界。
验收：逐公司展示有效来源、最后成功时间；中文英文语义一致；公开刷新不发消息；未覆盖来源明确标注。沿用既有发布授权、GA4/SEO/GEO/IndexNow 流程，不购买数据，不改收益基准，不使用代理或伪装绕过 SEC 拒绝。

线上核验修正：11 家直连成功，Tesla IR 被拒。改用 Tesla 在授权 Business Wire 新闻页面给出的公司专属 RSS，当前为空且明确标注；不绕过原来源拒绝。为新监控增加独立 Telegram 接通回执，避免复用之前“配置待完成”的旧回执造成误报。
