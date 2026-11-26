import assert from 'node:assert/strict';
import {test} from 'node:test';
import worker from '../src/index.js';

const origin = 'https://invest.agiscorecard.com';
const buyer = 123001;
const owner = 123002;
const fakeBotId = 123003;
const fakeSecret = 'offline-fixture';
const browser = {'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/605.1', 'Accept-Language':'en-US', 'Sec-Fetch-Mode':'navigate'};

function fixture(t) {
  const kv = new Map();
  const metrics = [];
  const telegram = [];
  let failing = null;
  t.mock.method(globalThis,'fetch',async (url, options) => {
    assert.equal(url,`https://api.telegram.org/bot${fakeBotId}:fixture/sendMessage`);
    const body = JSON.parse(options.body);
    telegram.push(body);
    const ok = String(body.chat_id) !== String(failing);
    return Response.json({ok},{status:ok?200:400});
  });
  const env = {
    TELEGRAM_BOT_TOKEN:`${fakeBotId}:fixture`, TELEGRAM_CHAT_ID:String(owner), TELEGRAM_WEBHOOK_SECRET:fakeSecret,
    USDT_RECEIVE_ADDRESS:'0x'+'1'.repeat(40),
    SUNWATCH_KV:{
      async get(key,format) {const v=kv.get(key);return format==='json'&&v?JSON.parse(v):v??null;},
      async put(key,value) {kv.set(key,value);},
    },
    PORTFOLIO_ALERTS:{
      idFromName(name) {assert.equal(name,'sunwatch-checkout-growth-v1');return name;},
      get() {return {async fetch(req) {
        const path = new URL(req.url).pathname;
        if (path==='/checkout-growth/report') return Response.json({ok:true,schema_version:1,
          window:{start:'2026-10-29',end_exclusive:'2026-11-26',timezone:'UTC',complete_days:28},counts:{private:true},rows:[]});
        assert.equal(path,'/checkout-growth/record');
        assert.equal(req.method,'POST');
        metrics.push(await req.json());
        return Response.json({ok:true,counted:true});
      }};},
    },
  };
  async function open(path, options) {
    const jobs=[];
    const response=await worker.fetch(new Request(origin+path,options),env,{waitUntil(job){jobs.push(job);}});
    await Promise.all(jobs);
    return response;
  }
  const update = (text, id=buyer, extra={}) => open('/tg-webhook', {
    method:'POST', headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':fakeSecret},
    body:JSON.stringify({message:{chat:{id,type:'private'},from:{language_code:'zh-CN'},text,...extra}}),
  });
  return {env,kv,metrics,telegram,open,update,failFor(id){failing=id;}};
}

