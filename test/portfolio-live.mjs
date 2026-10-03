// One-time first-connection delivery check; later deployments only inspect receipt.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePortfolio,FEED} from '../src/portfolio-alerts.js';
const site=process.env.SUNWATCH_URL||'https://invest.agiscorecard.com';
const key=process.env.AGI_ALERT_KEY||readFileSync(new URL('../src/index.js',import.meta.url),'utf8').match(/const AGI_ALERT_KEY = "([^"]+)"/)[1];
const read=async(url,options={})=>{const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});assert.ok(r.ok,'HTTP status '+r.status);return r.json();};
const d=validatePortfolio(await read(FEED));assert.equal(d.status,'tracking');
const rpc=await read('https://agiscorecard.com/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_portfolio_returns',arguments:{}}})});
assert.equal(rpc.result?.isError,false);const m=JSON.parse(rpc.result.content[0].text);assert.equal(m.valuation_id,d.valuation_id);assert.equal(m.stocks.length,12);
console.log('Public API/MCP agree:',d.cohort,d.as_of,'12 stocks + 3 benchmarks');
const op=action=>read(site+'/api/portfolio-alerts?action='+action,{method:'POST',headers:{authorization:'Bearer '+key}});
let status;
for(let attempt=0;attempt<6;attempt++){
 try{status=await op('status');if(status.ok&&typeof status.enabled==='boolean')break;}catch{}
 if(attempt<5)await new Promise(r=>setTimeout(r,5000));
}
assert.equal(status?.ok,true,'Owner notifier status unavailable');
if(!status.enabled){console.log('Owner alerts are paused; no message sent.');}
else{
 if(!status.last_delivery){const initial=await op('run');assert.equal(initial.ok,true,'Initial owner delivery was not acknowledged');}
 const receipt=(await op('status')).last_delivery;assert.ok(receipt?.message_id&&receipt?.at,'Missing Telegram receipt');
 // Only the initial installation needs to exercise the repeat check; after setup,
 // this operation is already an unchanged valuation and has no broadcast path.
 if(!status.last_delivery){const again=await op('run');assert.equal(again.sent,0);assert.equal(again.reason,'unchanged');console.log('Immediate repeated check: no duplicate');}
 // Receipt id stays in private durable state; public CI logs only acknowledgement/date.
 console.log('Owner Telegram acknowledged:',receipt.at,'valuation as of',receipt.as_of);
}
