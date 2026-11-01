import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PortfolioAlerts} from '../src/portfolio-alerts.js';
import {CAPITAL_FEED,capitalCommand,validateCapitalAlert} from '../src/capital-alerts.js';
import worker from '../src/index.js';

const KEY='capital-alerts-state-v1',NOW=Date.parse('2026-11-01T12:00:00Z');
const alert=()=>({id:'a'.repeat(24),message:'Synthetic capital radar digest. No real investment conclusion.',createdAt:'2026-11-01T11:00:00Z'});
function harness(t){
 const state=new Map(),calls=[],messages=[],acks=[];
 let feed={ok:true,alert:alert()},feedStatus=200,ackOK=true,ackOverride=null,telegram='ok',clock=NOW,writeFailure=false;
 const ctx={storage:{get:async key=>structuredClone(state.get(key)),put:async(key,value)=>{if(writeFailure&&value.receipts?.some(r=>r.state==='delivered'))throw Error('synthetic_storage_failure');state.set(key,structuredClone(value));calls.push({kind:'persist',states:value.receipts.map(r=>r.state)});}}};
 const env={CAPITAL_RADAR_RELAY_KEY:'synthetic-feed-key',AGI_ALERT_KEY:'unused-legacy-key',TELEGRAM_BOT_TOKEN:'synthetic-bot',TELEGRAM_CHAT_ID:'synthetic-owner'};
 let object=new PortfolioAlerts(ctx,env);
 t.mock.method(Date,'now',()=>clock);
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  if(url===CAPITAL_FEED){
   assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,'Bearer synthetic-feed-key');
   if(options.method==='POST'){
    const receipt=JSON.parse(options.body);calls.push({kind:'ack'});acks.push(receipt);
    assert.deepEqual(Object.keys(receipt).sort(),['deliveredAt','id','messageId']);
    const persisted=state.get(KEY).receipts.find(r=>r.id===receipt.id);
    assert.equal(persisted.state,'delivered','successful Telegram receipt precedes remote acknowledgement');
    assert.equal(persisted.messageId,receipt.messageId);assert.equal(persisted.deliveredAt,receipt.deliveredAt);
    return ackOK?Response.json(ackOverride??{ok:true,id:receipt.id,deliveredAt:receipt.deliveredAt}):Response.json({ok:false},{status:503});
   }
   assert.equal(options.method,'GET');calls.push({kind:'feed'});
   return feed instanceof Response?feed.clone():Response.json(feed,{status:feedStatus});
  }
  assert.equal(url,'https://api.telegram.org/botsynthetic-bot/sendMessage');assert.equal(options.redirect,'manual');
  const body=JSON.parse(options.body);assert.equal(body.chat_id,'synthetic-owner');
  assert.deepEqual(Object.keys(body).sort(),['chat_id','disable_web_page_preview','text']);
  assert.equal(state.get(KEY).receipts.at(-1).state,'sending','claim must persist before external send');
  calls.push({kind:'telegram'});messages.push(body);
  if(telegram==='network')throw Error('synthetic timeout');
  if(telegram==='malformed')return new Response('not JSON');
  if(telegram==='no_receipt')return Response.json({ok:true});
  if(telegram==='server_error')return Response.json({ok:false},{status:500});
  if(telegram==='reject')return Response.json({ok:false,error_code:429},{status:429});
  return Response.json({ok:true,result:{message_id:123+messages.length}});
 });
 return {state,calls,messages,acks,env,setFeed:value=>feed=value,setFeedStatus:value=>feedStatus=value,setTelegram:value=>telegram=value,setAck:value=>ackOK=value,setAckBody:value=>ackOverride=value,failReceiptWrite:()=>writeFailure=true,advance:ms=>clock+=ms,restart:()=>object=new PortfolioAlerts(ctx,env),run:async(action='run')=>(await object.fetch(new Request('https://portfolio.internal/capital/'+action,{method:'POST'}))).json()};
}

