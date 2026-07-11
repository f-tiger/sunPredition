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
