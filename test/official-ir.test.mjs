import {test} from 'node:test';
import assert from 'node:assert/strict';
import {IR_SOURCES,parseIR,applyIRSnapshot,loadOfficialIR} from '../src/official-ir.js';
import {ResearchMonitor,researchSummary,formatResearchEvent} from '../src/research-monitor.js';
const now=Date.parse('2026-10-03T15:00:00Z'), source=IR_SOURCES.META;
const item=(slug='base',date='Fri, 02 Oct 2026 12:00:00 +0000')=>`<item><title><![CDATA[Meta &amp; partners]]></title><link>https://investor.atmeta.com/${slug}</link><pubDate>${date}</pubDate></item>`;
const feed=(body=item())=>`<?xml version="1.0"?><rss><channel><title>Meta Press Releases</title>${body}</channel></rss>`;
test('RSS preserves headline, provenance, precise timestamp and link without copying article bodies',()=>{
 const [row]=parseIR(feed(),source,now);assert.equal(row.title,'Meta & partners');assert.equal(row.published_at,'2026-10-02T12:00:00.000Z');assert.equal(row.source,'Official company IR');assert.equal(row.form,'IR');assert.equal(row.accession,null);assert.equal(row.Body,undefined);
});
test('reject wrong issuer, DTD/entity declarations, future/invalid dates, duplicates and unsafe links',()=>{
 for(const f of [feed().replace('Meta Press Releases','Fake Inc.'),'<!DOCTYPE rss>'+feed(),feed().replace('https://investor.atmeta.com/base','javascript:alert(1)'),feed().replace('https://investor.atmeta.com/base','https://evil.test/base'),feed().replace('https://investor.atmeta.com/base','https://user@investor.atmeta.com/base'),feed().replace('https://investor.atmeta.com/base',''),feed(item('x','Sun, 04 Oct 2026 12:00:00 +0000')),feed(item('x','not-a-date')),feed(item()+item())])assert.throws(()=>parseIR(f,source,now));
});
test('initial history silent, new IDs alert once, same-day historical insertion stays silent',()=>{
 const rows=parseIR(feed(),source,now),base=applyIRSnapshot(null,rows,now);assert.deepEqual(base.pending,[]);
 const latest=parseIR(feed(item('new','Sat, 03 Oct 2026 16:00:00 +0000')+item()),source,now+2*3600000);
 const next=applyIRSnapshot(base.issuer,latest,now+2*3600000);assert.equal(next.pending.length,1);assert.equal(applyIRSnapshot(next.issuer,latest,now+3*3600000).pending.length,0);
 const late=parseIR(feed(item('late','Sat, 03 Oct 2026 10:00:00 +0000')+item()),source,now);assert.equal(applyIRSnapshot(base.issuer,late,now).pending.length,0);
 assert.throws(()=>applyIRSnapshot(next.issuer,rows,now),/rollback/);
 assert.throws(()=>applyIRSnapshot(base.issuer,[latest[0]],now),/history_gap/);
});
test('Palantir and Tesla source timestamps without verified timezone stay date-only',()=>{
 const pltr=parseIR(JSON.stringify({GetPressReleaseListResult:[{Headline:'Palantir announcement',LinkToDetailPage:'/news-details/a',PressReleaseDate:'10/03/2026 12:00:00'}]}),IR_SOURCES.PLTR,now)[0];
 assert.equal(pltr.published_at,null);assert.equal(pltr.date_precision,'day');assert.equal(pltr.filing_date,'2026-10-03');
 const tsla=parseIR('<section class="press-release-teaser"><h4><a href="/press-release/a">Tesla release</a></h4><time datetime="2026-10-02T12:00:00Z"></time></section>',{...IR_SOURCES.TSLA,format:'tesla',url:'https://ir.tesla.com/press',host:'ir.tesla.com'},now)[0];assert.equal(tsla.published_at,null);assert.match(formatResearchEvent(tsla),/仅日期/);
 const base=applyIRSnapshot(null,[{...pltr,id:'older',filing_date:'2026-10-02'}],now);assert.equal(applyIRSnapshot(base.issuer,[pltr,{...pltr,id:'older',filing_date:'2026-10-02'}],now).pending.length,0);
});
test('HTTP links upgraded only for known official hosts; RSS relative PDFs remain first-party',()=>{
 const mu=feed().replaceAll('Meta','Micron').replaceAll('https://investor.atmeta.com/base','http://investors.micron.com/release');assert.equal(parseIR(mu,IR_SOURCES.MU,now)[0].url,'https://investors.micron.com/release');
 const sp=feed().replaceAll('Meta','SpaceX').replaceAll('https://investor.atmeta.com/base','/files/report.pdf');assert.equal(parseIR(sp,IR_SOURCES.SPCX,now)[0].url,'https://ir.spacex.com/files/report.pdf');
});
test('fetches official public source without SEC; redirects are errors, never followed',async t=>{
 t.mock.method(globalThis,'fetch',async(url,opts)=>{assert.equal(url,source.url);assert.equal(opts.redirect,'manual');assert.match(opts.headers['user-agent'],/SunWatch/);return new Response(feed());});
 assert.equal((await loadOfficialIR({ticker:'META'},now)).length,1);
 t.mock.restoreAll();t.mock.method(globalThis,'fetch',async()=>new Response('',{status:302}));await assert.rejects(()=>loadOfficialIR({ticker:'META'},now),/ir_http_302/);
});
test('migrates old SEC state to separate archive, uses IR baseline and acknowledges owner once',async()=>{
 const storage=new Map([['research-state',{enabled:true,collector_revision:'declared-contact-v3',issuers:{META:{baseline_at:new Date(now-1e8).toISOString(),seen:['sec-old']}},events:[],pending:[],contact_notified:true}]]),sent=[];
 const monitor=new ResearchMonitor({storage:{get:async k=>structuredClone(storage.get(k)),put:async(k,v)=>storage.set(k,structuredClone(v))}},{});
 monitor.loadIssuer=async i=>parseIR(feed(),source,now).map(x=>({...x,id:i.ticker+':'+x.url,ticker:i.ticker,source_id:IR_SOURCES[i.ticker].id}));
 monitor.pauseBetweenRequests=async()=>{};monitor.send=async text=>{sent.push(text);return {ok:true,message_id:1}};
 const call=async action=>(await monitor.fetch(new Request('https://internal/'+action))).json();
 const first=await call('refresh');assert.equal(first.health,'ok');assert.equal(first.sent,0);assert.deepEqual(storage.get('research-state').pending,[]);assert.ok(storage.get('research-state').sec_issuers.META);
 assert.equal((await call('run')).sent,1);assert.match(sent[0],/官方公告基线：12\/12/);assert.equal((await call('run')).sent,0);assert.equal((await call('public')).owner_channel.delivery_health,'acknowledged');
});

 test('authorized Tesla wire may be empty: establishes silent baseline and later alerts only new releases',()=>{
 const s=IR_SOURCES.TSLA;
 const empty='<rss><channel><title>Business Wire - News by Company: Tesla</title></channel></rss>';
 const rows=parseIR(empty,s,now);assert.deepEqual(rows,[]);const base=applyIRSnapshot(null,rows,now,s);assert.equal(base.issuer.feed_empty,true);assert.deepEqual(base.pending,[]);
 const populated=empty.replace('</channel>','<item><title>Tesla release</title><link>https://www.businesswire.com/news/home/20261004/en/Tesla</link><pubDate>Sun, 04 Oct 2026 12:00:00 GMT</pubDate></item></channel>');
 const nextRows=parseIR(populated,s,now+86400000);const next=applyIRSnapshot(base.issuer,nextRows,now+86400000,s);assert.equal(next.pending.length,1);assert.equal(next.added[0].source,'Company-authorized Business Wire');
 const quiet=applyIRSnapshot(next.issuer,[],now+86400001,s);assert.deepEqual(quiet.issuer.seen,next.issuer.seen);assert.equal(applyIRSnapshot(quiet.issuer,nextRows,now+86400002,s).pending.length,0);
 });
