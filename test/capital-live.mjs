// Fixed-content owner verification; never accept text, recipient or expose secrets.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='https://invest.agiscorecard.com';
const token=process.env.CLOUDFLARE_API_TOKEN;
assert.ok(token,'Existing deployment credential is required');
const key=createHash('sha256').update(token+'\0sunwatch:roadmap-verification:v1').digest('hex');
const op=async action=>{
 const r=await fetch(base+'/api/capital-alerts?action='+action,{method:'POST',headers:{authorization:'Bearer '+key},redirect:'manual',signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,'Private notifier HTTP status');
 const d=await r.json();assert.equal(d.ok,true,'Private notifier failed');
 for(const name of ['message_id','messageId','chat_id','chatId','token','text','message'])assert.equal(name in d,false,'Private field exposed in status');
 return d;
};
const denied=await fetch(base+'/api/capital-alerts?action=run',{method:'POST',redirect:'manual'});
assert.equal(denied.status,403,'Unauthenticated send must fail');
let state;
for(let i=0;i<6;i++){
 try{state=await op('status');if(state.configured)break;}catch{}
 if(i<5)await new Promise(r=>setTimeout(r,5000));
}
assert.ok(state?.configured,'Existing SunWatch owner integration is not configured');
if(process.argv.includes('--send')){
 const first=await op('run');
 state=await op('status');
 assert.ok(state.last_delivery_at,'No real Telegram receipt recorded');
 assert.equal(state.pending_ack,false,'Receipt is not yet acknowledged by AGI');
 const repeat=await op('run');assert.equal(repeat.sent,0,'Repeated check must not resend');
 console.log(JSON.stringify({capital_radar:'telegram_acknowledged',at:state.last_delivery_at,sent_this_check:first.sent,repeat_sent:repeat.sent}));
}else console.log(JSON.stringify({capital_radar:'private_bridge_ready',delivery_probe:'not_run',last_delivery_at:state.last_delivery_at}));
