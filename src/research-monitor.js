// First-party disclosure metadata. No trading decisions or portfolio rebalancing.
import {PortfolioAlerts} from './portfolio-alerts.js';
import {IR_SOURCES,loadOfficialIR,applyIRSnapshot} from './official-ir.js';
export const RESEARCH_VERSION = 'sec-disclosures-v1';
export const SEC_AGENT = 'SunWatch Research/1.0 (https://github.com/f-tiger/sunPredition/issues)';
// Verified against https://www.sec.gov/files/company_tickers.json on 2026-10-03.
export const ISSUERS = [
 ['AMD',2488],['TSLA',1318605],['META',1326801],['MU',723125],
 ['NVDA',1045810],['PLTR',1321655],['SPCX',1181412],['AMZN',1018724],
 ['GOOGL',1652044],['MSFT',789019],['NOW',1373715],['PANW',1327567],
].map(([ticker,cik])=>({ticker,cik:String(cik).padStart(10,'0')}));
export const RELEVANT_FORMS = new Set(['8-K','8-K/A','10-Q','10-Q/A','10-K','10-K/A','20-F','20-F/A','6-K','S-1','S-1/A','S-3','S-3/A','424B2','424B5']);
const SITE='https://invest.agiscorecard.com';
const INTERVAL=20*60*1000;
const COLLECTOR_REVISION='official-ir-v1';
const DAY=86400000;
const stamp=now=>new Date(now).toISOString();
const dateOK=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&stamp(Date.parse(s)).slice(0,10)===s;
const safeText=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,160);

export function reviewOpinions(signals,now=Date.now()){
 return signals.map((text,i)=>{
  const recorded_at=text.match(/20\d{2}-\d{2}-\d{2}/)?.[0]??null;
  const valid_until=dateOK(recorded_at)?stamp(Date.parse(recorded_at)+30*DAY):null;
  // Legacy date is a publication date, not proof of a fresh review.
  return {id:'legacy-'+i,recorded_at,reviewed_at:null,valid_until,status:'needs_review',
   expired:!valid_until||Date.parse(valid_until)<now,reason:'no_structured_review',
   supersedes:null,invalidation_rule:null};
 });
}

export function normalizeSubmissions(d,issuer,now=Date.now()){
 if(String(d?.cik).padStart(10,'0')!==issuer.cik||!Array.isArray(d.tickers)||!d.tickers.includes(issuer.ticker))throw Error('issuer_mismatch');
 const r=d.filings?.recent;
 const keys=['accessionNumber','filingDate','reportDate','form','primaryDocument','acceptanceDateTime','items'];
 if(!r||!keys.every(k=>Array.isArray(r[k])&&r[k].length===r.accessionNumber?.length)||r.form.length>5000||!r.form.length)throw Error('invalid_schema');
 const ids=new Set();
 return r.form.map((form,i)=>{
  const accession=r.accessionNumber[i],filed=r.filingDate[i],document=r.primaryDocument[i];
  if(!/^\d{10}-\d{2}-\d{6}$/.test(accession)||ids.has(accession)||!dateOK(filed)||filed>stamp(now+DAY).slice(0,10))throw Error('invalid_filing');
  // Source date must not be in the future; one UTC day tolerance is unnecessary for US filing dates.
  if(filed>stamp(now).slice(0,10))throw Error('future_filing');
  if(typeof form!=='string'||form.length>25||typeof document!=='string'||!document||document.includes('..')||! /^[A-Za-z0-9_./-]+$/.test(document)||document.startsWith('/'))throw Error('invalid_document');
  ids.add(accession);
  const accepted=r.acceptanceDateTime[i];
  return {id:issuer.cik+':'+accession,ticker:issuer.ticker,cik:issuer.cik,accession,form,
   filing_date:filed,report_date:dateOK(r.reportDate[i])?r.reportDate[i]:null,
   accepted_at_source:typeof accepted==='string'?safeText(accepted):null,
   // Keep SEC's timestamp verbatim; first_seen_at is our auditable observation clock.
   items:safeText(r.items[i]),url:`https://www.sec.gov/Archives/edgar/data/${Number(issuer.cik)}/${accession.replaceAll('-','')}/${document}`,
   document,source:'SEC EDGAR',source_url:`https://data.sec.gov/submissions/CIK${issuer.cik}.json`,
   interpretation_status:'metadata_only',status:'needs_review'};
 });
}

