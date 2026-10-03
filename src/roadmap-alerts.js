// Reuse the existing owner-only durable sender. No subscriber list, recipient input or trades.
export const ROADMAP_FEED='https://agiscorecard.com/roadmap-assets/roadmap.json';
const LINK='https://agiscorecard.com/zh/invest',KEY='roadmap-state-v1';
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,180);
const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)))),b=>b.toString(16).padStart(2,'0')).join('');
export async function validateRoadmap(d,previous=null,now=Date.now()){
 if(d?.schema_version!==1||!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(d.revision??'')||!/^\d{4}-\d{2}-\d{2}$/.test(d.reviewed_at??'')||!/^\d{4}-\d{2}-\d{2}$/.test(d.review_due??''))throw Error('invalid_roadmap');
 if(![d.reviewed_at,d.review_due].every(x=>Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x)||Date.parse(d.reviewed_at)>now||Date.parse(d.review_due)<=Date.parse(d.reviewed_at))throw Error('invalid_date');
 if(!Array.isArray(d.routes)||d.routes.length!==5||!Array.isArray(d.companies)||d.companies.length<1||d.companies.length>50||!Array.isArray(d.views)||!Array.isArray(d.discovery?.candidates)||d.discovery.candidates.length>100)throw Error('incomplete_roadmap');
 const tickers=new Set(d.companies.map(c=>c.ticker)),ids=new Set(d.routes.map(r=>r.id));
 if(tickers.size!==d.companies.length||ids.size!==5||[...tickers].some(t=>!/^[A-Z]{1,6}$/.test(t)))throw Error('invalid_identity');
 for(const r of d.routes)if(!/^[a-z-]+$/.test(r.id)||!r.name?.zh||!r.thesis?.zh||!r.confirm?.zh||!r.invalidate?.zh||!r.claims?.length||!r.tickers?.length||r.tickers.some(t=>!tickers.has(t))||r.claims.some(id=>!d.views.some(c=>c.id===id)))throw Error('invalid_route');
 for(const c of d.discovery.candidates)if(!/^[a-zA-Z0-9_-]{1,80}$/.test(c.id)||!c.title||c.status!=='metadata_only'||!Number.isFinite(Date.parse(c.published_at))||Date.parse(c.published_at)>now+300000||!c.route_ids?.length||c.route_ids.some(id=>!ids.has(id)))throw Error('invalid_candidate');
 if(new Set(d.discovery.candidates.map(c=>c.id)).size!==d.discovery.candidates.length)throw Error('duplicate_candidate');
 const digest=await hash({revision:d.revision,reviewed_at:d.reviewed_at,review_due:d.review_due,routes:d.routes,companies:d.companies,views:d.views});
 if(d.editorial_hash!==digest)throw Error('digest_mismatch');
 if(previous&&(d.reviewed_at<previous.reviewed_at||d.reviewed_at===previous.reviewed_at&&Number(d.revision.split('.')[1])<Number(previous.revision.split('.')[1])||d.revision===previous.revision&&digest!==previous.editorial_hash))throw Error('rollback_or_unversioned_change');
 return d;
}
export function roadmapText(d,kind='路线查询',newVideos=[]){
 return `🧭 AGI 投资路线 · ${kind}\n观点复核：${d.reviewed_at}；下次复核期限：${d.review_due}\n\n`
 +d.routes.map(r=>`${clean(r.name.zh)}｜${r.tickers.join(' / ')}\n下一步：${clean(r.confirm.zh)}\n反证：${clean(r.invalidate.zh)}`).join('\n\n')
 +(newVideos.length?'\n\n新发现 '+newVideos.length+' 条待核对线索（仅标题匹配，未形成投资结论）：\n'+newVideos.slice(0,3).map(x=>'• '+clean(x.title)).join('\n'):'')
 +`\n\n以上为有条件的研究观察；当前估值尚未逐股核对。产业发展不等于股价上涨。不同股票可能暴露于同一风险；不自动下单或改动原 12 股组合。\n${LINK}\n/roadmap 查询 · /roadmap_pause 暂停 · /roadmap_resume 恢复`;
}
export async function roadmapCommand(env,action='run'){
 if(!env.PORTFOLIO_ALERTS)return {ok:false,error:'not_configured'};
 return (await env.PORTFOLIO_ALERTS.get(env.PORTFOLIO_ALERTS.idFromName('public-portfolio-owner-v1')).fetch(new Request('https://portfolio.internal/roadmap/'+action,{method:'POST'}))).json();
}
async function load(previous){
 const r=await fetch(ROADMAP_FEED,{headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('unavailable');
 const reader=r.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>750000)throw Error('too_large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return validateRoadmap(JSON.parse(new TextDecoder().decode(bytes)),previous);
}
export async function handleRoadmap(ctx,env,send,action){
 const s=await ctx.storage.get(KEY)??{enabled:true,seen:[]},now=Date.now(),stamp=new Date(now).toISOString();
 const state=()=>({ok:true,enabled:s.enabled,revision:s.last?.revision??null,last_check:s.last_check??null,last_ack_at:s.last_delivery?.at??null,health:s.health??'not_checked',last_kind:s.last_delivery?.kind??null});
 if(action==='status'||action==='public')return state();
 if(action==='pause'||action==='resume'){s.enabled=action==='resume';await ctx.storage.put(KEY,s);return state();}
 if(!['read','run'].includes(action))return {ok:false,error:'unknown_action'};
 if(action==='run'&&!s.enabled)return {...state(),sent:0,reason:'paused'};
 if(action==='run'&&s.last_attempt&&now-Date.parse(s.last_attempt)<60000)return {...state(),sent:0,reason:'rate_limited'};
 let d;try{d=await load(s.last);}catch{}
 if(action==='read')return {ok:!!(d||s.last),text:d?roadmapText(d):s.last?'⚠️ 数据未取得更新，以下为保留记录。\n'+roadmapText(s.last):'路线暂不可用。\n'+LINK};
 s.last_attempt=stamp;s.last_check=stamp;
 if(!d){
  s.health='unavailable';s.failed_since??=stamp;
  if(!s.warning_sent&&now-Date.parse(s.failed_since)>55*60000){const ack=await send(`⚠️ AI 投资路线更新暂不可用。保留已核对路线，不将失败当作没有变化。\n${LINK}`);if(ack.ok)s.warning_sent=true;}
  await ctx.storage.put(KEY,s);return {...state(),sent:0,reason:'source_unavailable'};
 }
 const baseline=!s.last,changed=d.editorial_hash!==s.sent_hash;
 const due=now>Date.parse(d.review_due+'T23:59:59Z')&&s.due_notified!==d.revision;
 const seen=new Set(s.seen);
 const fresh=baseline?[]:d.discovery.candidates.filter(c=>!seen.has(c.id)&&Date.parse(c.published_at)>Date.parse(s.baseline_at));
 const freshWindow=!s.last_lead_at||now-Date.parse(s.last_lead_at)>=20*3600000;
 // Persist pending review leads before sending; source eviction cannot silently drop a failed delivery.
 s.pending=[...new Map([...(s.pending??[]),...fresh].map(c=>[c.id,c])).values()].slice(0,100);
 s.baseline_at??=stamp;s.seen=[...new Set([...s.seen,...d.discovery.candidates.map(c=>c.id)])].slice(-2000);s.last=d;
 await ctx.storage.put(KEY,s);
 const kind=baseline?'已接通':changed?'路线修订':s.warning_sent?'数据恢复':due?'路线到期需复核':s.pending.length&&freshWindow?'每日新证据线索':null;
 if(!kind){s.health='ok';delete s.failed_since;await ctx.storage.put(KEY,s);return {...state(),sent:0,reason:'unchanged'};}
 const leads=s.pending.length&&freshWindow?s.pending:[];
 const text=(due?'⚠️ 此版本已到复核期限，旧判断不自动延长有效期。\n':'')+roadmapText(d,kind,leads);
 const ack=await send(text);
 if(ack.ok){s.sent_hash=d.editorial_hash;s.last_delivery={at:stamp,kind,message_id:ack.message_id};s.health='ok';delete s.failed_since;delete s.warning_sent;if(due)s.due_notified=d.revision;if(leads.length){s.pending=[];s.last_lead_at=stamp;}}
 else s.health='delivery_unconfirmed';
 await ctx.storage.put(KEY,s);return {...state(),sent:ack.ok?1:0,reason:ack.ok?kind:'delivery_unconfirmed'};
}
