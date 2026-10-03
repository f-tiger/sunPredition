// Public company-owned feeds; no SEC requests, proxy, login or paid feed.
const entries = [
 ['AMD','rss','https://ir.amd.com/news-events/press-releases/rss','Advanced Micro Devices'],
 ['TSLA','rss','https://feed.businesswire.com/rss/home/company/Tesla/e6Uq0QhVpYxJuczyKOo2Rw==','Tesla'],
 ['META','rss','https://investor.atmeta.com/rss/pressrelease.aspx','Meta'],
 ['MU','rss','https://investors.micron.com/rss/pressrelease.aspx','Micron'],
 ['NVDA','rss','https://nvidianews.nvidia.com/cats/press_release.xml','NVIDIA'],
 ['PLTR','palantir','https://investors.palantir.com/feed/PressRelease.svc/GetPressReleaseList','Palantir'],
 ['SPCX','rss','https://ir.spacex.com/rss/pressrelease.aspx','SpaceX'],
 ['AMZN','rss','https://ir.aboutamazon.com/rss/pressrelease.aspx','Amazon'],
 ['GOOGL','rss','https://abc.xyz/rss/pressrelease.aspx','Alphabet'],
 ['MSFT','rss','https://news.microsoft.com/source/tag/press-releases/feed/','Microsoft'],
 ['NOW','rss','https://newsroom.servicenow.com/rss/pressrelease.aspx','ServiceNow'],
 ['PANW','rss','https://investors.paloaltonetworks.com/rss/news-releases.xml','Palo Alto'],
];
export const IR_SOURCES=Object.fromEntries(entries.map(([ticker,format,url,name])=>[ticker,{ticker,format,url,name,id:'official-ir:'+ticker,host:new URL(url).hostname}]));
IR_SOURCES.TSLA.allow_empty=true;
IR_SOURCES.TSLA.short_window=true;
IR_SOURCES.TSLA.source_label='Tesla / Business Wire';
const iso=n=>new Date(n).toISOString();
function decode(s){return String(s??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos|nbsp);/gi,(all,num,named)=>{
 if(num){const n=num[0].toLowerCase()==='x'?parseInt(num.slice(1),16):Number(num);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
 return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[named.toLowerCase()];
}).trim();}
const plain=s=>decode(s).replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
function field(s,tag){return decode(s.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]);}
function originalURL(value,source){
 if(typeof value!=='string'||!value.trim())throw Error('ir_invalid_link');
 const u=new URL(decode(value),source.url);
 if(!['https:','http:'].includes(u.protocol)||!(u.hostname===source.host||(source.ticker==='TSLA'&&u.hostname==='www.businesswire.com'&&u.pathname.startsWith('/news/'))||(source.ticker==='AMZN'&&u.hostname==='www.ezodproxy.com'&&u.pathname.startsWith('/amazon/')))||u.username||u.password||u.port)throw Error('ir_invalid_link');
 u.protocol='https:';u.hash='';return u.href;
}
function dateOnly(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||iso(Date.parse(s)).slice(0,10)!==s)throw Error('ir_invalid_date');return s;
}
function row(source,title,link,published,now,{day=null}={}){
 const titleText=plain(title);if(!titleText)throw Error('ir_invalid_title');
 const ts=day?null:Date.parse(published);
 if(!day&&!Number.isFinite(ts))throw Error('ir_invalid_date');
 const date=dateOnly(day??iso(ts).slice(0,10));
 if(date>iso(now).slice(0,10)||ts>now+5*60000)throw Error('ir_future_date');
 const url=originalURL(link,source);
 return {id:source.id+':'+url,ticker:source.ticker,source_id:source.id,source:source.ticker==='TSLA'?'Company-authorized Business Wire':'Official company IR',source_url:source.url,
  evidence_type:'company_release',title:titleText,url,form:'IR',items:'',accession:null,report_date:null,
  filing_date:date,published_at:ts===null?null:iso(ts),published_at_source:plain(published),date_precision:day?'day':'timestamp',
  interpretation_status:'metadata_only',status:'needs_review'};
}
export function parseIR(text,source,now=Date.now()){
 if(typeof text!=='string'||text.length>4000000||/<!DOCTYPE|<!ENTITY/i.test(text)&&source.format==='rss')throw Error('ir_invalid_feed');
 let rows=[];
 if(source.format==='rss'){
  if(!/<rss\b/i.test(text)||!field(text.split(/<item\b/i)[0],'title').toLowerCase().includes(source.ticker==='MSFT'?'press releases archives - source':source.name.toLowerCase()))throw Error('ir_issuer_mismatch');
  const items=[...text.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  if(items.length>500)throw Error('ir_invalid_feed');
  rows=items.map(m=>row(source,field(m[1],'title'),field(m[1],'link'),field(m[1],'pubDate'),now));
 }else if(source.format==='tesla'){
  const sections=[...text.matchAll(/<section class="press-release-teaser">([\s\S]*?)<\/section>/g)];
  rows=sections.map(m=>{
   const a=m[1].match(/<h4[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/),date=m[1].match(/<time datetime="([^"]+)"/);
   if(!a||!date)throw Error('ir_invalid_feed');
   // The page's date placeholder is not a verified release time.
   return row(source,a[2],a[1],date[1],now,{day:date[1].slice(0,10)});
  });
 }else if(source.format==='palantir'){
  const d=JSON.parse(text).GetPressReleaseListResult;
  if(!Array.isArray(d)||d.length>1000)throw Error('ir_invalid_feed');
  rows=d.map(x=>{
   const date=x.PressReleaseDate?.match(/^(\d{2})\/(\d{2})\/(\d{4}) /);if(!date)throw Error('ir_invalid_date');
   return row(source,x.Headline,x.LinkToDetailPage,x.PressReleaseDate,now,{day:`${date[3]}-${date[1]}-${date[2]}`});
  });
 }
 if(!rows.length&&!source.allow_empty)throw Error('ir_empty_feed');
 if(new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('ir_duplicate_item');
 return rows.sort((a,b)=>b.filing_date.localeCompare(a.filing_date)||a.id.localeCompare(b.id));
}
async function readFeed(url,source,now){
 const r=await fetch(url,{headers:{accept:source.format==='rss'?'application/rss+xml, application/xml, text/xml':source.format==='palantir'?'application/json':'text/html','user-agent':'SunWatch Research/1.0 (https://invest.agiscorecard.com/research)'},redirect:'manual',signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('ir_http_'+r.status);
 if(Number(r.headers.get('content-length'))>4000000)throw Error('ir_response_too_large');
 // Bound decompressed bytes as well, before buffering or parsing.
 const reader=r.body.getReader(),chunks=[];let bytes=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>4000000)throw Error('ir_response_too_large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 return parseIR(new TextDecoder().decode(buffer),source,now);
}
export async function loadOfficialIR(issuer,now=Date.now()){
 const source=IR_SOURCES[issuer.ticker];if(!source)throw Error('ir_not_configured');
 if(source.format!=='palantir')return readFeed(source.url,source,now);
 const year=new Date(now).getUTCFullYear();
 const url=y=>source.url+`?languageId=1&bodyType=1&year=${y}&includeTags=true&pressReleaseDateFilter=1`;
 // Carry the previous year into January so the source history has an overlap.
 const rows=await readFeed(url(year),source,now).catch(e=>{if(new Date(now).getUTCMonth()===0&&e.message==='ir_empty_feed')return [];throw e;});
 if(new Date(now).getUTCMonth()===0)rows.push(...await readFeed(url(year-1),source,now));
 return rows.sort((a,b)=>b.filing_date.localeCompare(a.filing_date));
}
export function applyIRSnapshot(previous,rows,now=Date.now(),source=null){
 if(!rows.length){
  if(!source?.allow_empty)throw Error('ir_empty_feed');
  return {issuer:{...(previous??{}),source_id:source.id,baseline_at:previous?.baseline_at??iso(now),last_success_at:iso(now),latest_filing_date:previous?.latest_filing_date??null,seen:previous?.seen??[],status:'ok',error:null,feed_empty:true},added:[],pending:[]};
 }
 const latest=rows.reduce((m,x)=>x.filing_date>m?x.filing_date:m,'');
 if(previous?.latest_filing_date&&latest<previous.latest_filing_date)throw Error('source_rollback');
 const known=new Set(previous?.seen??[]);
 if(previous&&!source?.short_window&&rows.every(x=>!known.has(x.id)))throw Error('history_gap');
 const first=!previous,baseline=previous?.baseline_at??iso(now);
 const added=(first?rows.slice(0,5):rows.filter(x=>!known.has(x.id))).map(x=>({...x,first_seen_at:iso(now),baseline:first,
  historical_backfill:!first&&(x.published_at?x.published_at<=baseline:x.filing_date<=baseline.slice(0,10))}));
 return {issuer:{source_id:rows[0].source_id,baseline_at:baseline,last_success_at:iso(now),latest_filing_date:latest,
  seen:[...new Set([...rows.map(x=>x.id),...(previous?.seen??[])])].slice(0,2000),status:'ok',error:null,feed_empty:false},
  added,pending:added.filter(x=>!x.baseline&&!x.historical_backfill).map(x=>x.id)};
}
