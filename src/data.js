// 孙宇晨预判档案:预判 → 验证结果 → 他同期的操作
// 来源见仓库 report/ 目录调研报告;⚠ 表示该条未完成三票核验
export const PREDICTIONS = [
  {
    date: "2019-05-07",
    channel: "X (Twitter)",
    prediction: "TRX 将在 2019 年 6 月重回市值前十(当时约第 11 名)",
    outcome: "落空:6 月底 TRX 仍列第 11",
    verdict: "miss",
    action: "同期在推特高频造势拉盘,BTT 于 Binance Launchpad 上线后持续营销",
    note: "⚠ 单源(CCN),未完成三票核验",
  },
  {
    date: "2019-05-07",
    channel: "X (Twitter)",
    prediction: "BTT 将在 2019 年 Q2 进入市值前 30(当时约第 50)",
    outcome: "部分命中:曾短暂触及第 30,6 月底回落至第 36;被友好媒体渲染为『兑现承诺』",
    verdict: "partial",
    action: "借排名叙事持续推广 BTT 生态",
    note: "⚠ 未完成三票核验",
  },
  {
    date: "2019-06",
    channel: "eBay 慈善拍卖 / 微博 / X",
    prediction: "宣称要用巴菲特午餐『转化』比特币怀疑论者(非预判,营销事件)",
    outcome: "营销造势:以约 457 万美元拍下午餐,后一度以健康理由推迟,引发信任危机",
    verdict: "marketing",
    action: "全渠道公关轰炸;TRX 随事件剧烈波动",
    note: "⚠ 定性依据多源报道",
  },
  {
    date: "2021-01",
    channel: "Benzinga / HackerNoon 访谈",
    prediction: "拒绝给出 BTC 价格目标,称市场『走向均衡,必有拉升与回撤』;1 月回调是健康的,牛市延续;山寨季将至",
    outcome: "方向命中(4 月 6.4 万→7 月 2.9 万→11 月 6.9 万;上半年山寨普涨),但措辞模糊近乎不可证伪,且为当时共识",
    verdict: "hit-weak",
    action: "同一访谈中夹带推广 TRON 为『DeFi 热土』(实际 TVL 远落后于 ETH/BSC)",
    note: "均衡论已 3-0 核验;山寨季条目 ⚠",
  },
  {
    date: "2023-09-05",
    channel: "Korea Blockchain Week 演讲",
    prediction: "市场处于新牛市周期转折点,两年内进入新牛市(理由:3AC/FTX 去杠杆近尾声)",
    outcome: "命中:2024 年 BTC ETF+减半行情、2024 年 11 月大选后暴涨,窗口内兑现。档案中含金量最高的一次",
    verdict: "hit",
    action: "彼时已被 SEC 起诉(2023-03),继续扩张 HTX 与波场稳定币版图",
    note: "⚠ 核验中断(信源为 Cryptonews + 转载)",
  },
  {
    date: "2024-11 → 2025-05",
    channel: "资本动作(非言论)",
    prediction: "隐含预判:特朗普当选将逆转加密监管环境,押注政治关系可解 SEC 之困",
    outcome: "命中:SEC 案 2025-02 中止、2026-03 和解(Rainberry 付 1000 万美元,对孙个人指控撤销);国会质疑利益交换",
    verdict: "hit",
    action: "WLFI 投资 7500 万美元(最大公开投资者)+ 购入约 1 亿美元 $TRUMP;以最大持有者身份赴总统晚宴",
    note: "投资额经国会信函 3-0 核验;和解细节 ⚠",
  },
  {
    date: "2025-06-16",
    channel: "SEC 8-K / 纳斯达克",
    prediction: "隐含预判:Circle IPO 成功 = 『稳定币/加密股夏天』,美股愿为 TRX 财库付溢价",
    outcome: "短期兑现:SRM 公告日暴涨约 460-530%(⚠);7-17 更名 Tron Inc.(NASDAQ: TRON),7-24 敲钟",
    verdict: "hit",
    action: "借壳 SRM:1 亿美元 TRX 财库协议($0.50 转股价优先股+权证,最高 2.1 亿美元);7-28 提交 10 亿美元 shelf;孙任『顾问』规避高管责任",
    note: "交易结构经 SEC 文件 3-0 核验",
  },
  {
    date: "2025-09 → 2026-05",
    channel: "法院文书 / X",
    prediction: "(风险事件,非预判)与特朗普家族 WLFI 决裂",
    outcome: "WLFI 冻结其约 2.4 亿美元代币 → 2026-04 孙起诉 WLFI 欺诈 → 2026-05-04 WLFI 反诉诽谤及市场操纵(水军 400 万粉丝、稻草人购币、疑似做空)",
    verdict: "risk",
    action: "公开称反诉为『毫无价值的公关噱头』;政治庇护叙事反转为政治对抗",
    note: "⚠ 多源一致,未完成三票核验",
  },
  {
    date: "2026-03",
    channel: "X / BeInCrypto 报道",
    prediction: "Tron Inc. 是『更便宜、更赚钱的中国版 Circle』:TRON 链年利润约 33 亿美元,市值仅 Circle 的 1/70",
    outcome: "逻辑硬伤:33 亿是网络层利润,不归上市壳公司;Tron Inc. 只是 TRX 财库,不捕获协议费",
    verdict: "marketing",
    action: "Tron Inc. 以每日约 5 万美元定投 TRX(财库达约 6.86 亿枚),边宣传边加仓自家币",
    note: "⚠ 单源",
  },
];

