// No Telegram credentials or privileged RPC. Public refresh only establishes/updates evidence.
import assert from 'node:assert/strict';
const site=process.env.SUNWATCH_URL||'https://invest.agiscorecard.com';
const read=async(path,opts={})=>{const r=await fetch(site+path,{...opts,signal:AbortSignal.timeout(120000)});assert.ok(r.ok,`${path}: HTTP ${r.status}`);return r};
let initial;
for(let n=0;n<8;n++){
 try{initial=await(await read('/api/research')).json();if(initial.schema_version===2)break;}catch{}
 if(n<7)await new Promise(r=>setTimeout(r,5000));
}
assert.equal(initial?.version,'sec-disclosures-v1','Monitor deployment is unavailable');
const fresh=await(await read('/api/research-refresh',{method:'POST'})).json();
assert.equal(fresh.ok,true);assert.equal(fresh.webhook_secured,true,'Private webhook migration failed');assert.equal(fresh.issuers.length,12);assert.equal(fresh.sent,0,'Public refresh must never send Telegram messages');
assert.equal(fresh.collector_revision,'official-ir-v2');
assert.equal(fresh.monitor_mode,'official_ir');
console.log('Official IR health:',fresh.issuers.map(x=>`${x.ticker}:${x.status}${x.error?'('+x.error+')':''}`).join(' '));
assert.equal(fresh.health,'ok','Official company sources failed; do not claim full coverage');
assert.ok(fresh.events.length>=12);assert.ok(fresh.events.every(x=>['Official company IR','Company-authorized Business Wire'].includes(x.source)&&x.evidence_type==='company_release'&&x.interpretation_status==='metadata_only'&&x.first_seen_at&&x.url.startsWith('https://')));
assert.equal(fresh.sec_archive.events.length,60);assert.equal(fresh.sec_archive.automatic_collection,false);assert.ok(fresh.sec_archive.as_of);
assert.ok(fresh.review.pending>0);assert.equal(JSON.stringify(fresh).includes('message_id'),false);
assert.equal((await fetch(site+'/tg-webhook',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,403,'Missing webhook secret must be rejected');
const repeat=await(await read('/api/research-refresh',{method:'POST'})).json();assert.equal(repeat.reason,'rate_limited');assert.equal(repeat.sent,0);
for(const [path,label] of [['/research','公司披露监控'],['/en/research','Company disclosure monitor']]){
 const html=await(await read(path)).text();assert.ok(html.includes(label));assert.ok(html.includes('rel="canonical"'));assert.ok(html.includes('G-FZXLMBB5QB'));assert.ok(html.includes('ga-yes'));assert.ok(html.includes('SEC EDGAR'));
}
const llms=await(await read('/llms.txt')).text();assert.ok(llms.includes('/api/research'));
const sitemap=await(await read('/sitemap.xml')).text();assert.ok(sitemap.includes('/en/research'));
console.log('Public repeat sends zero; bilingual pages + opt-in GA4 + discovery verified. Source mode:','official RSS/IR checks; historical SEC archive separate');
console.log('Owner alert channel:',fresh.owner_channel.connection_status,'connection acknowledged:',fresh.owner_channel.connection_ack_at??'awaiting existing cron');
