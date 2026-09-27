// 真人口径的离线断言(2026-09-27)。部署自检用 curl 打 /go/buy,爬虫顺 /go/ 链接走 —— 两者都不能进 h_* 计数。
import assert from 'node:assert/strict';
import { isBotUA } from '../src/index.js';

const bots = ['', '   ', 'curl/8.5.0', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; Googlebot/2.1)', 'TelegramBot (like TwitterBot)', 'python-requests/2.31',
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)', 'Mozilla/5.0 HeadlessChrome/128.0'];
const humans = ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'];
for (const u of bots) assert.equal(isBotUA(u), true, 'should be bot: ' + u);
for (const u of humans) assert.equal(isBotUA(u), false, 'should be human: ' + u);
console.log(`growth: ${bots.length + humans.length} UA assertions OK`);
