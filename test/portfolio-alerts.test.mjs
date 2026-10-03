import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PortfolioAlerts,validatePortfolio,formatPortfolio,FEED} from '../src/portfolio-alerts.js';
import worker,{telegramWebhookSecret} from '../src/index.js';
// Synthetic source contract; these are not market quotes.
function fixture(){
 const row=ticker=>({ticker,entry_adjusted_close:100,return_pct:0,max_drawdown_pct:0,excess_spy_pp:0});
 return {schema_version:1,cohort:'social-basket-2026-10-02-close',manifest_sha256:'cdffeaf5be9e7a54ca8a792a1b33d7808c48f6320d65ccd0308655b8040a6912',entry_session:'2026-10-02',as_of:'2026-10-02',valuation_id:'a'.repeat(64),status:'tracking',attempted_at:new Date().toISOString(),last_success_at:new Date().toISOString(),basket:row('basket'),stocks:['AMD','TSLA','META','MU','NVDA','PLTR','SPCX','AMZN','GOOGL','MSFT','NOW','PANW'].map(row),benchmarks:['SPY','QQQ','TQQQ'].map(row)};
}
function harness(t){
 const state=new Map(),sent=[];let data=fixture(),telegramOK=true,feedOK=true;
 const ctx={storage:{get:async k=>structuredClone(state.get(k)),put:async(k,v)=>state.set(k,structuredClone(v))}};
 const env={TELEGRAM_BOT_TOKEN:'fixture-token',TELEGRAM_CHAT_ID:'fixture-owner'};
 const sender=new PortfolioAlerts(ctx,env);
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url===FEED)return feedOK?Response.json(data):new Response('unavailable',{status:503});
  assert.equal(url,'https://api.telegram.org/botfixture-token/sendMessage');
  const body=JSON.parse(init.body);assert.equal(body.chat_id,'fixture-owner');assert.ok(body.text.length<4096);sent.push(body);
  return Response.json(telegramOK?{ok:true,result:{message_id:sent.length}}:{ok:false,description:'fixture rejection'});
 });
 return {state,sent,sender,env,run:async(action='run')=>(await sender.fetch(new Request('https://internal/'+action,{method:'POST'}))).json(),setData:d=>data=d,failSend:()=>telegramOK=false,fixSend:()=>telegramOK=true,failFeed:()=>feedOK=false};
}
test('first notification has a receipt; same valuation and timestamp refresh are silent',async t=>{
 const h=harness(t);const r=await h.run();assert.equal(r.sent,1);assert.equal(r.delivery.message_id,1);
 h.setData(fixture());assert.equal((await h.run()).reason,'unchanged');assert.equal(h.sent.length,1);
 assert.match(h.sent[0].text,/建仓：2026-10-02/);assert.match(h.sent[0].text,/尚无后续收益/);
 assert.equal(JSON.stringify(r).includes('fixture-owner'),false);
});
test('overlapping requests serialize; restored object remembers delivery',async t=>{
 const h=harness(t);const rs=await Promise.all([h.run(),h.run(),h.run()]);assert.equal(rs.reduce((n,r)=>n+r.sent,0),1);
 const restored=new PortfolioAlerts({storage:{get:async k=>h.state.get(k),put:async(k,v)=>h.state.set(k,v)}},h.env);
 const r=await (await restored.fetch(new Request('https://internal/run'))).json();assert.equal(r.reason,'unchanged');
});
test('Telegram rejection never acknowledges a valuation; next check retries',async t=>{
 const h=harness(t);h.failSend();assert.equal((await h.run()).ok,false);assert.equal(h.state.get('state').sent_valuation,undefined);
 h.fixSend();assert.equal((await h.run()).sent,1);assert.equal(h.sent.length,2);
});
test('actual same-date correction sends once and is labelled',async t=>{
 const h=harness(t);await h.run();const d=fixture();d.valuation_id='b'.repeat(64);d.stocks[0].return_pct=1;h.setData(d);
 assert.equal((await h.run()).sent,1);assert.match(h.sent[1].text,/数据修订/);assert.equal((await h.run()).sent,0);
});
test('new complete date triggers one close update, not a correction',async t=>{
 const h=harness(t);await h.run();const d=fixture();d.as_of='2026-10-03';d.valuation_id='c'.repeat(64);h.setData(d);
 assert.equal((await h.run()).sent,1);assert.match(h.sent[1].text,/收盘更新/);assert.equal((await h.run()).sent,0);
});
test('HTTP success without Telegram message receipt is not acknowledged',async t=>{
 const h=harness(t);t.mock.restoreAll();t.mock.method(globalThis,'fetch',async url=>url===FEED?Response.json(fixture()):Response.json({ok:true}));
 assert.equal((await h.run()).ok,false);assert.equal(h.state.get('state').sent_valuation,undefined);
});
test('pause/resume and explicit read do not broadcast or reset delivery state',async t=>{
 const h=harness(t);await h.run('pause');assert.equal((await h.run()).reason,'paused');assert.equal(h.sent.length,0);
 assert.match((await h.run('read')).text,/12 股/);assert.equal(h.sent.length,0);
 await h.run('resume');assert.equal((await h.run()).sent,1);
});
test('failure warning once after grace, retained date and recovery once',async t=>{
 const h=harness(t);await h.run();h.failFeed();assert.equal((await h.run()).reason,'data_unavailable');assert.equal(h.sent.length,1);
 h.state.get('state').failure_since=new Date(Date.now()-26*60000).toISOString();await h.run();await h.run();assert.equal(h.sent.length,2);assert.match(h.sent[1].text,/保留最近完整估值/);
 assert.match((await h.run('read')).text,/数据待更新/);
 t.mock.restoreAll();t.mock.method(globalThis,'fetch',async url=>url===FEED?Response.json(fixture()):Response.json({ok:true,result:{message_id:9}}));
 assert.equal((await h.run()).sent,1);assert.equal((await h.run()).sent,0);
});
test('missing, nonfinite, wrong-cohort and rollback data cannot become zero returns',()=>{
 for(const mutate of [d=>d.stocks.pop(),d=>d.basket.return_pct=null,d=>d.cohort='other',d=>d.stocks[0].entry_adjusted_close=0]){const d=fixture();mutate(d);assert.throws(()=>validatePortfolio(d));}
 assert.throws(()=>validatePortfolio(fixture(),{as_of:'2026-10-03'}));
 const d=fixture();d.last_success_at='2026-09-01T00:00:00Z';assert.equal(validatePortfolio(d).status,'stale');
});
test('owner commands reject spoofed webhook, other chat and groups',async t=>{
 const secret=await telegramWebhookSecret({}, {token:'fixture-token'});
 let calls=0;const env={TELEGRAM_BOT_TOKEN:'fixture-token',TELEGRAM_CHAT_ID:'123',PORTFOLIO_ALERTS:{idFromName:()=>'',get:()=>({fetch:async()=>{calls++;return Response.json({ok:true,enabled:false});}})}};
 for(const [headers,id,type] of [[{},123,'private'],[{'x-telegram-bot-api-secret-token':secret},124,'private'],[{'x-telegram-bot-api-secret-token':secret},123,'group']]){
  const r=await worker.fetch(new Request('https://invest.agiscorecard.com/tg-webhook',{method:'POST',headers,body:JSON.stringify({message:{chat:{id,type},text:'/portfolio_pause'}})}),env,{waitUntil(){}});assert.equal(r.status,403);
 }
 assert.equal(calls,0);
 t.mock.method(globalThis,'fetch',async()=>Response.json({ok:true}));
 const r=await worker.fetch(new Request('https://invest.agiscorecard.com/tg-webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:JSON.stringify({message:{chat:{id:123,type:'private'},text:'/portfolio_pause'}})}),env,{waitUntil(){}});
 assert.equal(r.status,200);assert.equal(calls,1);
});
test('owner integration route needs existing authorization and POST',async()=>{
 let calls=0;const env={AGI_ALERT_KEY:'fixture-key',PORTFOLIO_ALERTS:{idFromName:()=>'',get:()=>({fetch:async()=>{calls++;return Response.json({ok:true,sent:0});}})}};
 const url='https://invest.agiscorecard.com/api/portfolio-alerts?action=run';
 await worker.fetch(new Request(url),env,{});assert.equal(calls,0);
 const r=await worker.fetch(new Request(url,{method:'POST',headers:{authorization:'Bearer fixture-key'}}),env,{});assert.equal((await r.json()).ok,true);assert.equal(calls,1);
});
