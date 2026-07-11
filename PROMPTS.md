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
