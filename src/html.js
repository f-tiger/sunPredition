// 仪表盘:单文件 HTML,数据由 /api/feed 与 /api/archive 提供
export function renderDashboard() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SunWatch · 孙宇晨预判监控台</title>
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
  <h1>🔭 SunWatch · 孙宇晨预判监控台</h1>
  <p>预判档案 · 验证结果 · 同期操作 · 实时信息流(Google News 聚合 + 可选 X API 直连)· 美股映射</p>
</header>

<div class="stats" id="stats"></div>
<div><button onclick="refresh()">立即抓取最新信息</button> <span class="meta" id="refreshMsg"></span></div>

<h2>跨市场标的映射:美股 / 港股 / A股(关联强度 ★)</h2>
<p class="meta">除 TRON 外均为"预判主题 → 标的"映射,不代表其实际持仓;A股无直接加密标的。</p>
<div id="stocks"></div>

<h2>实时监控流</h2>
<div id="filterBar"></div>
<div id="feed" style="margin-top:10px"><div class="card meta">加载中…</div></div>

<h2>预判档案:预判 → 结果 → 他的操作</h2>
<div id="archive"></div>

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

async function load(){
  const [a,f]=await Promise.all([
    fetch('/api/archive').then(r=>r.json()),
    fetch('/api/feed').then(r=>r.json())
  ]);
  FEED=f.items||[];
  renderStats(a,f); renderArchive(a.predictions); renderStocks(a.stocks); renderFilters(); renderFeed();
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
      list.map(s=>'<div class="card"><b>'+s.ticker+'</b> · '+esc(s.name)+
      ' <span class="tag">'+esc(s.theme||'')+'</span> <span class="stars">'+'★'.repeat(s.relation)+'☆'.repeat(5-s.relation)+'</span>'+
      '<div style="margin-top:4px">'+esc(s.logic)+'</div><div class="meta" style="margin-top:4px">风险:'+esc(s.risk)+'</div></div>').join('')+
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