// 美股映射
export const STOCKS = [
  { ticker: "TRON", name: "Tron Inc.", relation: 5, logic: "TRX 价格 × 财库数量 → 每股 NAV;孙的言论/诉讼直接冲击股价", risk: "壳公司、10 亿美元 shelf 稀释、国会质询上市资格、WLFI 互诉外溢" },
  { ticker: "CRCL", name: "Circle", relation: 2, logic: "孙自比『中国版 Circle』反证其为稳定币主线正统标的", risk: "与孙无股权关联,基本面独立,承接稳定币立法红利" },
  { ticker: "COIN", name: "Coinbase", relation: 2, logic: "『牛市周期』预判兑现 → 交易/托管收入上升(行业 Beta)", risk: "行业周期风险为主,无孙个人风险传染" },
  { ticker: "HOOD", name: "Robinhood", relation: 2, logic: "散户加密交易活跃度的周期 Beta", risk: "同上" },
  { ticker: "MSTR", name: "Strategy", relation: 2, logic: "Tron Inc. 模仿其财库模式;『币库股』板块估值联动", risk: "BTC 财库 vs 自家币财库,资产质量不同" },
  { ticker: "DJT", name: "Trump Media", relation: 1, logic: "同属特朗普加密概念;孙与特朗普家族互诉为负面情绪源", risk: "纯情绪/政治盘" },
];

// 监控信源(RSS)。X 无免费 API:主通道用 Google News 聚合(可捕获媒体转述的 X 言论);
// 设置 X_BEARER_TOKEN secret 后自动启用 X API 直连。
export const SOURCES = [
  { name: "GoogleNews-EN", url: "https://news.google.com/rss/search?q=%22Justin+Sun%22+crypto&hl=en-US&gl=US&ceid=US:en" },
  { name: "GoogleNews-ZH", url: "https://news.google.com/rss/search?q=%E5%AD%99%E5%AE%87%E6%99%A8&hl=zh-CN&gl=CN&ceid=CN:zh-Hans" },
  { name: "GoogleNews-TRON", url: "https://news.google.com/rss/search?q=%22Tron+Inc%22+OR+%22TRX+treasury%22&hl=en-US&gl=US&ceid=US:en" },
  { name: "BingNews", url: "https://www.bing.com/news/search?q=%22Justin+Sun%22+OR+%E5%AD%99%E5%AE%87%E6%99%A8&format=rss" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss/tag/justin-sun" },
];

// 自动打标规则
export const TAG_RULES = [
  { tag: "预判", re: /predict|forecast|price target|bull|bear|expects?|预测|预判|牛市|熊市|看涨|看跌/i },
  { tag: "诉讼/监管", re: /SEC|lawsuit|sue[ds]?|court|subpoena|congress|诉讼|起诉|监管|国会|和解|反诉/i },
  { tag: "资本动作", re: /invest|acqui|merger|treasury|stake|shelf|dividend|buy|purchase|收购|投资|增持|财库|增发|派息|上市/i },
  { tag: "WLFI/特朗普", re: /WLFI|World Liberty|Trump|特朗普/i },
  { tag: "稳定币", re: /stablecoin|USDT|USDD|Tether|Circle|CRCL|稳定币/i },
  { tag: "营销", re: /dinner|lunch|auction|banana|donat|charity|午餐|晚宴|拍卖|慈善|香蕉/i },
];
