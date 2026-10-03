import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ISSUERS,RESEARCH_VERSION,normalizeSubmissions,applySnapshot,reviewOpinions,reviewFocus,ResearchMonitor,researchSummary} from '../src/research-monitor.js';
import {renderResearch} from '../src/research-page.js';
import worker,{telegramWebhookSecret} from '../src/index.js';
const TODAY=new Date().toISOString().slice(0,10), NOW=Date.now();
function source(issuer=ISSUERS[0],extra=false){
 const ids=extra?['0000002488-26-000002','0000002488-26-000001']:['0000002488-26-000001'];
 const recent={accessionNumber:ids,form:ids.map(()=> '8-K'),filingDate:ids.map(()=>TODAY),reportDate:ids.map(()=>TODAY),acceptanceDateTime:ids.map(()=>TODAY+'T12:00:00.000Z'),items:ids.map(()=> '2.02,9.01'),primaryDocument:ids.map(()=> 'earnings.htm')};
 return {cik:issuer.cik,tickers:[issuer.ticker],filings:{recent}};
}
function harness(){
 const saved=new Map(),sent=[];let extra=false,delivery=true,failing=false;
 const storage={get:async k=>structuredClone(saved.get(k)),put:async(k,v)=>saved.set(k,structuredClone(v))};
 const monitor=new ResearchMonitor({storage},{});
 monitor.loadIssuer=async i=>{if(failing)throw Error('sec_http_503');return normalizeSubmissions(source(i,extra),i,NOW)};
 monitor.pauseBetweenRequests=async()=>{};
 monitor.send=async text=>{sent.push(text);return delivery?{ok:true,message_id:sent.length}:{ok:false,error:'telegram_rejected'}};
 const call=async action=>(await monitor.fetch(new Request('https://internal/'+action,{method:'POST'}))).json();
 const edit=fn=>{const s=saved.get('research-state');fn(s)};
 const advance=()=>edit(s=>s.last_check=new Date(Date.now()-21*60000).toISOString());
 return {monitor,saved,sent,call,edit,advance,extra:()=>extra=true,failDelivery:()=>delivery=false,restoreDelivery:()=>delivery=true,failSource:()=>failing=true,restoreSource:()=>failing=false};
}
test('verified manifest has twelve unique securities including separate SpaceX issuer',()=>{
 assert.equal(ISSUERS.length,12);assert.equal(new Set(ISSUERS.map(x=>x.cik)).size,12);assert.equal(ISSUERS.find(x=>x.ticker==='SPCX').cik,'0001181412');
});
test('reject wrong security mapping, malformed columns, duplicate accession and future date',()=>{
 for(const change of [d=>d.tickers=['FAKE'],d=>d.cik='12',d=>d.filings.recent.items=[],d=>d.filings.recent.filingDate[0]='2099-01-01',d=>d.filings.recent.filingDate[0]='2026-02-30']){
  const d=source();change(d);assert.throws(()=>normalizeSubmissions(d,ISSUERS[0],NOW));
 }
 const d=source(ISSUERS[0],true);d.filings.recent.accessionNumber[1]=d.filings.recent.accessionNumber[0];assert.throws(()=>normalizeSubmissions(d,ISSUERS[0],NOW));
});
test('reject unsafe document paths rather than fetch arbitrary URLs',()=>{
 for(const path of ['../../secret','https://evil.test/a','/bad','file.htm?x=1','<script>']){const d=source();d.filings.recent.primaryDocument[0]=path;assert.throws(()=>normalizeSubmissions(d,ISSUERS[0],NOW));}
});
test('normalization retains provenance and does not invent financial changes',()=>{
 const e=normalizeSubmissions(source(),ISSUERS[0],NOW)[0];assert.match(e.url,/https:\/\/www.sec.gov\/Archives\/edgar\/data\/2488\//);assert.equal(e.interpretation_status,'metadata_only');assert.equal(e.accepted_at_source,TODAY+'T12:00:00.000Z');assert.equal(e.delta,undefined);
});
test('initial baseline produces no filing outbox; repeat snapshot produces no new evidence',()=>{
 const rows=normalizeSubmissions(source(),ISSUERS[0],NOW);const a=applySnapshot(null,rows,NOW);assert.equal(a.pending.length,0);assert.equal(a.added[0].baseline,true);
 const b=applySnapshot(a.issuer,rows,NOW+1000);assert.equal(b.added.length,0);assert.equal(b.pending.length,0);
});
test('only unseen filings enqueue, a historical late insertion is recorded without alert',()=>{
 const rows=normalizeSubmissions(source(),ISSUERS[0],NOW);const base=applySnapshot(null,rows,NOW);
 const newRows=normalizeSubmissions(source(ISSUERS[0],true),ISSUERS[0],NOW);assert.equal(applySnapshot(base.issuer,newRows,NOW).pending.length,1);
 newRows[0].filing_date='2020-01-01';const late=applySnapshot(base.issuer,newRows,NOW);assert.equal(late.pending.length,0);assert.equal(late.added[0].historical_backfill,true);
});
test('rollback and absent history anchors do not replace good evidence',()=>{
 const rows=normalizeSubmissions(source(),ISSUERS[0],NOW);const base=applySnapshot(null,rows,NOW);
 const old=structuredClone(rows);old[0].filing_date='2020-01-01';assert.throws(()=>applySnapshot(base.issuer,old,NOW),/rollback/);
 const gap=structuredClone(rows);gap[0].accession='0000002488-26-999999';assert.throws(()=>applySnapshot(base.issuer,gap,NOW),/history_gap/);
});
test('review status never treats record publication or a page reload as a new review',()=>{
 const [old,fresh,missing]=reviewOpinions(['Record 2020-01-01','Record '+TODAY,'Undated'],NOW);
 assert.equal(old.expired,true);assert.equal(fresh.expired,false);assert.equal(fresh.status,'needs_review');assert.equal(fresh.reviewed_at,null);assert.equal(missing.expired,true);
});
test('8-K review focus is based on disclosed item codes without inferring direction',()=>{
 assert.match(reviewFocus({form:'8-K',items:'2.02,9.01'}),/业绩/);assert.match(reviewFocus({form:'8-K',items:'4.02,9.01'}),/不再可信/);assert.match(reviewFocus({form:'8-K/A',items:''}),/修订/);
});
test('public refresh only initializes evidence; owner cron acknowledges connection once',async()=>{
 const h=harness();const r=await h.call('refresh');assert.equal(r.issuers.length,12);assert.equal(r.health,'ok');assert.equal(h.sent.length,0);assert.equal(r.events.length,12);
 assert.equal((await h.call('run')).sent,1);assert.match(h.sent[0],/基线：12\/12/);assert.equal((await h.call('run')).sent,0);
 const publicState=await h.call('public');assert.equal(publicState.owner_channel.delivery_health,'acknowledged');assert.equal(JSON.stringify(publicState).includes('message_id'),false);
});
test('bounded polling shares a durable interval across callers',async()=>{
 const h=harness();let requests=0;const load=h.monitor.loadIssuer;h.monitor.loadIssuer=async x=>{requests++;return load(x)};
 await Promise.all([h.call('refresh'),h.call('refresh'),h.call('run')]);assert.equal(requests,12);assert.equal(h.sent.length,1);
});
test('durable outbox survives Telegram rejection and sends only acknowledged batches',async()=>{
 const h=harness();await h.call('run');h.advance();h.extra();h.failDelivery();await h.call('run');assert.equal(h.saved.get('research-state').pending.length,12);assert.equal(h.saved.get('research-state').delivery_error,'telegram_rejected');
 h.restoreDelivery();await h.call('run');assert.equal(h.saved.get('research-state').pending.length,6);await h.call('run');assert.equal(h.saved.get('research-state').pending.length,0);
 const n=h.sent.length;await h.call('run');assert.equal(h.sent.length,n);assert.ok(h.sent.every(x=>x.length<4000));
});
test('pause preserves polling and outbox but suppresses sends, resume does not reset baseline',async()=>{
 const h=harness();await h.call('run');await h.call('pause');h.advance();h.extra();await h.call('run');assert.equal(h.sent.length,1);assert.equal(h.saved.get('research-state').pending.length,12);
 await h.call('resume');await h.call('run');assert.equal(h.sent.length,4);assert.equal(h.saved.get('research-state').pending.length,6);
});
test('source failure retains evidence, warns once after grace, recovers once',async()=>{
 const h=harness();await h.call('run');h.advance();h.failSource();await h.call('run');assert.equal(h.sent.length,1);assert.equal((await h.call('public')).events.length,12);
 h.edit(s=>s.failure_since=new Date(Date.now()-46*60000).toISOString());await h.call('run');await h.call('run');assert.equal(h.sent.length,2);assert.match(h.sent[1],/待更新/);
 h.restoreSource();h.advance();await h.call('run');await h.call('run');assert.equal(h.sent.length,3);assert.match(h.sent[2],/恢复/);
});
test('staleness is computed on reads even when cron itself has stopped',()=>{
 const s={issuers:Object.fromEntries(ISSUERS.map(x=>[x.ticker,{status:'ok',last_success_at:new Date(NOW-120*60000).toISOString()}]))};
 const d=researchSummary(s,[],NOW);assert.equal(d.health,'partial');assert.ok(d.issuers.every(x=>x.status==='stale'));
});
test('public refresh cannot select run/pause/recipient or send an arbitrary message',async()=>{
 const actions=[];const env={SUNWATCH_KV:{get:async()=>null},RESEARCH_MONITOR:{idFromName:n=>{assert.equal(n,RESEARCH_VERSION);return n},get:()=>({fetch:async r=>{actions.push(new URL(r.url).pathname);return Response.json({ok:true,issuers:[]})}})}};
 const ctx={waitUntil(){}};
 assert.equal((await worker.fetch(new Request('https://test/api/research-refresh?action=run&recipient=evil',{method:'POST'}),env,ctx)).status,200);assert.deepEqual(actions,['/refresh']);
 assert.equal((await worker.fetch(new Request('https://test/api/research-refresh'),env,ctx)).status,405);
});
test('owner commands require private owner chat and a private derived secret',async t=>{
 let calls=0;const env={TELEGRAM_BOT_TOKEN:'synthetic-token',TELEGRAM_CHAT_ID:'123',RESEARCH_MONITOR:{idFromName:()=>'',get:()=>({fetch:async()=>{calls++;return Response.json({ok:true,enabled:false})}})}};
 const secret=await telegramWebhookSecret(env,{token:env.TELEGRAM_BOT_TOKEN});assert.match(secret,/^[a-f0-9]{64}$/);
 const send=(header,id,type)=>worker.fetch(new Request('https://test/tg-webhook',{method:'POST',headers:header?{'x-telegram-bot-api-secret-token':header}:{},body:JSON.stringify({message:{chat:{id,type},text:'/research_pause'}})}),env,{waitUntil(){}});
 for(const args of [[null,123,'private'],['public-old-key',123,'private'],[secret,124,'private'],[secret,123,'group']])assert.equal((await send(...args)).status,403);
 assert.equal(calls,0);t.mock.method(globalThis,'fetch',async()=>Response.json({ok:true}));assert.equal((await send(secret,123,'private')).status,200);assert.equal(calls,1);
});
test('bilingual SSR has evidence, canonical links, source times and opt-in analytics',()=>{
 const rows=normalizeSubmissions(source(),ISSUERS[0],NOW);const data={...researchSummary({issuers:{},events:applySnapshot(null,rows,NOW).added},reviewOpinions(['2020-01-01'],NOW),NOW)};
 const zh=renderResearch(data),en=renderResearch(data,true);assert.match(zh,/公司披露监控/);assert.match(en,/Company disclosure monitor/);assert.match(en,/Historical baseline/);assert.match(en,/\/en\/research/);assert.equal(/[一-龥]/.test(en.replace(/<script>[\s\S]*?<\/script>/g,'').replaceAll('中文','')),false);assert.match(zh,/G-FZXLMBB5QB/);assert.match(zh,/readChoice\(\)==='yes'/);assert.match(zh,/page_location:location.origin\+location.pathname/);
 const hostile=structuredClone(data);hostile.events[0].ticker='<script>alert(1)</script>';assert.equal(renderResearch(hostile).includes('<script>alert(1)</script>'),false);
});

test('SEC requests use runtime-compatible no-follow redirects and reject redirects without consuming content',async t=>{
 const monitor=new ResearchMonitor({storage:{}},{SEC_USER_AGENT:'SunWatch synthetic@example.com'});
 let bodyRead=false;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(options.redirect,'manual');
  assert.equal(new URL(url).hostname,'data.sec.gov');
  return {ok:false,status:302,text:async()=>{bodyRead=true;return ''}};
 });
 await assert.rejects(()=>monitor.loadIssuer(ISSUERS[0]),/sec_http_302/);
 assert.equal(bodyRead,false);
 t.mock.restoreAll();
 t.mock.method(globalThis,'fetch',async()=>Response.json(source()));
 assert.equal((await monitor.loadIssuer(ISSUERS[0])).length,1);
});

test('missing SEC contact blocks outbound requests and sends a single honest owner setup notice',async t=>{
 const raw=new ResearchMonitor({storage:{}},{});
 let requests=0;t.mock.method(globalThis,'fetch',async()=>{requests++;throw Error('Unexpected network call')});
 await assert.rejects(()=>raw.loadIssuer(ISSUERS[0]),/sec_contact_required/);assert.equal(requests,0);
 const h=harness();h.monitor.loadIssuer=async()=>{throw Error('sec_contact_required')};
 const first=await h.call('run');assert.equal(first.health,'not_ready');assert.equal(first.sent,1);assert.match(h.sent[0],/尚未接通/);assert.equal((await h.call('run')).sent,0);
});