test('serialized concurrent runs deliver once, persist receipt before ACK, and survive object restart',async t=>{
 const h=harness(t),results=await Promise.all([h.run(),h.run(),h.run()]);
 assert.equal(results.reduce((n,r)=>n+r.sent,0),1);assert.equal(h.messages.length,1);assert.equal(h.acks.length,1);
 const send=h.calls.findIndex(c=>c.kind==='telegram'),ack=h.calls.findIndex(c=>c.kind==='ack');
 assert.ok(h.calls.slice(0,send).some(c=>c.kind==='persist'&&c.states.includes('sending')));
 assert.ok(h.calls.slice(send+1,ack).some(c=>c.kind==='persist'&&c.states.includes('delivered')));
 h.restart();assert.equal((await h.run()).reason,'already_delivered');assert.equal(h.messages.length,1);
 const status=await h.run('status');assert.equal(status.sent_count,1);assert.equal(status.pending_ack,false);assert.equal(status.last_delivery_at,new Date(NOW).toISOString());
 for(const secret of ['synthetic-owner','synthetic-feed-key',alert().message,alert().id,'messageId','123'])assert.ok(!JSON.stringify(status).includes(secret));
});

test('ACK failure retries only the durable fixed receipt and never resends Telegram',async t=>{
 const h=harness(t);h.setAck(false);
 assert.equal((await h.run()).reason,'ack_pending');assert.equal(h.messages.length,1);assert.equal(h.acks.length,1);
 h.restart();assert.equal((await h.run()).reason,'ack_pending');assert.equal(h.messages.length,1);assert.equal(h.acks.length,2);
 assert.deepEqual(h.acks[0],h.acks[1]);h.setAck(true);h.setFeed({ok:true,alert:null});
 const result=await h.run();assert.equal(result.acknowledged,1);assert.equal(result.pending_ack,false);assert.equal(h.messages.length,1);
 assert.deepEqual(h.acks[0],h.acks[2]);
});

test('ACK must confirm the exact alert and delivery instant before clearing pending receipt',async t=>{
 const h=harness(t);
 for(const body of [{ok:true},{ok:true,id:'b'.repeat(24),deliveredAt:new Date(NOW).toISOString()},{ok:true,id:alert().id,deliveredAt:'2026-11-01T10:00:00Z'}]){
  h.setAckBody(body);assert.equal((await h.run()).reason,'ack_pending');assert.equal(h.messages.length,1);assert.equal(h.state.get(KEY).receipts[0].state,'delivered');
 }
 h.setAckBody(null);h.setFeed({ok:true,alert:null});assert.equal((await h.run()).pending_ack,false);assert.equal(h.messages.length,1);
});

for(const kind of ['network','malformed','no_receipt','server_error'])test('uncertain '+kind+' delivery is durable and never automatically retried',async t=>{
 const h=harness(t);h.setTelegram(kind);assert.equal((await h.run()).reason,'delivery_unknown');
 h.setTelegram('ok');h.restart();assert.equal((await h.run()).reason,'delivery_unknown');
 assert.equal(h.messages.length,1);assert.equal(h.acks.length,0);assert.equal((await h.run('status')).unknown_count,1);
});

test('an interrupted sending claim is unknown after restart, without another send',async t=>{
 const h=harness(t);h.state.set(KEY,{receipts:[{id:alert().id,createdAt:alert().createdAt,state:'sending',attemptedAt:new Date(NOW).toISOString()}],sent_count:0});
 assert.equal((await h.run()).reason,'delivery_unknown');assert.equal(h.messages.length,0);assert.equal(h.acks.length,0);
 assert.equal(h.state.get(KEY).receipts[0].state,'unknown');
});

test('failure persisting a successful Telegram receipt leaves the pre-send claim, never ACKs or resends',async t=>{
 const h=harness(t);h.failReceiptWrite();assert.equal((await h.run()).ok,false);
 assert.equal(h.state.get(KEY).receipts[0].state,'sending');assert.equal(h.acks.length,0);
 h.restart();assert.equal((await h.run()).reason,'delivery_unknown');assert.equal(h.messages.length,1);
});

test('explicit Telegram rejection is retryable but is never acknowledged as sent',async t=>{
 const h=harness(t);h.setTelegram('reject');assert.equal((await h.run()).reason,'delivery_rejected');
 assert.equal(h.state.get(KEY).receipts[0].state,'rejected');assert.equal(h.acks.length,0);
 h.setTelegram('ok');assert.equal((await h.run()).sent,1);assert.equal(h.messages.length,2);assert.equal(h.acks.length,1);
});

