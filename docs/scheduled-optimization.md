# SunWatch 每日定时优化(2026-07-19 重建)

> 站点:https://sunwatch.tuoqiantu.workers.dev(Cloudflare Worker `sunwatch`)
> 代码与部署分支:`claude/sun-yuchen-investment-research-yzz9mx`(推送即触发 GitHub Actions 部署 + TG 摘要)

## 背景

原每日自主优化循环 Routine(`trig_01JWYRaVn7LsLonfSidfS4os`,记录于部署分支 CLAUDE.md)已丢失,循环中断。2026-07-19 重建如下。

## 现行 Routine

- **Routine**:`SunWatch daily optimize (sunPredition)`,ID `trig_01PiwKEKQsJXDDkueQ8yKXGi`
- **节奏**:每天 UTC 02:00(北京 10:00),与原循环一致
- **行为**:
  1. 更新部署分支到最新,遵守其 CLAUDE.md 工作协议(先生成 PROMPT 写入 `PROMPTS.md`,再执行);
  2. 从 `BACKLOG.md` 取 1 件最高优先级事项执行;BACKLOG 为空时,核实 WATCHLIST / CORE_SIGNALS / STOCKS 数据时效(价格/市值当场 WebSearch 核实并标日期),或更新孙宇晨动态/预判档案,或做一处 SEO/内容/bot 小优化;
  3. 遵守铁律:判断写成「触发执行」进 WATCHLIST;明确判断入 FORECASTS;结论落 CORE_SIGNALS(带日期);
  4. commit → push 部署分支 → 自动部署 + TG 通知;用 Actions 日志验证上线。
- **管理**:在 claude.ai 的 Routines 界面或任意 Claude Code 会话中用 `list_triggers` / `update_trigger` / `delete_trigger` 管理(需同一账号)。

免责声明:所有产出为研究框架,非投资建议。