export function reviewFocus(e,en=false){
 if(e.evidence_type==='company_release')return en?'Company release: verify the original details, reporting period and investment assumptions. This is not a complete regulatory filing feed.':'公司公告：核对原文、所属期间和投资假设；本来源不覆盖全部法定申报。';
 if(/\/A$/.test(e.form))return en?'Amendment: compare the original and amended document; direction is unassessed.':'修订申报：核对原文与修订内容；尚未判断方向。';
 if(e.items.split(/[,;\s]+/).includes('4.02'))return en?'Item 4.02: review non-reliance on prior financial statements and the scope affected.':'Item 4.02：复核既往财务报表不再可信的范围与影响。';
 if(e.items.split(/[,;\s]+/).includes('2.02'))return en?'Earnings disclosure: compare results, previous guidance and the same fiscal period.':'业绩披露：核对实际业绩、上一版指引和同一财务期间。';
 if(/^S-|^424B/.test(e.form))return en?'Securities offering: review financing terms, dilution and intended use of proceeds.':'证券发行文件：复核融资条款、稀释与资金用途。';
 if(/^10-|^20-F/.test(e.form))return en?'Periodic report: review revenue, margins, cash flow and changed risk disclosures.':'定期报告：复核收入、利润率、现金流及风险披露变化。';
 return en?'Company event: read the original filing before reassessing the investment thesis.':'公司事件：先核查公告原文，再复核投资假设。';
}

export function applySnapshot(previous,rows,now=Date.now()){
 if(!rows.length)throw Error('empty_snapshot');
 const latest=rows.reduce((m,x)=>x.filing_date>m?x.filing_date:m,'');
 if(previous?.latest_filing_date&&latest<previous.latest_filing_date)throw Error('source_rollback');
 const known=new Set(previous?.seen??[]);
 if(previous&&rows.every(x=>!known.has(x.accession)))throw Error('history_gap');
 const first=!previous;
 const cutoff=previous?.baseline_at??stamp(now);
 const observed=rows.filter(x=>RELEVANT_FORMS.has(x.form)).map(x=>({...x,first_seen_at:stamp(now),baseline:first,
  previous_filing:rows.filter(p=>p.form.replace('/A','')===x.form.replace('/A','')&&p.filing_date<=x.filing_date&&p.id!==x.id).sort((a,b)=>b.filing_date.localeCompare(a.filing_date)||b.accession.localeCompare(a.accession))[0]?.url??null}));
 const added=first?observed.slice(0,5):observed.filter(x=>!known.has(x.accession));
 // Late historical insertions are recorded, but never sent as fresh trade signals.
 for(const x of added)if(!first&&x.filing_date<cutoff.slice(0,10))x.historical_backfill=true;
 return {issuer:{baseline_at:cutoff,last_success_at:stamp(now),latest_filing_date:latest,
  seen:[...new Set([...rows.map(x=>x.accession),...(previous?.seen??[])])].slice(0,5000),status:'ok',error:null},
  added,pending:added.filter(x=>!first&&!x.historical_backfill).map(x=>x.id)};
}

export function formatResearchEvent(e){
 if(e.evidence_type==='company_release')return `${e.ticker} · 官方公司公告\n${e.title}\n发布日：${e.filing_date}${e.date_precision==='day'?'（仅日期，未核实时区）':'（UTC）'}\n首次发现：${e.first_seen_at}\n复核重点：${reviewFocus(e)}\n财务变化和买卖方向尚未核实。\n${e.url}`;
 return `${e.ticker} · ${e.form}${e.items?' · Items '+e.items:''}\n`
  +`SEC 披露日：${e.filing_date}；报告期：${e.report_date??'未提供'}\n`
  +`首次发现：${e.first_seen_at}\n`
  +`变化：新增申报 ${e.accession}；正文数值变化尚未核实。\n`
  +`复核重点：${reviewFocus(e)}\n`
  +`反证/边界：申报类型不代表利好或利空；需核对期间和原文。\n${e.url}`;
}

