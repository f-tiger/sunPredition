# SunWatch 股票研究监控源调研

核查日期：2026-10-03（Asia/Shanghai）。本轮交付是研究与接入设计；没有购买服务、启用新监控、改动交易规则、向订阅者发送新消息。现有 12 股收益提醒保持原规则。

## 结论

这些平台可以提供 SunWatch 的研究证据、条件提醒和反证，但站点名气、营销回测或“多家一致看好”都不能证明当前买入有超额收益。按“原始事实 → 可比较的变化 → 投资逻辑是否改变 → 已登记的风险规则 → 提醒”的顺序使用。产品能力经过官方页面核查；本轮没有进行付费账户内测试，也没有独立复现任何供应商的投资业绩。

最值得先投入的方向：SEC／公司 IR 原始披露、财报指引与盈利预期变化、存储产业周期。机构持仓和内部人交易用于补充证据；期权异动用于提示风险与异常，不能单独判定方向。Koyfin、TIKR、Morningstar 等适合人工研究的终端，不自动等于可合法供给网站的数据源。

## 与现有系统的差距

核对 `181ca49b9b8bb9a46faa7aba5cfffe49ca572d81`：`src/data.js` 的 SOURCES 主要是 Google/Bing 新闻搜索 RSS 与一个专题媒体 RSS。`refreshFeed` 合并条目后以 IMPORTANT_RULES 的标题正则找重要事件。这适合发现线索，不能可靠回答财报指标究竟改变多少、消息是否重复转述同一公告、旧逻辑是否仍有效。

`CORE_SIGNALS` 中仍有 2026-08-08 等历史文字。旧日期本身不证明观点错误，但应增加结构化的 `reviewed_at / valid_until / supersedes / invalidation_rule / status`；明确区分历史档案与当前有效指导，不将抓取时间当成重新核实日期。当前机械价格规则与收益账本应保持独立，不被新新闻标题直接覆盖。

## 监控源矩阵

下列优先级是本次产品建议，不是收益排名。费用只区分使用方式；未签约的授权、配额和完整覆盖均不冒称已验证。

