# 优化待办池(每日自主优化循环取件处;按优先级排序)

## 待办
7. [内容] 每条 FORECASTS 生成独立复盘文章页 /forecast/<id>(战绩内容矩阵化)
9. [国际化] 英文版首页与战绩页 /en/(Serenity 证明中英信息差有市场)
10. [转化] 免费预告 A/B 文案轮换与点击归因
11. [SEO] 每周收录自检:site: 查询 Bing 收录量,记录趋势
12. [性能] 首页 HTML 缓存与 API 响应 cache-control 调优
13. [产品] 战绩页周更 OG 描述(动态命中率写入分享卡)
14. [内容] 孙宇晨档案独立页 /sun-archive(差异化获客素材)
15. [健壮] KV 计数器改用分片降低写冲突

## 已完成
- 2026-07-21 [健壮] IndexNow 429/5xx 退避重试(≤2次)+ 状态入 KV + 简报增长行带收录健康度
- 2026-07-20 [运营] licenses 管理端点 /api/licenses:列表 + 吊销(bot token 鉴权,吊销入 licenses-revoked 审计)
- 2026-07-17 [SEO] FAQ 页 + FAQPage schema(/faq,8问,入 sitemap/IndexNow/首页导航)
- 2026-07-17 [行情] 潜伏池标的入 WATCHLIST(鸣志/北特/柯力/奥比/越疆)+ 恐慌买点自动报警(单日≤-5% → TG 🟢 候选)
- 2026-07-16 [内容] 标的页注入最新新闻(KV feed 匹配,随抓取自动更新)
- 2026-07-16 [产品] bot /status 与 /help 命令
- 2026-07-15 [安全] tg-webhook secret_token 校验 + 每日自愈重注册