export function researchSummary(s,opinions=[],now=Date.now()){
 const issuers=ISSUERS.map(i=>{const v=s.issuers?.[i.ticker];const stale=!v?.last_success_at||now-Date.parse(v.last_success_at)>90*60000;return {...i,source_type:v?.source_id?'official_ir':'unverified',source_url:IR_SOURCES[i.ticker].url,source_name:IR_SOURCES[i.ticker].name,status:stale?'stale':v.status,last_success_at:v?.last_success_at??null,baseline_at:v?.baseline_at??null,latest_filing_date:v?.latest_filing_date??null,error:v?.error??null};});
 return {schema_version:2,version:RESEARCH_VERSION,monitor_mode:'official_ir',sec_collection:'paused_using_official_ir',collector_revision:s.collector_revision??null,last_check:s.last_check??null,
  health:issuers.every(x=>x.status==='ok')?'ok':issuers.some(x=>x.last_success_at)?'partial':'not_ready',
  cadence_minutes:30,issuers,events:(s.events??[]).slice(0,120),
  review:{total:opinions.length,pending:opinions.filter(x=>x.status==='needs_review').length,expired:opinions.filter(x=>x.expired).length},
  limitations:['Company IR releases are monitored; this is not complete SEC filing coverage. Financial changes and direction are unassessed.','First observations establish a baseline, not historical signals.','Owner-only alerts; no automated trades or paid-source feeds.'],
  owner_channel:{enabled:s.enabled!==false,last_ack_at:s.last_delivery?.at??null,delivery_health:s.delivery_error?'unconfirmed':s.last_delivery?'acknowledged':'pending'},
  evidence_clock:'first_seen_at is SunWatch observation time; published_at is normalized UTC where available; day-only releases do not claim a verified time or timezone'};
}

export async function researchCommand(env,action='public'){
 if(!env.RESEARCH_MONITOR)return {ok:false,error:'not_configured'};
 return (await env.RESEARCH_MONITOR.get(env.RESEARCH_MONITOR.idFromName(RESEARCH_VERSION)).fetch(new Request('https://research.internal/'+action,{method:'POST'}))).json();
}

