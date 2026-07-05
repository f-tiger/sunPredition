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
    date: "2025-11-06",
    channel: "X (Twitter)",
    prediction: "『短期缺芯片,长期缺能源,永远缺存储』——芯片与能源短缺是周期性的,存储短缺是永久性的",
    outcome: "命中(幅度罕见):此后一年内闪迪 SanDisk(SNDK)从约 35 美元最高涨至 1439 美元(约 50 倍,并纳入纳斯达克100);三星/海力士/美光 HBM 产能被预订至 2027-28 年",
    verdict: "hit",
    action: "同期将存储列入 TRON AI 基金重点赛道;借『50倍存储』战绩在中文互联网强化『预言家』人设(注意幸存者叙事风险)",
    note: "⚠ 原话时间(2025-11-06)与 SNDK 涨幅经中文财经媒体多源转述,未见英文一手推文存档,采信前建议核对其 X 原帖",
  },
  {
    date: "2026-05-16",
    channel: "X / 演讲(多家媒体 2026-05-17~22 转述)",
    prediction: "『虚拟 AI 普及红利已彻底结束,未来三年核心机会只在物理 AI』——具身智能(人形机器人)、无人机、空间计算、太空探索四大核心赛道",
    outcome: "待验证(预测窗口 2026-2029):可跟踪人形机器人出货量(Unitree 2025 年出货约 5500 台居全球第一)、特斯拉 Optimus 量产进度等硬指标",
    verdict: "pending",
    action: "TRON AI 基金从 1 亿美元扩至 10 亿美元,覆盖八大赛道(具身智能/无人机/空间计算/机器人/工业自动化/能源/存储/光通信);此前个人花 2.8 亿美元完成太空飞行为『太空经济』站台",
    note: "⚠ 中文媒体多源一致但均为转述;基金扩容数字待 TRON DAO 官方公告核验",
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

// 跨市场标的映射(美股/港股/A股)。
// 注意:除 TRON 外均为"预判主题→标的"的映射,不代表孙宇晨实际持仓;A股无直接加密标的。
export const STOCKS = [
  // ---- 美股 ----
  { market: "美股", ticker: "TRON", name: "Tron Inc.", relation: 5, theme: "直接载体", logic: "TRX 价格 × 财库数量 → 每股 NAV;孙的言论/诉讼直接冲击股价", risk: "壳公司、10 亿美元 shelf 稀释、国会质询上市资格、WLFI 互诉外溢" },
  { market: "美股", ticker: "SNDK", name: "SanDisk", relation: 3, theme: "存储", logic: "『永远缺存储』论(2025-11)的标志性验证标的:一年最高约50倍", risk: "涨幅已极大,高位波动剧烈;其言论是叙事放大器而非基本面来源" },
  { market: "美股", ticker: "MU", name: "Micron", relation: 3, theme: "存储", logic: "HBM/DRAM 主线,产能被预订至 2027-28 的直接受益者", risk: "存储周期反转与资本开支风险" },
  { market: "美股", ticker: "WDC", name: "Western Digital", relation: 2, theme: "存储", logic: "HDD/数据中心存储;SanDisk 分拆母体", risk: "弹性小于 SNDK/MU" },
  { market: "美股", ticker: "NVDA", name: "NVIDIA", relation: 2, theme: "物理AI", logic: "物理 AI 的算力底座(具身智能训练与推理)", risk: "已充分定价,与孙的关联仅为主题呼应" },
  { market: "美股", ticker: "TSLA", name: "Tesla", relation: 2, theme: "物理AI", logic: "Optimus 人形机器人量产叙事的整机代表", risk: "机器人业务兑现周期长" },
  { market: "美股", ticker: "RKLB", name: "Rocket Lab", relation: 2, theme: "太空", logic: "其『太空经济』赛道(个人2.8亿美元太空行站台)的可投美股代表", risk: "发射业务毛利低,商业化节奏不确定" },
  { market: "美股", ticker: "CEG", name: "Constellation Energy", relation: 2, theme: "能源", logic: "『长期缺能源』论的核电/AI 电力主线标的", risk: "电价与数据中心签约节奏" },
  { market: "美股", ticker: "CRCL", name: "Circle", relation: 2, theme: "稳定币", logic: "孙自比『中国版 Circle』反证其为稳定币主线正统标的", risk: "与孙无股权关联,基本面独立" },
  { market: "美股", ticker: "COIN", name: "Coinbase", relation: 2, theme: "加密Beta", logic: "『牛市周期』预判兑现 → 交易/托管收入上升", risk: "行业周期风险为主" },
  { market: "美股", ticker: "HOOD", name: "Robinhood", relation: 2, theme: "加密Beta", logic: "散户加密交易活跃度的周期 Beta", risk: "同上" },
  { market: "美股", ticker: "MSTR", name: "Strategy", relation: 2, theme: "币库股", logic: "Tron Inc. 模仿其财库模式;板块估值联动", risk: "BTC 财库 vs 自家币财库,资产质量不同" },
  { market: "美股", ticker: "DJT", name: "Trump Media", relation: 1, theme: "特朗普概念", logic: "孙与特朗普家族互诉为该概念负面情绪源", risk: "纯情绪/政治盘" },
  // ---- 港股 ----
  { market: "港股", ticker: "9880.HK", name: "优必选", relation: 3, theme: "物理AI", logic: "人形机器人第一股,具身智能预判的最直接港股映射", risk: "亏损、订单兑现与稀释风险" },
  { market: "港股", ticker: "9660.HK", name: "地平线机器人", relation: 2, theme: "物理AI", logic: "智驾/机器人计算方案,物理 AI 的芯片层", risk: "竞争激烈(英伟达/华为)" },
  { market: "港股", ticker: "2498.HK", name: "速腾聚创", relation: 2, theme: "物理AI", logic: "激光雷达 = 物理 AI 的感知层,已切入机器人客户", risk: "价格战,毛利承压" },
  { market: "港股", ticker: "1810.HK", name: "小米集团", relation: 1, theme: "物理AI", logic: "汽车+IoT+机器人生态,物理 AI 泛映射", risk: "关联度弱,估值由手机/汽车主导" },
  { market: "港股", ticker: "0981.HK", name: "中芯国际", relation: 2, theme: "存储/芯片", logic: "『缺芯片』论的中国制造端映射(代工自主链)", risk: "制程受限,地缘扰动" },
  { market: "港股", ticker: "1347.HK", name: "华虹半导体", relation: 1, theme: "存储/芯片", logic: "特色工艺代工,芯片景气 Beta", risk: "周期性强" },
  { market: "港股", ticker: "0863.HK", name: "OSL 集团", relation: 2, theme: "加密Beta", logic: "港股持牌加密交易所,承接『牛市周期』与港股加密政策红利", risk: "流动性差,波动极大" },
  { market: "港股", ticker: "1816.HK", name: "中广核电力", relation: 1, theme: "能源", logic: "『长期缺能源』论的港股核电映射", risk: "电价管制,弹性低" },
  { market: "港股", ticker: "6651.HK", name: "五一视界", relation: 1, theme: "物理AI", logic: "数字孪生/空间计算,其四大赛道之一的空间计算映射", risk: "小盘股,题材属性强" },
  // ---- A股 ----
  { market: "A股", ticker: "603986.SH", name: "兆易创新", relation: 3, theme: "存储", logic: "存储芯片设计龙头,『永远缺存储』论的 A 股核心映射", risk: "NOR/利基存储与 HBM 主线有差异" },
  { market: "A股", ticker: "301308.SZ", name: "江波龙", relation: 3, theme: "存储", logic: "存储模组,NAND 涨价周期的直接受益者", risk: "模组环节利润弹性大但壁垒较低" },
  { market: "A股", ticker: "688525.SH", name: "佰维存储", relation: 2, theme: "存储", logic: "存储模组+先进封测,同属涨价链", risk: "同上" },
  { market: "A股", ticker: "688008.SH", name: "澜起科技", relation: 2, theme: "存储", logic: "内存接口芯片,DDR5/服务器内存升级受益", risk: "估值偏高" },
  { market: "A股", ticker: "688017.SH", name: "绿的谐波", relation: 2, theme: "物理AI", logic: "谐波减速器 = 人形机器人核心零部件", risk: "订单尚未放量,题材波动大" },
  { market: "A股", ticker: "002050.SZ", name: "三花智控", relation: 2, theme: "物理AI", logic: "机器人执行器/特斯拉链,Optimus 叙事映射", risk: "主业为热管理,机器人占比小" },
  { market: "A股", ticker: "002747.SZ", name: "埃斯顿", relation: 2, theme: "物理AI", logic: "工业机器人本体龙头,工业自动化赛道映射", risk: "盈利承压" },
  { market: "A股", ticker: "300124.SZ", name: "汇川技术", relation: 2, theme: "物理AI", logic: "工控/伺服龙头,『工业自动化』赛道核心", risk: "宏观制造业周期" },
  { market: "A股", ticker: "601985.SH", name: "中国核电", relation: 1, theme: "能源", logic: "『长期缺能源』论的 A 股核电映射", risk: "电价与审批节奏" },
  { market: "A股", ticker: "600118.SH", name: "中国卫星", relation: 1, theme: "太空", logic: "太空探索赛道的 A 股映射", risk: "订单与军工属性波动" },
  { market: "A股", ticker: "300468.SZ", name: "四方精创", relation: 1, theme: "稳定币概念", logic: "A 股无直接加密标的,此为跨境支付/区块链概念联动", risk: "纯概念,基本面关联极弱" },
];

// 监控信源(RSS)。X 无免费 API:主通道用 Google News 聚合(可捕获媒体转述的 X 言论);
// 设置 X_BEARER_TOKEN secret 后自动启用 X API 直连。
export const SOURCES = [
  // 注意:查询不加 crypto 之类的领域词,避免漏掉他谈存储/物理AI/能源等非加密主题的言论
  { name: "GoogleNews-EN", url: "https://news.google.com/rss/search?q=%22Justin+Sun%22&hl=en-US&gl=US&ceid=US:en" },
  { name: "GoogleNews-ZH", url: "https://news.google.com/rss/search?q=%E5%AD%99%E5%AE%87%E6%99%A8&hl=zh-CN&gl=CN&ceid=CN:zh-Hans" },
  { name: "GoogleNews-TRON", url: "https://news.google.com/rss/search?q=%22Tron+Inc%22+OR+%22TRX+treasury%22&hl=en-US&gl=US&ceid=US:en" },
  { name: "GoogleNews-科技主题", url: "https://news.google.com/rss/search?q=%E5%AD%99%E5%AE%87%E6%99%A8+(%E7%89%A9%E7%90%86AI+OR+%E5%AD%98%E5%82%A8+OR+%E6%9C%BA%E5%99%A8%E4%BA%BA+OR+%E8%83%BD%E6%BA%90)&hl=zh-CN&gl=CN&ceid=CN:zh-Hans" },
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
  { tag: "物理AI/机器人", re: /physical\s?AI|embodied|robot|humanoid|drone|optimus|unitree|物理\s?AI|具身|机器人|人形|无人机|空间计算|太空|space/i },
  { tag: "存储/芯片", re: /storage|memory|HBM|NAND|flash|SanDisk|Micron|hynix|semiconductor|chip|存储|闪存|闪迪|芯片|半导体|美光/i },
  { tag: "能源", re: /energy|nuclear|power\s?plant|uranium|电力|能源|核电|铀/i },
];
