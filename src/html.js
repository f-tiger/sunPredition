// 公开战绩页(服务端渲染,可分享,SEO 友好)
export function renderTrackRecord(forecasts, predictions) {
  const scored = forecasts.filter((f) => f.verdict !== "pending");
  const hits = scored.filter((f) => f.verdict === "hit").length;
  const V = { hit: "✅ 命中", miss: "❌ 失误", partial: "🟡 部分", pending: "⏳ 验证中" };
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rows = forecasts.map((f) =>
    `<div class="card"><b>${f.date}</b> · <b>${V[f.verdict] || f.verdict}</b><div style="margin-top:4px">${esc(f.call)}</div><div class="meta" style="margin-top:3px">结果:${esc(f.outcome)}</div></div>`).join("");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch Pro 公开战绩 · 命中率实录</title>
<meta name="description" content="SunWatch Pro 的每一次市场判断公开建档:命中与失误同等展示。当前可评分 ${scored.length} 条,命中 ${hits} 条。">
<meta property="og:title" content="SunWatch Pro 公开战绩:${scored.length} 条判断,命中 ${hits} 条">
<meta property="og:description" content="包括 2026-07 存储板块见顶判定、SKHY 上市派发窗口等。命中与失误同等公开。">
<style>:root{--bg:#f6f7f9;--card:#fff;--ink:#1a202c;--muted:#64748b;--line:#e2e8f0;--accent:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#0f141a;--card:#171e26;--ink:#e6edf3;--muted:#8b98a5;--line:#2a3441;--accent:#60a5fa}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,"PingFang SC",system-ui,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:24px 16px 64px}.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:10px}
.meta{color:var(--muted);font-size:12.5px}a{color:var(--accent)}h1{font-size:24px}</style></head><body><div class="wrap">
<h1>📊 SunWatch Pro 公开战绩</h1>
<p>每一次明确判断公开建档,命中与失误同等展示(失误附教训)。当前:可评分 <b>${scored.length}</b> 条,命中 <b>${hits}</b> 条${scored.length ? `,命中率 <b>${Math.round((hits / scored.length) * 100)}%</b>` : ""}。</p>
${rows}
<p><a href="/">← 返回 SunWatch Pro 主站</a> · <a href="https://t.me/sunwatchBot">🤖 免费订阅每日信号预告</a></p>
<p class="meta">另设孙宇晨预判档案(2019-2026,同一建档标准)见主站。本页内容为研究记录,非投资建议。</p>
</div></body></html>`;
}

// 仪表盘:单文件 HTML,数据由 /api/feed 与 /api/archive 提供
export function renderDashboard() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch Pro · AI 热点赛道投资罗盘</title>
<meta name="description" content="存储/物理AI/能源/加密五大赛道深度分析,A股·港股·美股三市场推荐,实时触发线与 Telegram 信号。公开预测战绩,命中失误同等展示。">
<meta property="og:title" content="SunWatch Pro · AI 热点赛道投资罗盘">
<meta property="og:description" content="五大AI赛道深度分析 × 三市场推荐 × 实时触发线信号。免费查看赛道分析与公开战绩。">
<meta property="og:type" content="website">
<meta property="og:url" content="https://sunwatch.tuoqiantu.workers.dev/">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="https://sunwatch.tuoqiantu.workers.dev/">
<style>
  :root{
    --bg:#f6f7f9; --card:#ffffff; --ink:#1a202c; --muted:#64748b;
    --line:#e2e8f0; --accent:#2563eb; --hit:#16803c; --miss:#b42318;
    --partial:#b45309; --mkt:#7c3aed; --risk:#be123c;
  }
  @media (prefers-color-scheme: dark){
    :root{ --bg:#0f141a; --card:#171e26; --ink:#e6edf3; --muted:#8b98a5;
      --line:#2a3441; --accent:#60a5fa; --hit:#4ade80; --miss:#f87171;
      --partial:#fbbf24; --mkt:#c4b5fd; --risk:#fb7185; }
  }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.65 -apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}
  .wrap{max-width:1080px;margin:0 auto;padding:24px 16px 64px}
  header h1{font-size:26px;margin:0 0 4px} header p{color:var(--muted);margin:0 0 20px}
  h2{font-size:19px;margin:36px 0 12px;border-left:4px solid var(--accent);padding-left:10px}
  .stats{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;
    padding:12px 18px;min-width:150px}
  .stat b{display:block;font-size:22px} .stat span{color:var(--muted);font-size:13px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;
    padding:14px 16px;margin-bottom:10px}
  .chip{display:inline-block;font-size:12px;padding:1px 9px;border-radius:999px;
    border:1px solid var(--line);color:var(--muted);margin-right:6px;cursor:pointer}
  .chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
  .tag{display:inline-block;font-size:11px;padding:0 7px;border-radius:999px;
    background:color-mix(in srgb, var(--accent) 12%, transparent);color:var(--accent);margin-left:6px}
  .v-hit{color:var(--hit)} .v-miss{color:var(--miss)} .v-partial{color:var(--partial)}
  .v-marketing{color:var(--mkt)} .v-risk{color:var(--risk)} .v-hit-weak{color:var(--partial)}
  .meta{color:var(--muted);font-size:12.5px}
  .pred .row{display:grid;grid-template-columns:110px 1fr;gap:4px 14px}
  .pred .row b{color:var(--muted);font-weight:600;font-size:13px}
  a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
  .stocks{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px}
  .stars{letter-spacing:2px;color:var(--accent)}
  .feed-title{font-weight:600}
  button{background:var(--accent);color:#fff;border:0;border-radius:8px;
    padding:7px 16px;font-size:14px;cursor:pointer}
  footer{margin-top:48px;color:var(--muted);font-size:12.5px;border-top:1px solid var(--line);padding-top:16px}
  .scroll{overflow-x:auto}
</style>
</head>
<body><div class="wrap">
<header>
  <h1>🔭 SunWatch Pro · AI 热点赛道投资罗盘</h1>
  <p>存储 / 物理AI / 能源 / 加密五大赛道深度分析 · A股/港股/美股三市场推荐 · 实时触发线 + Telegram 信号 · <a href="/track-record">📊 公开战绩</a> · <a href="https://t.me/sunwatchBot" target="_blank" rel="noopener">🤖 免费订阅信号预告</a></p>
  <div id="trackNav" style="margin:10px 0 4px"></div>
  <div id="proBar" style="margin:6px 0"></div>
</header>

<div class="stats" id="stats"></div>
<div><button onclick="refresh()">立即抓取最新信息</button> <button onclick="refreshQuotes()" style="margin-left:8px">刷新行情</button> <span class="meta" id="refreshMsg"></span></div>

<h2>今日行动面板(实时行情 × 触发线)</h2>
<p class="meta">现价来自 Yahoo Finance,每 30 分钟自动刷新;价格穿越触发线时 Telegram 实时报警。🔴=触发线已穿越(执行动作) 🟡=距触发线 3% 以内(备战) 🟢=安全距离。</p>
<div id="actionboard"><div class="card meta">行情加载中…</div></div>

<h2>预测记录与打分(给自己建档)</h2>
<p class="meta">本系统每次明确判断都在此公开记档——命中与失误同等展示,与孙宇晨预判档案同一标准。</p>
<div id="forecasts"></div>

<h2>主题周期定位与操盘框架</h2>
<p class="meta">四阶段模型:早期信号 → 中期主升 → 高峰泡沫 → 退潮。阶段判定附依据;各阶段给出可观测信号与对应标的;操盘纪律含具体触发条件。非投资建议。</p>
<div id="playbook"></div>

<h2>跨市场标的映射:美股 / 港股 / A股(关联强度 ★)</h2>
<p class="meta">除 TRON 外均为"预判主题 → 标的"映射,不代表其实际持仓;A股无直接加密标的。市值/估值等数字为 2026-07 初快照(标注日期的以该日为准,"待核"表示未经二次核验),交易前请以实时行情为准。</p>
<div id="stocks"></div>

<h2>实时监控流</h2>
<div id="filterBar"></div>
<div id="feed" style="margin-top:10px"><div class="card meta">加载中…</div></div>

<h2>预判档案:预判 → 结果 → 他的操作</h2>
<div id="archive"></div>

<h2 id="pricing">订阅 Pro</h2>
<div class="stocks">
  <div class="card"><b>免费版</b><div style="font-size:22px;font-weight:700;margin:4px 0">¥0</div>
    <div style="font-size:14px">✅ 五大赛道深度分析与周期定位<br>✅ 实时行情与新闻监控流<br>✅ 孙宇晨预判档案 + 系统预测记录<br>🔒 具体买卖价位与触发线<br>🔒 操盘纪律与仓位方案<br>🔒 Telegram 实时信号</div></div>
  <div class="card" style="border-color:var(--accent)"><b>Pro 会员</b> <span class="tag">推荐</span><div style="font-size:22px;font-weight:700;margin:4px 0">¥199/月 <span class="meta" style="font-size:13px">或 ¥1999/年</span></div>
    <div style="font-size:14px">✅ 免费版全部内容<br>✅ <b>全部买入区间 / 止损线 / 仓位方案</b><br>✅ <b>实时触发线报警(价格穿越秒推 TG)</b><br>✅ 每日双简报(北京 08:30 / 20:30)<br>✅ 重要信号快讯(SKHY/宇树/Optimus/合约价拐点等)</div>
    <div class="meta" style="margin-top:6px">购买:联系站长付款(微信/支付宝/USDT)获取激活码 → 下方输入激活;TG 信号:向 @sunwatchBot 发送 /start 激活码</div></div>
</div>
<div class="card" style="margin-top:10px"><b>激活 Pro</b>
  <div style="margin-top:6px"><input id="proKey" placeholder="输入激活码 SW-XXXXXX" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:220px">
  <button onclick="activatePro()">激活</button> <span class="meta" id="proMsg"></span></div></div>

<footer>
  数据信源:Google News RSS(英/中/TRON Inc. 三路)+ 可选 X API;每 30 分钟自动抓取,按关键词自动打标。
  详细调研与引用见仓库 <code>report/</code> 目录。<br>
  <b>免责声明:</b>本站为公开信息研究工具,不构成投资建议;标注 ⚠ 的条目未完成三票核验,关键决策请以 SEC/EDGAR 与法院文书为准。
</footer>
</div>
<script>
let FEED=[], FILTER=null;
const VERDICT={hit:["✅ 命中","v-hit"],["hit-weak"]:["✅ 命中(弱)","v-hit-weak"],
  partial:["🟡 部分命中","v-partial"],miss:["❌ 落空","v-miss"],
  marketing:["📣 营销造势","v-marketing"],risk:["⚠️ 风险事件","v-risk"],
  pending:["⏳ 待验证","v-partial"]};

let WATCH=[],ARCH=null,QDATA={quotes:[]},TRACK='all';
const TRACK_MATCH={all:()=>true,storage:g=>/存储/.test(g||''),['physical-ai']:g=>/物理AI|潜伏/.test(g||''),energy:g=>/能源|太空/.test(g||''),crypto:g=>/加密|稳定币|币库|特朗普|直接载体|孙宇晨/.test(g||'')};
function proKey(){return localStorage.getItem('swkey')||''}
async function load(){
  const key=proKey();
  const [a,f,q]=await Promise.all([
    fetch('/api/archive'+(key?'?key='+encodeURIComponent(key):'')).then(r=>r.json()),
    fetch('/api/feed').then(r=>r.json()),
    fetch('/api/quotes').then(r=>r.json()).catch(()=>({quotes:[]}))
  ]);
  FEED=f.items||[]; WATCH=a.watchlist||[]; ARCH=a; QDATA=q;
  renderTrackNav(a.tracks||[]); renderProBar(a.pro);
  renderStats(a,f); renderAll(); renderFilters(); renderFeed();
}
function renderAll(){
  const m=TRACK_MATCH[TRACK]||(()=>true);
  renderArchive(ARCH.predictions);
  renderStocks((ARCH.stocks||[]).filter(s=>TRACK==='all'||m(s.theme)));
  renderPlaybook((ARCH.playbook||[]).filter(p=>TRACK==='all'||m(p.theme)));
  renderForecasts(ARCH.forecasts||[]);
  renderActionBoard({...QDATA,quotes:(QDATA.quotes||[]).filter(x=>TRACK==='all'||m(x.group))});
}
function renderTrackNav(tracks){
  document.getElementById('trackNav').innerHTML=tracks.map(t=>
    '<span class="chip'+(TRACK===t.id?' active':'')+'" onclick="setTrack(\\''+t.id+'\\')" style="font-size:14px;padding:4px 14px">'+t.name+'</span>').join('');
}
function setTrack(id){TRACK=id;renderTrackNav(ARCH.tracks||[]);renderAll();}
function renderProBar(pro){
  document.getElementById('proBar').innerHTML=pro
    ?'<span class="tag" style="font-size:13px;padding:2px 10px">✨ Pro 已激活:全部价位与信号可见</span>'
    :'<span class="meta">当前为免费版:具体买卖价位/触发线/操盘纪律为 🔒 Pro 内容 — <a href="#pricing">订阅 Pro</a></span>';
}
async function activatePro(){
  const code=document.getElementById('proKey').value.trim().toUpperCase();
  const el=document.getElementById('proMsg');
  if(!code){el.textContent='请输入激活码';return}
  const r=await fetch('/api/activate?code='+encodeURIComponent(code)).then(r=>r.json());
  if(r.ok){localStorage.setItem('swkey',code);el.textContent='✅ 激活成功,刷新数据…';load();}
  else el.textContent='❌ '+(r.error||'激活失败');
}
async function refreshQuotes(){
  const el=document.getElementById('refreshMsg');el.textContent='刷新行情中…';
  try{
    await fetch('/api/refresh-quotes');
    const q=await fetch('/api/quotes').then(r=>r.json());
    renderActionBoard(q); el.textContent='行情已更新 '+(q.at||'').replace('T',' ').slice(0,16);
  }catch(e){el.textContent='行情刷新失败:'+e.message}
}
function renderActionBoard(q){
  const quotes=q.quotes||[];
  if(!quotes.length){document.getElementById('actionboard').innerHTML='<div class="card meta">暂无行情——点「刷新行情」初始化(部署后首次需手动触发一次)。</div>';return;}
  const qm=Object.fromEntries(quotes.map(x=>[x.symbol,x]));
  document.getElementById('actionboard').innerHTML='<div class="stocks">'+WATCH.map(w=>{
    const qt=qm[w.symbol];
    if(!qt)return '<div class="card meta">'+esc(w.name)+':行情不可用</div>';
    const rows=(w.levels||[]).map(lv=>{
      const dist=(lv.price-qt.price)/qt.price*100;
      const crossed=(lv.dir==='below'&&qt.price<=lv.price)||(lv.dir==='above'&&qt.price>=lv.price);
      const near=!crossed&&Math.abs(dist)<=3;
      const light=crossed?'🔴':near?'🟡':'🟢';
      return '<div style="font-size:13px;margin-top:3px">'+light+' '+esc(lv.label)+' <b>'+lv.price.toLocaleString()+'</b>'+
        ' <span class="meta">(距离 '+(dist>0?'+':'')+dist.toFixed(1)+'%)</span>'+
        (crossed?'<div style="color:var(--miss);font-weight:600">→ '+esc(lv.act)+'</div>':'')+
      '</div>';
    }).join('');
    const chg=qt.changePct;
    return '<div class="card"><b>'+esc(w.name)+'</b> <span class="tag">'+esc(w.group)+'</span>'+
      '<div style="font-size:20px;font-weight:700;margin-top:2px">'+qt.price.toLocaleString()+
      ' <span style="font-size:14px" class="'+(chg>=0?'v-hit':'v-miss')+'">'+(chg>0?'+':'')+chg+'%</span></div>'+
      (rows||'<div class="meta" style="font-size:12.5px">无触发线(仅监控)</div>')+'</div>';
  }).join('')+'</div><div class="meta" style="margin-top:6px">行情时间:'+(q.at||'—').replace('T',' ').slice(0,16)+' UTC</div>';
}
const F_VERDICT={hit:['✅ 命中','v-hit'],miss:['❌ 失误','v-miss'],partial:['🟡 部分','v-partial'],pending:['⏳ 验证中','v-partial']};
function renderForecasts(fc){
  const scored=fc.filter(x=>x.verdict!=='pending');
  const hits=scored.filter(x=>x.verdict==='hit').length;
  document.getElementById('forecasts').innerHTML=
    '<div class="meta" style="margin-bottom:8px">可评分 '+scored.length+' 条,命中 '+hits+' 条'+(scored.length?'(命中率 '+Math.round(hits/scored.length*100)+'%)':'')+'</div>'+
    fc.map(x=>{
      const[v,c]=F_VERDICT[x.verdict]||[x.verdict,''];
      return '<div class="card"><b>'+x.date+'</b> · <b class="'+c+'">'+v+'</b><div style="margin-top:4px">'+esc(x.call)+'</div>'+
      '<div class="meta" style="margin-top:3px">依据:'+esc(x.basis)+'</div>'+
      '<div style="margin-top:3px;font-size:13.5px">结果:'+esc(x.outcome)+'</div></div>';
    }).join('');
}
const STAGE_META={early:['早期信号','v-hit'],mid:['中期主升','v-partial'],peak:['高峰泡沫','v-miss'],exit:['退潮','v-risk']};
function renderPlaybook(pb){
  const order=['early','mid','peak','exit'];
  document.getElementById('playbook').innerHTML=pb.map(p=>{
    const bar=order.map(s=>{
      const on=s===p.stage;
      return '<span style="flex:1;text-align:center;padding:4px 2px;border-radius:6px;font-size:12px;'+
        (on?'background:var(--accent);color:#fff;font-weight:700':'border:1px solid var(--line);color:var(--muted)')+'">'+
        STAGE_META[s][0]+'</span>';
    }).join('');
    const rows=order.map(s=>{
      const st=p.stages[s]; if(!st)return'';
      const td='padding:6px 8px 6px 0;border-top:1px solid var(--line);vertical-align:top';
      return '<tr'+(s===p.stage?' style="background:color-mix(in srgb,var(--accent) 8%,transparent)"':'')+'>'+
        '<td style="white-space:nowrap;'+td+'"><b class="'+STAGE_META[s][1]+'">'+STAGE_META[s][0]+'</b><div class="meta">'+esc(st.window)+'</div></td>'+
        '<td style="'+td+'">'+esc(st.signals)+'</td><td style="'+td+'">'+esc(st.tickers)+'</td></tr>';
    }).join('');
    return '<div class="card">'+
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:16px">'+esc(p.theme)+'</b>'+
      '<span class="tag">'+esc(p.stageNote)+'</span></div>'+
      '<div style="display:flex;gap:6px;margin:10px 0">'+bar+'</div>'+
      '<div style="margin:6px 0"><b style="font-size:13px">阶段判定依据</b><ul style="margin:4px 0 8px 18px;padding:0">'+
      p.basis.map(b=>'<li style="margin:2px 0">'+esc(b)+'</li>').join('')+'</ul></div>'+
      '<div class="scroll"><table style="width:100%;border-collapse:collapse;font-size:13.5px">'+
      '<tr style="color:var(--muted)"><th style="text-align:left;padding:4px 8px 4px 0">阶段</th><th style="text-align:left;padding:4px 8px 4px 0">可观测信号</th><th style="text-align:left;padding:4px 0">对应标的/动作</th></tr>'+rows+'</table></div>'+
      '<div style="margin-top:8px;padding:8px 10px;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,transparent);border-radius:4px"><b style="font-size:13px">操盘纪律</b><div style="margin-top:2px">'+esc(p.tactics)+'</div></div>'+
      '</div>';
  }).join('');
}
function renderStats(a,f){
  const hits=a.predictions.filter(p=>p.verdict.startsWith('hit')).length;
  const scored=a.predictions.filter(p=>!['marketing','risk','pending'].includes(p.verdict)).length;
  document.getElementById('stats').innerHTML=
    stat(f.count,'监控条目')+stat(a.predictions.length,'档案条目')+
    stat(hits+'/'+scored,'可评分预判命中')+
    stat(latest(f.items),'最新条目时间');
}
const stat=(v,l)=>'<div class="stat"><b>'+v+'</b><span>'+l+'</span></div>';
const latest=items=>items&&items[0]&&items[0].published?items[0].published.slice(0,10):'—';
function renderFilters(){
  const tags=[...new Set(FEED.flatMap(i=>i.tags))];
  document.getElementById('filterBar').innerHTML=
    '<span class="chip'+(FILTER?'':' active')+'" onclick="setF(null)">全部</span>'+
    tags.map(t=>'<span class="chip'+(FILTER===t?' active':'')+'" onclick="setF(\\''+t+'\\')">'+t+'</span>').join('');
}
function setF(t){FILTER=t;renderFilters();renderFeed();}
function renderFeed(){
  const list=FILTER?FEED.filter(i=>i.tags.includes(FILTER)):FEED;
  document.getElementById('feed').innerHTML=list.length?list.slice(0,80).map(i=>
    '<div class="card"><div class="feed-title"><a href="'+i.link+'" target="_blank" rel="noopener">'+esc(i.title)+'</a>'+
    i.tags.map(t=>'<span class="tag">'+t+'</span>').join('')+'</div>'+
    '<div class="meta">'+(i.published?i.published.replace('T',' ').slice(0,16):'')+' · '+esc(i.origin||'')+' · via '+i.via+'</div></div>'
  ).join(''):'<div class="card meta">暂无数据——点击上方「立即抓取」初始化。</div>';
}
function renderArchive(preds){
  document.getElementById('archive').innerHTML=preds.map(p=>{
    const[v,c]=VERDICT[p.verdict]||[p.verdict,''];
    return '<div class="card pred"><div><b>'+p.date+'</b> · <span class="meta">'+esc(p.channel)+'</span> · <b class="'+c+'">'+v+'</b></div>'+
    '<div class="row" style="margin-top:6px">'+
    '<b>预判/言论</b><div>'+esc(p.prediction)+'</div>'+
    '<b>验证结果</b><div>'+esc(p.outcome)+'</div>'+
    '<b>他的操作</b><div>'+esc(p.action)+'</div>'+
    '<b>核验状态</b><div class="meta">'+esc(p.note)+'</div></div></div>';
  }).join('');
}
function renderStocks(st){
  const markets=['美股','港股','A股'];
  document.getElementById('stocks').innerHTML=markets.map(m=>{
    const list=st.filter(s=>s.market===m).sort((a,b)=>b.relation-a.relation);
    if(!list.length)return '';
    return '<h3 style="margin:16px 0 8px;font-size:16px">'+m+'('+list.length+')</h3><div class="stocks">'+
      list.map(s=>{
        const f=s.fund||{};
        const row=(k,v)=>v&&v!=='—'?'<div style="font-size:13px;margin-top:3px"><b style="color:var(--muted)">'+k+'</b> '+esc(v)+'</div>':'';
        return '<div class="card"><b>'+s.ticker+'</b> · '+esc(s.name)+
        ' <span class="tag">'+esc(s.theme||'')+'</span> <span class="stars">'+'★'.repeat(s.relation)+'☆'.repeat(5-s.relation)+'</span>'+
        '<div style="margin-top:4px">'+esc(s.logic)+'</div>'+
        row('市值/规模',f.mcap)+row('估值',f.val)+row('存货/库存',f.inv)+row('稀缺性',f.moat)+row('竞对',f.comp)+
        '<div class="meta" style="margin-top:5px">风险:'+esc(s.risk)+'</div></div>';
      }).join('')+
      '</div>';
  }).join('');
}
async function refresh(){
  const el=document.getElementById('refreshMsg');el.textContent='抓取中…';
  try{const r=await fetch('/api/refresh').then(r=>r.json());
    el.textContent='新增 '+r.added+' 条,共 '+r.total+' 条'+(r.errors&&r.errors.length?';部分信源失败':'');
    const f=await fetch('/api/feed').then(r=>r.json());FEED=f.items||[];renderFilters();renderFeed();
  }catch(e){el.textContent='抓取失败:'+e.message}
}
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
load();
</script>
</body></html>`;
}
