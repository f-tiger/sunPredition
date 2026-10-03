// Public model returns only. Telegram credentials stay in the existing SunWatch env/KV.
export const FEED='https://agiscorecard.com/api/portfolio';
const COHORT='social-basket-2026-10-02-close';
const STOCKS=['AMD','TSLA','META','MU','NVDA','PLTR','SPCX','AMZN','GOOGL','MSFT','NOW','PANW'];
const BENCHMARKS=['SPY','QQQ','TQQQ'];
const HASH='cdffeaf5be9e7a54ca8a792a1b33d7808c48f6320d65ccd0308655b8040a6912';
const link='https://agiscorecard.com/zh/portfolio-tracker';
const pct=n=>(n>0?'+':'')+n.toFixed(2)+'%';

export function validatePortfolio(d,previous=null,now=Date.now()){
 if(d?.schema_version!==1||d.cohort!==COHORT||d.manifest_sha256!==HASH||d.entry_session!=='2026-10-02')throw Error('invalid_cohort');
 if(!['tracking','stale','data_unavailable','awaiting_entry'].includes(d.status))throw Error('invalid_status');
 if(!Number.isFinite(Date.parse(d.attempted_at))||Date.parse(d.attempted_at)>now+300000)throw Error('invalid_clock');
 if(d.as_of){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.as_of)||d.as_of<d.entry_session||d.as_of>new Date(now).toISOString().slice(0,10)||!/^[a-f0-9]{64}$/.test(d.valuation_id??''))throw Error('invalid_date');
  if(d.stocks?.map(x=>x.ticker).join()!==STOCKS.join()||d.benchmarks?.map(x=>x.ticker).join()!==BENCHMARKS.join())throw Error('incomplete_record');
  for(const row of [d.basket,...d.stocks,...d.benchmarks])if(!row||['return_pct','max_drawdown_pct','excess_spy_pp'].some(k=>!Number.isFinite(row[k])))throw Error('invalid_return');
  if([...d.stocks,...d.benchmarks].some(x=>!Number.isFinite(x.entry_adjusted_close)||x.entry_adjusted_close<=0))throw Error('invalid_entry');
 }else if(d.status==='tracking')throw Error('missing_valuation');
 if(previous?.as_of&&(!d.as_of||d.as_of<previous.as_of))throw Error('rollback');
 const age=now-Date.parse(d.last_success_at);
 return {...d,status:d.as_of&&(!Number.isFinite(age)||age>96*3600000)?'stale':d.status};
}

export function formatPortfolio(d,kind='收益查询'){
 if(!d.as_of)return `📊 AGI 12 股收益追踪\n尚无完整估值，未计算收益。\n${link}`;
 const b=Object.fromEntries(d.benchmarks.map(x=>[x.ticker,x]));
 return `📊 AGI 12 股收益追踪 · ${kind}\n`
  +`建仓：${d.entry_session} 纽约常规收盘\n截至：${d.as_of} 纽约收盘\n`
  +(d.status==='tracking'?'':'⚠️ 数据待更新；下列为保留的最近完整记录。\n')
  +`\n12 股组合：${pct(d.basket.return_pct)}\n标普 SPY：${pct(b.SPY.return_pct)}\nQQQ：${pct(b.QQQ.return_pct)}\nTQQQ：${pct(b.TQQQ.return_pct)}\n`
  +`组合相对标普：${d.basket.excess_spy_pp>0?'+':''}${d.basket.excess_spy_pp.toFixed(2)} 个百分点\n组合最大回撤：${pct(d.basket.max_drawdown_pct)}\n\n`
  +d.stocks.map(x=>`${x.ticker}  ${pct(x.return_pct)}`).join('\n')
  +(d.as_of===d.entry_session?'\n\n当前仅有建仓收盘记录，0% 是起点，尚无后续收益表现。':'')
  +`\n\n口径：初始等权买入持有，复权日收盘；模型组合，非实际成交。TQQQ 为每日 3 倍目标，不是长期固定 3 倍。\n${link}\n/portfolio 查询 · /portfolio_pause 暂停 · /portfolio_resume 恢复`;
}

export async function portfolioCommand(env,action='run'){
 if(!env.PORTFOLIO_ALERTS)return {ok:false,error:'not_configured'};
 const stub=env.PORTFOLIO_ALERTS.get(env.PORTFOLIO_ALERTS.idFromName('public-portfolio-owner-v1'));
 return (await stub.fetch(new Request('https://portfolio.internal/'+action,{method:'POST'}))).json();
}