test('localized purchase flow counts a quote after Telegram acknowledges it',async t => {
  const f=fixture(t);
  for (const [path,match] of [['/en?__ci=1','en'],['/?lang=zh&__ci=1','zh']]) {
    const page=await f.open(path,{headers:browser});
    assert.equal(page.status,200);
    const html=await page.text();
    assert.match(html,/id="pricing"/);
    assert.ok(html.includes(`/go/buy?lang=${match}`));
  }
  assert.equal(f.kv.has('growth'),false);
  assert.equal((await f.open('/go/pro?lang=en&__ci=1',{headers:browser})).headers.get('location'),origin+'/en#pricing');
  assert.equal((await f.open('/go/pro?lang=zh&__ci=1',{headers:browser})).headers.get('location'),origin+'/?lang=zh#pricing');
  for (const [suffix,options] of [['&__ci=1',{headers:browser}],['',{method:'HEAD',headers:browser}],['',{headers:{...browser,'Sec-GPC':'1'}}],['',{headers:{...browser,'Sec-Purpose':'prefetch'}}]]) {
    const safe=await f.open('/go/buy?lang=en'+suffix,options);
    assert.equal(safe.headers.get('location'),'https://t.me/sunwatchBot?start=buy_en');
  }
  assert.deepEqual(f.metrics,[]);
  assert.equal(f.kv.has('growth'),false);
  const redirect=await f.open('/go/buy?lang=en',{headers:browser});
  assert.equal(redirect.status,302);
  assert.equal(redirect.headers.get('cache-control'),'no-store');
  const start=new URL(redirect.headers.get('location')).searchParams.get('start');
  assert.match(start,/^buy_en_[A-Za-z0-9_-]{22}$/);
  const attempt=start.slice(7);
  assert.deepEqual(f.metrics,[{action:'redirect',attempt,locale:'en'}]);
  f.failFor(buyer);
  assert.equal((await f.update('/start '+start)).status,200);
  assert.deepEqual(f.metrics.map(x=>x.action),['redirect','start']);
  assert.match(f.telegram.at(-1).text,/送达未获确认/);
  f.failFor(null);
  await f.update('/start '+start);
  assert.deepEqual(f.metrics.map(x=>x.action),['redirect','start','start','quote']);
  assert.match(f.telegram.at(-2).text,/28 USDT \/ month.*280 USDT \/ year/);
  assert.match(f.telegram.at(-1).text,new RegExp('/paid '+attempt));
  assert.equal(f.kv.has('free-subs'),false);
  const requestsBefore=f.metrics.length;
  await f.update('/paid '+attempt);
  assert.equal(f.metrics.length,requestsBefore);
  await f.update('/paid '+attempt,owner);
  assert.deepEqual(f.metrics.at(-1),{action:'payment',attempt});
  const ownerAddress=new URL((await f.open('/go/buy?lang=zh',{headers:browser})).headers.get('location'));
  await f.update('/start '+ownerAddress.searchParams.get('start'),owner);
  assert.equal(f.metrics.at(-1).action,'discard');
  const health=await (await f.open('/api/checkout-growth')).json();
  assert.equal(health.scope,'health_only');
  assert.deepEqual(health.availability,{usdt:true,payment_help:true});
  assert.ok(!('rows' in health) && !('counts' in health));
  assert.equal((await f.open('/checkout-growth/record',{method:'POST'})).status,404);
});

test('payment help is explicit and the operator can reply only to a recent bot request',async t => {
  const f=fixture(t);
  await f.update('/payhelp');
  assert.ok(f.telegram.every(message=>String(message.chat_id)===String(buyer)));
  await f.update('/payhelp alipay');
  const notification=f.telegram.at(-2);
  assert.equal(String(notification.chat_id),String(owner));
  assert.match(notification.text,/SunWatch payment help · Alipay/);
  assert.match(f.telegram.at(-1).text,/已转交/);
  const reply_to_message={from:{id:fakeBotId,is_bot:true},date:Math.floor(Date.now()/1000),text:notification.text};
  const before=f.telegram.length;
  await f.update('/payreply Fixture payment details',buyer,{reply_to_message});
  assert.equal(f.telegram.length,before);
  await f.update('/payreply Fixture payment details',owner,{reply_to_message});
  assert.equal(String(f.telegram.at(-2).chat_id),String(buyer));
  assert.equal(f.telegram.at(-2).text,'Fixture payment details');
  assert.match(f.telegram.at(-1).text,/发到提出请求/);
  await f.update('/payreply Must stay private',owner,{reply_to_message:{...reply_to_message,from:{id:buyer,is_bot:false}}});
  assert.equal(String(f.telegram.at(-1).chat_id),String(owner));
  assert.ok(f.telegram.every(message=>message.text!=='Must stay private'));
  f.failFor(owner);
  await f.update('/payhelp wechat');
  assert.match(f.telegram.at(-1).text,/暂未送达/);
  f.env.USDT_RECEIVE_ADDRESS='';
  await f.update('/start buy_en');
  assert.match(f.telegram.at(-1).text,/temporarily unavailable/);
  assert.deepEqual(f.metrics,[]);
});