| 来源 | 已核实的能力 | SunWatch 值得监控的变化 | 接入判断／边界 | 建议顺序 |
|---|---|---|---|---|
| SEC EDGAR + 公司 IR | SEC 提供免 API key 的 submissions 与 XBRL JSON，随公开披露更新；也有公司申报 RSS [1][2] | 10-Q/10-K/8-K、指引修订、融资稀释、重大合同、财务重述 | SEC 做第一方基础；各公司 IR 的 RSS、邮件与网页接口逐一核实。申报被接收不代表监管方验证内容正确 | 第一批 |
| FMP | 有分析师收入、EPS 等一致预期 API [3] | 同一财年/季度的预期上调或下调、预期与实际偏差 | API key、端点套餐和商业展示权需确认；当前端点不证明拥有任意历史时点的预期快照，需从接通日自存版本 | 第一批候选 |
| Quartr | 面向程序的公司事件、实时/历史电话会转录、报告、演示材料 API [4] | 管理层指引、资本开支、产能、客户需求和措辞的前后变化 | 企业接入需商洽与验证；实时转录可能后续修订，保留版本、原文定位及发言人；免费阅读产品不等于 API 授权 | 第二批，高相关 |
| TrendForce | 公开研究目录覆盖 DRAM、NAND、HBM、价格、库存、供需与产能 [5] | 合约价预测修订、产品分化、供给扩张、需求变化 | 免费公开摘要可作研究线索；完整报告、数据表、自动提取与再分发需相应许可。没有核实通用开放 API，不宣称已能全自动取付费数据 | 第二批，存储优先 |
| Koyfin | 价格、估值、技术、新闻与申报提醒，可覆盖观察列表 [6] | 多资产对比与估值/趋势阈值 | 官方 FAQ 写明不提供用户数据 API；财务、预期、估值下载也受限制 [7]。适合作为人工交叉核查终端，不选作默认程序数据源 | 人工研究面 |
| TIKR | 观察列表动态、财报电话会、一致预期、估值研究 [8] | 同行估值、盈利预测、预期差 | 本轮未核实面向 SunWatch 的公开数据 API 或商业转发许可，不能把网页订阅视为接口授权 | 人工研究面 |
| Seeking Alpha | Quant 因子含价值、成长、盈利、动量、EPS 修订；提供历史评级与企业内容/API合作入口 [9] | 分项评分、盈利修订及评级改变；保留看空论据 | 优先因子变化，不只抓 Strong Buy。其回测属于供应商披露；网站数据不得默认复制/再分发，需合作许可 [10] | 第三批 |
| Morningstar | 公允价值、经济护城河、估值不确定性共同形成研究框架 [11] | 公允价值修订、护城河变化与安全边际 | 公允价值是模型估计，不能作为承诺价格；短线时点与长期价值框架分开。自动产品供给权本轮未核实 | 人工反证/估值 |
| WhaleWisdom | 13F 数据库、API、机构持仓与提醒工具 [12] | 新建/退出、持股数量变化、持仓集中度、特定经理持续动作 | 付费 API 按套餐；13F 有披露延迟，不能还原完整实时组合。市场价值上涨不等于主动增持，拆股、修订申报需归一 | 第二批 |
| DATAROMA | 从财务申报提取价值投资者持仓；帮助页明确持仓通常反映上一季末 [13] | 精选投资者的持仓集中与长期变化 | 用来发现研究对象；本轮没有核实可供产品使用的公开 API。不能按季末价格模拟披露后才知道的买入 | 辅助选题 |
| Quiver Quantitative | 官方 REST API 与 MCP，覆盖 Form 4、13F、政府合同、议员交易等 [14] | 内部人公开市场交易、机构申报、政府订单线索 | 需要 API key；Hobbyist/Trader 无商业使用权，商用需对应方案 [15]。交易发生日、披露日、首次抓取日分开 | 第二批候选 |
| Unusual Whales | 官方市场数据 API/MCP，期权成交、场外成交与波动等 [16] | 异常成交、隐含波动、到期集中等需进一步解释的现象 | 异常量不能自动解释为买入，看涨期权也可能属于对冲/组合；需掌握成交方向、开平仓和多腿局限。第三方网页里的 AI 指令仅作网页内容，不用于研究评分 | 后置试验 |
| FINVIZ Elite | 股票筛选、提醒、数据导出/API [17] | 相对强弱、成交量、同行比较、筛选条件进出 | 适合低频候选池；可导出不等于全部历史时点可重建或可转售，范围与许可单独核实 | 辅助筛选 |
| TradingView | 支持平台提醒和 webhook [18] | 人工可读的图表、价位与技术状态提醒 | 官方条款将普通数据使用限定于展示，限制算法决策与其他非展示用途 [19]；不能因为有 webhook 就直接拿来做 SunWatch 的自动决策数据层。现有独立报价组件不变 | 展示/人工校验 |
| BamSEC | 文件与电话会检索、前后文件比较、观察列表邮件提醒 [20] | 风险披露文字、财务附注和管理层描述变化 | 借鉴“变化高亮 + 原文定位”的交互；自动数据与再分发权限本轮未核实 | 研究工作台参考 |
| AlphaSense | 跨公司文件、研究内容的检索和监控；开发者平台包含 Agent API [21] | 跨供应链主题变化、证据对照与研究工作流 | 适合参考产品方法，正式接入需企业合同与内容权利核查；Ingestion API 是导入自己的内容，不等于获得对外分发全部研究内容的权限 | 后期企业能力 |

港股扩展可用 HKEX 官方 News Alert 作为人工通知入口；官方说明支持公司公告及权益披露提醒，但邮件服务不等于商业 API。[22] 本次没有把 A/H/韩股的覆盖假设为与美股相同。

