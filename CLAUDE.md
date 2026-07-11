# sunPredition 项目记忆(每次会话必读)

## 核心工作协议:先生成 PROMPT,再执行

**用户的每个任务请求,必须按以下两步处理:**

1. **先生成并完善 PROMPT 并写入记忆**:把用户的原始请求扩写为结构化任务描述(目标、需实时核实的数据、执行步骤、交付物、验证方式),**追加写入仓库 `PROMPTS.md`(随代码一起 commit)**,展示给用户后立即执行(不等确认,除非有真歧义)。
   - 增长事项可自主决策执行(用户已授权"自主安装技能、实现营销增长,不依赖用户"),涉及对外发布/收费变更仍需告知。
2. **再执行任务**:按 PROMPT 逐项完成,结论写入系统(见下),通过部署流水线推送到用户 Telegram。

## 项目是什么

SunWatch:孙宇晨预判监控 + 跨市场(美/港/A)投资执行系统。
- 线上地址:https://sunwatch.tuoqiantu.workers.dev(Cloudflare Worker,名称 `sunwatch`)
- 部署:推送到分支 `claude/sun-yuchen-investment-research-yzz9mx` 自动触发 GitHub Actions 部署(secret `CLOUDFLARE_API_TOKEN` 已配置),部署后自动推送 TG 摘要(兼部署通知)
- 数据层:`src/data.js`(PREDICTIONS 孙宇晨档案 / STOCKS 标的卡 / PLAYBOOK 操盘框架 / CORE_SIGNALS 核心信号 / IMPORTANT_RULES 快讯规则 / WATCHLIST 实时行情触发线 / FORECASTS 自我预测档案)
- 行情:Yahoo Finance 每 30 分钟刷新,价格穿越 WATCHLIST 触发线 → TG 秒报
- TG:每日北京 08:30 / 20:30 双简报(cron `30 0 * * *` 与 `30 12 * * *`,UTC);长消息自动分段(勿再出现截断 HTML 的 bug)
- 定时任务(claude-code-remote triggers):每周一 05:00 UTC 存储清仓周检;一次性任务按事件另设

## 铁律(教训换来的)

1. **所有价格/市值/估值必须当场 WebSearch 核实并标注日期**——2026-07-05 曾因引用 6 月峰值数据在崩盘后给出错误情景权重(已记入 FORECASTS 失误档案)。
2. **每次明确判断必须写入 FORECASTS 建档**,命中与失误同等展示;错了就在档案里写明教训。
3. **不做"预测",做"触发执行"**:判断写成"若价格穿越 X 则做 Y"并加入 WATCHLIST,让机器盯守。
4. 结论必须落到 `CORE_SIGNALS`(带日期标注)→ commit → push → 部署自动推 TG;聊天里说了但没入库 = 没做。
5. 沙箱出网受限:workers.dev / 多数财经站直连 403,验证线上状态用 GitHub Actions 冒烟测试日志;GitHub MCP 的 actions_list 结果过大时用 python 解析保存的文件。
6. 免责声明:所有产出为研究框架,非投资建议。

## 用户背景(操盘相关)

- 持仓涉及:美股存储(派发中,SKHY 事件驱动)、港股 7709(两倍海力士,重点标的)、关注物理AI建仓(优必选/潜伏池)
- 关键日程:SKHY 已于 2026-07-10 挂牌($149 发行/首日收 $168);上市周(7/13-17)执行第二段派发降至 1/3 底仓;MU 财报 9 月下旬;宇树科创板挂牌在即
- 用户偏好:结论先行、给具体价位和仓位、诚实认错、TG 触达确认
