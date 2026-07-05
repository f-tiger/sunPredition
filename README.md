# sunPredition · SunWatch 孙宇晨预判监控

调研孙宇晨(Justin Sun)的历史预判、验证结果与同期操作,映射美股投资策略,并提供一个部署在 Cloudflare Workers 上的**实时预判监控台**。

## 内容

| 位置 | 说明 |
|------|------|
| `report/孙宇晨预判调研与美股投资策略.md` | 深度调研报告(22 信源 / 82 论断 / 三票对抗核验) |
| `src/` | SunWatch 监控台:Cloudflare Worker(仪表盘 + 定时抓取) |
| `wrangler.toml` | Worker 配置(KV 已绑定真实命名空间 `sunwatch-feed`) |
| `.github/workflows/deploy.yml` | 推送 main 分支时自动部署到 Cloudflare |

## 监控台功能

- **实时监控流**:每 30 分钟抓取 Google News(英/中/TRON Inc. 三路)、Bing News、Cointelegraph 标签 RSS,去重后存入 KV,按关键词自动打标(预判 / 诉讼监管 / 资本动作 / WLFI特朗普 / 稳定币 / 营销),页面可按标签筛选,也可点按钮手动抓取。
- **X 渠道**:X 无免费 API。默认通过新闻聚合间接覆盖其 X 言论;如有 X API key,执行 `npx wrangler secret put X_BEARER_TOKEN` 后自动启用 @justinsuntron 时间线直连。
- **预判档案**:2019–2026 每个阶段的"预判 → 验证结果 → 他的操作"三栏时间线,含命中统计。
- **美股映射**:TRON / CRCL / COIN / HOOD / MSTR / DJT 关联强度与传导逻辑卡片。

## 部署(二选一)

**方式 A:GitHub Actions 自动部署(推荐)**

1. 在 Cloudflare Dashboard → My Profile → API Tokens 创建一个 *Edit Cloudflare Workers* 模板的 token。
2. 在本仓库 Settings → Secrets and variables → Actions 添加:
   - `CLOUDFLARE_API_TOKEN`:上一步的 token
   - `CLOUDFLARE_ACCOUNT_ID`:Cloudflare Dashboard 右侧栏的 Account ID
3. 把本分支合并/推送到 `main`,Actions 会自动部署;之后访问 `https://sunwatch.<你的子域>.workers.dev`,点一次「立即抓取」初始化数据。

**方式 B:本地一条命令**

```bash
npm install && npx wrangler login && npx wrangler deploy
```

> KV 命名空间 `sunwatch-feed`(ID `95e53046baf048cd803687c86aaa3f67`)已在账户中创建并写入 `wrangler.toml`,无需再建。

## 免责声明

本仓库全部内容为公开信息的研究性整理,不构成投资建议。报告中标注 ⚠ 的条目未完成三票核验,关键决策请以 SEC/EDGAR 文件与法院文书为准。