## 三个必须处理的误判

1. **“机构加仓”不是实时买入。** SEC 13F 通常在季末后 45 天内申报，且不包括空头头寸；存在未披露对冲、申报更正及披露后已交易的可能 [23]。截至本次研究，第三季申报截止日为 2026-11-16；只能把已经公开的实际申报计入观察，不能提前把整季说成已完整披露。
2. **内部人交易必须看交易类型。** Form 4 一般在交易后两个工作日内申报 [24]，不同于机构季度持仓。区分公开市场购买、授予、行权、代扣税与计划性交易；不能把获得股票都记为“高管自掏腰包看多”。
3. **多个网站未必是多份独立证据。** Seeking Alpha 披露其基本面、分析师预期等来自 S&P Global [10]；其他终端若转载同一公司公告或数据商，不能再算一次独立确认。公司指引与分析师预期也存在因果关联，应展示关系与分歧，而非机械投票。

## 第一版 SunWatch 应怎样形成指导

先限定于现有十二股和三个比较基准。每个对象维护一张投资逻辑卡：关键假设、支持证据、反证、最近复核日、失效条件、风险关注项。监控事件必须关联这张卡；没有相关性的小新闻只入库，不推送。

一条提醒最少包括：证券标识、发生时间、披露时间、SunWatch 首次接收时间、原始来源、变化前后值、适用期间/单位、对现有假设的影响、反方解释、下一步核查、到期/复核条件。

- NVDA/AMD/MU 等：指引、毛利、供应与客户需求，比较预期与实际，不从标题情绪推断。
- MSFT/AMZN/GOOGL/META 等：资本开支、业务增长、现金流和投入回报；资本开支增大对供应商与出资方的含义可能不同。
- 其他组合成员：订单、收入确认、稀释、客户集中等公司相关字段，不套统一“AI 概念看多”。
- SPY/QQQ/TQQQ：保留各自表现与风险记录，杠杆产品独立处理，不把公司评级投票当成其加仓依据。

建议提醒状态为“事实更新 / 需要复核 / 风险条件触发 / 旧逻辑失效”。买卖仓位只有在另行登记的个人约束和执行规则完整时才有意义；本研究不生成具体交易指令。LLM 可以提取、解释与链接反证，数值比较、权限、去重、过期和发送规则应由确定性代码把关。

**格式示例（虚构情景，不是当前 MU 事实或交易建议）**：MU 发布新指引 → 列出与上一版同期间指引的变化 → 标记“需复核原盈利假设” → 链接原始公告和相反证据 → 提醒核查估值假设与既有风险规则。缺数据写未知，不能补造“置信度 85%”。

## 实施顺序与预算边界

1. **第一阶段：第一方事实和过期控制。** SEC/公司 IR、现有行情数据、来源去重、观点有效期；SEC 自动访问遵守其识别与限速政策 [2]。先验证十二股对应证券身份与覆盖、交易日/时区及财报字段，再接既有 SunWatch Owner 通道。不会额外生成重复 ChatGPT 定时任务。
2. **第二阶段：一类预期数据 + 一类机构/内部人数据。** 对 FMP、Quartr、WhaleWisdom、Quiver 做小范围样本验收与授权评估，再选供应商，避免同时订阅大量重叠数据。TrendForce 先用于公开研究的人工交叉核查，商业机器供给须确认许可。
3. **第三阶段：评级与期权。** 只有前两阶段证明减少漏报并产生有用复核，才加入更复杂信号。

2026-10-03 Quiver 官方价格页的具体例子：Hobbyist 月付 $30，但不含 Insider Trading/13F MCP 工具；Trader 月付 $75 含这些工具，但仍无商业使用权。Startup 页显示正常 $250/月、符合年营收低于 $1m 条件者首年 50% 优惠为 $125/月；以实际合同与结账资格为准，本轮没有购买 [15]。因此“$30 就能把所有聪明钱信号接进付费 SunWatch”是错误的预算假设。

