import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {validateRoadmap,ROADMAP_FEED} from '../src/roadmap-alerts.js';
const base=process.env.SUNWATCH_URL||'https://invest.agiscorecard.com',token=process.env.CLOUDFLARE_API_TOKEN;
assert.ok(token,'Deployment token required for scoped verification');const key=createHash('sha256').update(token+'\0sunwatch:roadmap-verification:v1').digest('hex');
const fetchJSON=async(url,options={})=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});assert.ok(r.ok,'HTTP '+r.status);return r.json();};
const data=await validateRoadmap(await fetchJSON(ROADMAP_FEED));assert.equal(data.companies.length,9);
const op=action=>fetchJSON(base+'/api/roadmap-alerts?action='+action,{method:'POST',headers:{authorization:'Bearer '+key}});
let s;for(let i=0;i<8;i++){try{s=await op('status');if(s.ok)break;}catch{}if(i<7)await new Promise(r=>setTimeout(r,5000));}
assert.ok(s?.ok,'Roadmap notifier unavailable');
if(!s.enabled){console.log('Owner roadmap alerts paused; no send.');process.exit(0);}
if(!s.last_ack_at){const r=await op('run');assert.equal(r.sent,1,'Initial roadmap delivery was not acknowledged');s=await op('status');const again=await op('run');assert.equal(again.sent,0);assert.ok(['rate_limited','unchanged'].includes(again.reason));}
assert.ok(s.last_ack_at,'No Telegram acknowledgement');assert.equal(s.revision,data.revision);console.log('Owner roadmap Telegram acknowledged:',s.last_ack_at,'revision',s.revision,'repeat check deduplicated.');
const pub=await fetchJSON('https://invest.agiscorecard.com/api/roadmap-status');assert.ok(pub.last_ack_at);assert.equal('message_id' in pub,false);assert.equal('chat_id' in pub,false);
const denied=await fetch(base+'/api/roadmap-alerts?action=run',{method:'POST'});assert.equal(denied.status,403);console.log('Public status and unauthenticated-send boundary verified.');