// One durable instance serializes cron overlaps and manual checks across isolates.
// The Telegram ack and durable write cannot be atomic: a crash between them may repeat.
export class PortfolioAlerts {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.queue=Promise.resolve();}
 async fetch(request){
  const job=this.queue.then(()=>this.handle(new URL(request.url).pathname.slice(1)));
  this.queue=job.catch(()=>{});
  try{return Response.json(await job);}catch{return Response.json({ok:false,error:'portfolio_alert_failed'});}
 }
 async config(){
  const e=this.env;
  return e.TELEGRAM_BOT_TOKEN&&e.TELEGRAM_CHAT_ID?{token:e.TELEGRAM_BOT_TOKEN,chatId:e.TELEGRAM_CHAT_ID}:await e.SUNWATCH_KV.get('tg-config','json');
 }
 async send(text){
  const cfg=await this.config();if(!cfg?.token||!cfg.chatId)return {ok:false,error:'telegram_not_configured'};
  try{
   const r=await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:cfg.chatId,text,disable_web_page_preview:true}),signal:AbortSignal.timeout(8000)});
   const b=await r.json();return r.ok&&b.ok===true&&Number.isInteger(b.result?.message_id)?{ok:true,message_id:b.result.message_id}:{ok:false,error:'telegram_rejected'};
  }catch{return {ok:false,error:'telegram_unconfirmed'};}
 }
 async load(previous){
  const r=await fetch(FEED,{headers:{'accept':'application/json','user-agent':'SunWatch-Portfolio/1.0'},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('feed_unavailable');return validatePortfolio(await r.json(),previous);
 }
 async handle(action){
  const store=this.ctx.storage;
  const s=await store.get('state')??{enabled:true};
  if(action==='status')return {ok:true,enabled:s.enabled,last_delivery:s.last_delivery??null,last_check:s.last_check??null,health:s.health??'not_checked',as_of:s.last?.as_of??null};
  if(action==='pause'||action==='resume'){s.enabled=action==='resume';await store.put('state',s);return {ok:true,enabled:s.enabled};}
  if(!['read','run'].includes(action))return {ok:false,error:'unknown_action'};
  if(action==='run'&&!s.enabled)return {ok:true,sent:0,reason:'paused'};
  let d=null;try{d=await this.load(s.last);}catch{}
  if(action==='read'){
   const cached=d??(s.last?{...s.last,status:'stale'}:null);
   return {ok:!!cached,text:cached?formatPortfolio(cached):`⚠️ 收益数据暂不可用，未推断收益。\n${link}`,enabled:s.enabled};
  }
  const stamp=new Date().toISOString();s.last_check=stamp;
  if(!d||d.status!=='tracking'){
   s.health='data_unavailable';s.failure_since??=stamp;
   // Grace a single failed request, then one warning per incident (not every poll).
   if(!s.health_notified&&Date.parse(stamp)-Date.parse(s.failure_since)>=25*60000){
    const r=await this.send(`⚠️ AGI 12 股收益数据暂未取得完整更新。\n${s.last?.as_of?'保留最近完整估值：'+s.last.as_of+'。':'尚未发布完整估值。'}\n不会把缺失数据记为 0% 收益；每 30 分钟继续检查。\n${link}`);
    if(r.ok)s.health_notified=true;
   }
   await store.put('state',s);return {ok:false,sent:0,reason:'data_unavailable'};
  }
  const recovery=s.health_notified===true;
  const changed=d.valuation_id!==s.sent_valuation;
  if(!changed&&!recovery){s.health='ok';delete s.failure_since;delete s.health_notified;await store.put('state',s);return {ok:true,sent:0,reason:'unchanged',as_of:d.as_of,last_delivery:s.last_delivery};}
  const kind=recovery?'数据恢复':!s.sent_valuation?'已接通 · 建仓基准':d.as_of===s.last?.as_of?'数据修订':'收盘更新';
  const receipt=await this.send(formatPortfolio(d,kind));
  if(receipt.ok){
   s.sent_valuation=d.valuation_id;s.last=d;s.health='ok';delete s.failure_since;delete s.health_notified;
   s.last_delivery={at:stamp,as_of:d.as_of,valuation_id:d.valuation_id,message_id:receipt.message_id};
  }
  await store.put('state',s);
  return {ok:receipt.ok,sent:receipt.ok?1:0,as_of:d.as_of,...(receipt.ok?{delivery:s.last_delivery}:{error:receipt.error})};
 }
}