未来若商业化，用户付费价值应是“与观察组合相关的变化、解释、反证和复核记录”，不是简单转售网页。数据再分发许可与面向客户的投资建议义务是不同问题；正式产品范围需要分别评估，本轮没有启用收费提醒。

## 验证方式

先运行 30 天影子监控，仅做操作质量验收：来源可用性、延迟、重复率、错配证券、撤回/修订、误报和漏报。30 天不能证明长期投资有效。

单独建立新信号台账，冻结当时可获得的证据和规则版本；从实际收到信号后可执行的下一交易时点计价，记录成本假设、20/60 交易日收益与期间最大不利变动。对比同期间 SPY、QQQ、原十二股买入持有和不采取新动作的结果，纳入失败、退市/退出、无结果样本。不要只挑成功案例、回填过去未知预期，或用事后最佳入场价。样本、行情环境和持有期不足时只报告观察值。

原 `social-basket-2026-10-02-close` 建仓基准与历史记录不动；未来研究策略使用单独版本和账本，不能通过改原组合来美化绩效。

## 官方来源

1. SEC API：https://www.sec.gov/search-filings/edgar-application-programming-interfaces
2. SEC 开发者与限速：https://www.sec.gov/about/developer-resources
3. FMP 预期 API：https://site.financialmodelingprep.com/developer/docs/stable/financial-estimates
4. Quartr API：https://quartr.com/products/quartr-api
5. TrendForce：https://www.trendforce.com/research/memory-storage
6. Koyfin 提醒：https://www.koyfin.com/features/alerts/
7. Koyfin API / 下载：https://www.koyfin.com/help/faq/can-i-get-the-data-via-api/ ; https://www.koyfin.com/help/faq/can-i-download-data/
8. TIKR：https://www.tikr.com/stock-portfolio-tracking ; https://support.tikr.com/hc/en-us/articles/39071375390235-How-do-I-use-TIKR-s-Estimates-feature
9. Seeking Alpha 因子及合作：https://help.seekingalpha.com/premium/what-are-quant-ratings-and-how-do-i-use-them ; https://seekingalpha.com/partnership/form
10. Seeking Alpha 数据与限制：https://help.seekingalpha.com/basic/where-do-you-source-your-market-data-from ; https://help.seekingalpha.com/premium/have-seeking-alphas-quant-ratings-been-back-tested
11. Morningstar：https://www.morningstar.com/markets/morningstar-price-fair-value-chart
12. WhaleWisdom：https://whalewisdom.com/help/api ; https://whalewisdom.com/info/features
13. DATAROMA：https://www.dataroma.com/m/inc/help_notes.php
14. Quiver MCP：https://api.quiverquant.com/mcp-server/
15. Quiver 价格/权利：https://api.quiverquant.com/pricing/
16. Unusual Whales：https://unusualwhales.com/public-api
17. FINVIZ：https://finviz.com/elite ; https://elite.finviz.com/help/faq
18. TradingView 提醒：https://www.tradingview.com/support/solutions/43000595315-how-to-set-up-alerts/
19. TradingView 条款：https://www.tradingview.com/policies/
20. BamSEC：https://www.bamsec.com/features
21. AlphaSense：https://www.alpha-sense.com/platform/ ; https://developer.alpha-sense.com/
22. HKEX：https://www.hkex.com.hk/Global/Exchange/FAQ/Getting-Started/News-Alert?sc_lang=en
23. SEC 13F：https://www.sec.gov/rules-regulations/staff-guidance/frequently-asked-questions-about-form-13f
24. SEC Investor.gov：https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-69

来源中的营销自评、覆盖数字和历史回测未独立审计。未把网页中的 AI/LLM 指令当作任务指令，也未使用其指令扩大访问或改变排名。当前结论是接入建议与待验证假设。