// Existing sender is reused exclusively for its owner configuration and Telegram acknowledgement.
export class ResearchMonitor extends PortfolioAlerts {
 constructor(ctx,env){super(ctx,env);}
 async loadIssuer(issuer){return loadOfficialIR(issuer);}
 async loadSecIssuer(issuer){
  const agent=this.env.SEC_USER_AGENT;
  if(typeof agent!=='string'||!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(agent)||/[\r\n]/.test(agent))throw Error('sec_contact_required');
  const r=await fetch(`https://data.sec.gov/submissions/CIK${issuer.cik}.json`,{headers:{accept:'application/json','user-agent':agent},signal:AbortSignal.timeout(8000),redirect:'manual'});
  if(!r.ok)throw Error('sec_http_'+r.status);
  const text=await r.text();if(text.length>4000000)throw Error('response_too_large');
  return normalizeSubmissions(JSON.parse(text),issuer);
 }
 async pauseBetweenRequests(){await new Promise(r=>setTimeout(r,250));}
 async collect(s,now){
  if(s.collector_revision===COLLECTOR_REVISION&&s.last_check&&now-Date.parse(s.last_check)<INTERVAL)return false;
  if(s.collector_revision&&!s.collector_revision.startsWith('official-ir-')&&!s.ir_migrated){s.sec_issuers=s.issuers;s.issuers={};s.ir_migrated=true;delete s.failure_since;delete s.health_notified;}
  s.collector_revision=COLLECTOR_REVISION;s.last_check=stamp(now);s.issuers??={};s.events??=[];s.pending??=[];
  for(const issuer of ISSUERS){
   try{
    const rows=await this.loadIssuer(issuer);const apply=rows[0]?.evidence_type==='company_release'?applyIRSnapshot:applySnapshot;const update=apply(s.issuers[issuer.ticker]?.baseline_at?s.issuers[issuer.ticker]:null,rows,now);
    const nextPending=[...new Set([...s.pending,...update.pending])];
    if(nextPending.length>500)throw Error('delivery_backlog');
    s.issuers[issuer.ticker]=update.issuer;
    const existing=new Map(s.events.map(e=>[e.id,e]));for(const e of update.added)if(!existing.has(e.id))existing.set(e.id,e);
    s.events=[...existing.values()].sort((a,b)=>b.first_seen_at.localeCompare(a.first_seen_at)||b.filing_date.localeCompare(a.filing_date));
    s.pending=nextPending;
    // Never evict an event awaiting delivery. Bounded collection fails visibly before overflow.
    s.events=s.events.filter((e,i)=>i<300||s.pending.includes(e.id));
   }catch(e){
    const code=/^(issuer_mismatch|invalid_schema|invalid_filing|invalid_document|future_filing|source_rollback|history_gap|empty_snapshot|response_too_large|delivery_backlog|sec_contact_required|sec_http_\d+|ir_[a-z_]+|ir_http_\d+)$/.test(e.message)?e.message:'source_unavailable';
    s.issuers[issuer.ticker]={...(s.issuers[issuer.ticker]??{}),status:'error',error:code};
   }
   await this.pauseBetweenRequests();
  }
  // Write the outbox before any external send. Failed Telegram deliveries retain their event ids.
  await this.ctx.storage.put('research-state',s);return true;
 }
 async acknowledge(s,text,kind){
  const r=await this.send(text);
  if(r.ok){s.last_delivery={at:stamp(Date.now()),kind,message_id:r.message_id};delete s.delivery_error;}
  else s.delivery_error=r.error;
  return r.ok;
 }
 async deliver(s,now){
  if(!s.enabled)return 0;
  let sent=0;
  if(ISSUERS.every(i=>s.issuers?.[i.ticker]?.error==='sec_contact_required')){
   if(!s.contact_notified&&await this.acknowledge(s,`🔎 SunWatch 披露观察板已上线，自动采集待配置
网页提供 60 份此前核验的历史公告快照。SEC 要求声明自动访问身份与联系信息，当前缺少联系人邮箱；动态采集尚未接通。
已暂停未配置的请求，不会把历史公告当作新消息推送。
${SITE}/research`,'configuration_required')){s.contact_notified=true;sent++;}
   await this.ctx.storage.put('research-state',s);return sent;
  }
  const covered=ISSUERS.filter(i=>s.issuers?.[i.ticker]?.baseline_at).length;
  if(!s.ir_connected&&covered){
   if(await this.acknowledge(s,`🔎 SunWatch 官方公司公告监控已接通\n官方公告基线：${covered}/12 家。每 30 分钟检查公司 RSS / IR 公告。无需 SEC 邮箱。\n首次加载的历史文件不作为新信号推送。\n提醒包含原文、发布日期、首次发现时间和复核重点；正文数值与买卖方向仍需核实。公司公告不等于完整 SEC 申报覆盖。\n历史观点已加入有效期检查，未复核记录明确标记。\n${SITE}/research\n/research 查询 · /research_pause 暂停 · /research_resume 恢复`,'connected')){s.ir_connected=true;sent++;await this.ctx.storage.put('research-state',s);}else return sent;
  }
  const failed=ISSUERS.filter(i=>s.issuers?.[i.ticker]?.status!=='ok').map(x=>x.ticker);
  if(failed.length){
   s.failure_since??=stamp(now);
   if(!s.health_notified&&now-Date.parse(s.failure_since)>=45*60000){
    if(await this.acknowledge(s,`⚠️ SunWatch 披露数据待更新：${failed.join('、')}。\n保留此前证据；不会把获取失败解释为“没有新公告”。\n${SITE}/research`,'source_warning')){s.health_notified=true;sent++;}
   }
  }else{
   if(s.health_notified){if(await this.acknowledge(s,`✅ SunWatch 官方公司公告监控已恢复，12 家来源检查成功。\n${SITE}/research`,'source_recovery')){delete s.health_notified;delete s.failure_since;sent++;}}
   else delete s.failure_since;
  }
  // Three bounded messages per run; pending events remain durable for subsequent runs.
  for(let n=0;n<3&&s.pending?.length;n++){
   const batch=s.pending.slice(0,2).map(id=>s.events.find(x=>x.id===id));
   if(batch.some(x=>!x)){s.delivery_error='outbox_event_missing';break;}
   const text='🔎 SunWatch · 新披露，需要复核\n\n'+batch.map(formatResearchEvent).join('\n\n')+`\n\n研究证据，尚未核实财务变化，不生成买卖指令。\n${SITE}/research`;
   if(!await this.acknowledge(s,text,'filings'))break;
   const delivered=new Set(batch.map(x=>x.id));s.pending=s.pending.filter(id=>!delivered.has(id));sent++;await this.ctx.storage.put('research-state',s);
  }
  await this.ctx.storage.put('research-state',s);return sent;
 }
 async handle(action){
  const s=await this.ctx.storage.get('research-state')??{enabled:true,issuers:{},events:[],pending:[]};
  const now=Date.now();
  if(action==='pause'||action==='resume'){s.enabled=action==='resume';await this.ctx.storage.put('research-state',s);return {ok:true,enabled:s.enabled};}
  if(action==='public')return {ok:true,...researchSummary(s,[],now)};
  if(action==='read')return {ok:true,text:`🔎 SunWatch 披露监控\n来源：${ISSUERS.filter(i=>s.issuers[i.ticker]?.status==='ok').length}/12 家最近检查成功\n检查：${s.last_check??'尚未运行'}\n提醒：${s.enabled?'开启':'暂停'}；待发事件：${s.pending.length}\n${SITE}/research\n/research_pause 暂停 · /research_resume 恢复`};
  if(!['run','refresh'].includes(action))return {ok:false,error:'unknown_action'};
  const collected=await this.collect(s,now);
  const sent=action==='run'?await this.deliver(s,now):0;
  return {ok:true,sent,reason:collected?'checked':'rate_limited',...researchSummary(s,[],now)};
 }
}