test('missing scoped key fails closed even when the legacy key exists; status has no external effects',async t=>{
 const h=harness(t);delete h.env.CAPITAL_RADAR_RELAY_KEY;assert.ok(h.env.AGI_ALERT_KEY);
 const status=await h.run('status');assert.equal(status.configured,false);assert.equal(h.calls.length,0);
 assert.equal((await h.run()).reason,'not_configured');assert.equal(h.messages.length,0);assert.equal(h.calls.some(x=>x.kind==='feed'),false);
});

test('invalid, stale, future, oversized and recipient-selecting feeds cannot send',async t=>{
 const h=harness(t);
 const invalid=[{}, {ok:false,alert:alert()}, {ok:true}, {ok:true,alert:{...alert(),id:'bad'}}, {ok:true,alert:{...alert(),message:'x'.repeat(4001)}}, {ok:true,alert:{...alert(),message:'\u0000bad'}}, {ok:true,alert:{...alert(),createdAt:'2026-10-20T00:00:00Z'}}, {ok:true,alert:{...alert(),createdAt:'2026-11-02T00:00:00Z'}}, {ok:true,alert:{...alert(),createdAt:'2026-02-30T00:00:00Z'}}, {ok:true,alert:{...alert(),chatId:'arbitrary-recipient'}}, {ok:true,alert:{...alert(),ackUrl:'https://attacker.invalid'}}];
 for(const data of invalid){h.setFeed(data);assert.equal((await h.run()).reason,'source_unavailable');}
 h.setFeed(new Response('x'.repeat(32769),{headers:{'content-type':'application/json'}}));assert.equal((await h.run()).reason,'source_unavailable');
 h.setFeed(new Response('',{status:302,headers:{Location:'https://attacker.invalid'}}));assert.equal((await h.run()).reason,'source_unavailable');
 assert.equal(h.messages.length,0);assert.equal(h.acks.length,0);
});

test('null feed is an honest empty state and owner config cannot be chosen by an alert',async t=>{
 const h=harness(t);h.setFeed({ok:true,alert:null});assert.equal((await h.run()).reason,'empty');assert.equal(h.messages.length,0);
 assert.deepEqual(validateCapitalAlert({ok:true,alert:alert()},NOW),alert());
});

test('private endpoint requires POST, one allowed action and the existing operator key',async()=>{
 let calls=0;const env={AGI_ALERT_KEY:'feed-key',ROADMAP_VERIFY_KEY:'ops-key',PORTFOLIO_ALERTS:{idFromName:name=>{assert.equal(name,'public-portfolio-owner-v1');return name;},get:()=>({fetch:async request=>{calls++;assert.equal(new URL(request.url).pathname,'/capital/status');return Response.json({ok:true,sent_count:0});}})}};
 const endpoint='https://invest.agiscorecard.com/api/capital-alerts';
 for(const [query,method,key]of [['?action=run','GET','ops-key'],['?action=run','POST','feed-key'],['?action=run','POST','wrong'],['?action=read','POST','ops-key'],['?action=run&action=status','POST','ops-key']]){
  const response=await worker.fetch(new Request(endpoint+query,{method,headers:{Authorization:'Bearer '+key}}),env,{});assert.equal(response.status,403);assert.match(response.headers.get('cache-control'),/no-store/);
 }
 assert.equal(calls,0);
 const response=await worker.fetch(new Request(endpoint+'?action=status',{method:'POST',headers:{Authorization:'Bearer ops-key'}}),env,{});
 assert.equal(response.status,200);assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.equal((await response.json()).sent_count,0);assert.equal(calls,1);
 assert.equal((await capitalCommand({},'run')).ok,false);assert.equal((await capitalCommand(env,'arbitrary')).error,'unknown_action');
 delete env.ROADMAP_VERIFY_KEY;
 const legacy=await worker.fetch(new Request(endpoint+'?action=status',{method:'POST',headers:{Authorization:'Bearer feed-key'}}),env,{});
 assert.equal(legacy.status,403,'old alert key cannot substitute for the operator key');assert.equal(calls,1);
});

test('capital relay runs on the existing schedule before unrelated collection',()=>{
 const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8'),scheduled=source.slice(source.indexOf('async scheduled(event'));
 assert.ok(scheduled.indexOf('await capitalCommand(env)')<scheduled.indexOf('await refreshFeed(env)'));
 const config=readFileSync(new URL('../wrangler.toml',import.meta.url),'utf8');assert.match(config,/crons = \["\*\/30 \* \* \* \*", "30 0 \* \* \*", "30 12 \* \* \*"\]/);
});
