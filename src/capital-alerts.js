// Private AGI capital-radar outbox relay. The existing durable owner sender owns
// the bot/recipient; neither the feed nor callers can choose another destination.
export const CAPITAL_FEED='https://agiscorecard.com/api/capital-radar/alerts';
const KEY='capital-alerts-state-v1',MAX_BYTES=32768,MAX_AGE=72*3600000;
const ID=/^[a-f0-9]{24}$/;
const stamp=()=>new Date(Date.now()).toISOString();

export function validateCapitalAlert(body,now=Date.now()){
 if(!body||body.ok!==true||!Object.hasOwn(body,'alert'))throw Error('invalid_feed');
 if(body.alert===null)return null;
 const a=body.alert;
 if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!['id','message','createdAt'].includes(k))||!ID.test(a.id??'')||typeof a.message!=='string'||!a.message.trim()||a.message.length>4000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(a.message)||typeof a.createdAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(a.createdAt))throw Error('invalid_feed');
 const time=Date.parse(a.createdAt);
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,19)!==a.createdAt.slice(0,19)||time>now+300000||now-time>MAX_AGE)throw Error('stale_or_invalid_feed');
 return {id:a.id,message:a.message,createdAt:a.createdAt};
}

async function readJSON(response){
 if(!response.ok||response.redirected||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')||''))throw Error('feed_unavailable');
 if(!response.body)throw Error('invalid_feed');
 const reader=response.body.getReader(),chunks=[];let bytes=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>MAX_BYTES)throw Error('feed_too_large');chunks.push(value);}
 }finally{reader.cancel().catch(()=>{});}
 const all=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));}catch{throw Error('invalid_feed');}
}

async function feedRequest(env,receipt){
 const headers={Accept:'application/json',Authorization:'Bearer '+env.CAPITAL_RADAR_RELAY_KEY,'User-Agent':'SunWatch-CapitalRadar/1.0'};
 const init={method:receipt?'POST':'GET',headers,redirect:'manual',signal:AbortSignal.timeout(10000)};
 if(receipt){headers['Content-Type']='application/json';init.body=JSON.stringify({id:receipt.id,messageId:receipt.messageId,deliveredAt:receipt.deliveredAt});}
 const body=await readJSON(await fetch(CAPITAL_FEED,init));
 if(receipt){if(body?.ok!==true||body.id!==receipt.id||typeof body.deliveredAt!=='string'||Date.parse(body.deliveredAt)!==Date.parse(receipt.deliveredAt))throw Error('ack_rejected');return;}
 return validateCapitalAlert(body);
}

export async function capitalCommand(env,action='run'){
 if(!['run','status'].includes(action))return {ok:false,error:'unknown_action'};
 if(!env.PORTFOLIO_ALERTS)return {ok:false,error:'not_configured'};
 const stub=env.PORTFOLIO_ALERTS.get(env.PORTFOLIO_ALERTS.idFromName('public-portfolio-owner-v1'));
 return (await stub.fetch(new Request('https://portfolio.internal/capital/'+action,{method:'POST'}))).json();
}

export async function handleCapital(ctx,env,send,action){
 const store=ctx.storage,s=await store.get(KEY)??{receipts:[],sent_count:0};
 const state=(ok=true)=>({ok,configured:!!env.CAPITAL_RADAR_RELAY_KEY,health:s.health??'not_checked',last_check:s.last_check??null,last_delivery_at:s.last_delivery_at??null,sent_count:s.sent_count??0,pending_ack:s.receipts.some(r=>r.state==='delivered'),unknown_count:s.receipts.filter(r=>['sending','unknown'].includes(r.state)).length});
 if(action==='status')return state();
 if(action!=='run')return {ok:false,error:'unknown_action'};
 // This scoped secret is independent of the legacy owner-identity database and
 // AGI_ALERT_KEY. Never fall back to that old channel when setup is incomplete.
 if(!env.CAPITAL_RADAR_RELAY_KEY){s.health='not_configured';await store.put(KEY,s);return {...state(false),sent:0,acknowledged:0,reason:'not_configured'};}
 s.last_check=stamp();
 // A process stopped after a persisted claim might have sent externally. Never
 // retry it automatically. This favors avoiding repeats, not exactly-once claims.
 for(const r of s.receipts)if(r.state==='sending')r.state='unknown';
 await store.put(KEY,s);
 let acknowledged=0;
 // A successful Telegram receipt is durable before any AGI acknowledgement.
 // Retry only that fixed acknowledgement, even if the remote alert has aged.
 for(const receipt of s.receipts.filter(r=>r.state==='delivered')){
  try{await feedRequest(env,receipt);receipt.state='acknowledged';acknowledged++;await store.put(KEY,s);}
  catch{s.health='ack_pending';await store.put(KEY,s);return {...state(false),sent:0,acknowledged,reason:'ack_pending'};}
 }
 let alert;
 try{alert=await feedRequest(env);}catch{s.health='source_unavailable';await store.put(KEY,s);return {...state(false),sent:0,acknowledged,reason:'source_unavailable'};}
 if(!alert){s.health=s.receipts.some(r=>r.state==='unknown')?'delivery_unknown':'ok';await store.put(KEY,s);return {...state(s.health==='ok'),sent:0,acknowledged,reason:'empty'};}
 const prior=s.receipts.find(r=>r.id===alert.id);
 if(prior&&prior.state!=='rejected'){
  s.health=prior.state==='unknown'?'delivery_unknown':'ok';await store.put(KEY,s);
  return {...state(prior.state!=='unknown'),sent:0,acknowledged,reason:prior.state==='unknown'?'delivery_unknown':'already_delivered'};
 }
 const receipt=prior??{id:alert.id,createdAt:alert.createdAt};
 receipt.state='sending';receipt.attemptedAt=stamp();
 if(!prior)s.receipts.push(receipt);
 // Freshness bounds old feed replays. Preserve every pending/uncertain record;
 // compact only acknowledged history outside that bound.
 s.receipts=s.receipts.filter(r=>r.state!=='acknowledged'||Date.now()-Date.parse(r.createdAt)<=MAX_AGE);
 s.health='sending';await store.put(KEY,s);
 let result;
 try{result=await send(alert.message,{receiptDetails:true});}catch{result={ok:false,error:'telegram_unconfirmed'};}
 if(result?.ok===true&&Number.isSafeInteger(result.message_id)&&result.message_id>0){
  receipt.state='delivered';receipt.messageId=result.message_id;receipt.deliveredAt=stamp();
  s.sent_count=(s.sent_count??0)+1;s.last_delivery_at=receipt.deliveredAt;s.health='ack_pending';
  // If this write fails, the durable 'sending' claim survives and prevents an
  // unsafe resend. A remote acknowledgement is never attempted before it.
  await store.put(KEY,s);
  try{await feedRequest(env,receipt);receipt.state='acknowledged';acknowledged++;s.health='ok';}
  catch{s.health='ack_pending';}
  await store.put(KEY,s);
  return {...state(s.health==='ok'),sent:1,acknowledged,reason:s.health==='ok'?'delivered':'ack_pending'};
 }
 const rejected=result?.definitive===true||result?.error==='telegram_not_configured';
 receipt.state=rejected?'rejected':'unknown';s.health=rejected?'delivery_rejected':'delivery_unknown';
 await store.put(KEY,s);
 return {...state(false),sent:0,acknowledged,reason:s.health};
}
