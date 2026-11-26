const TELEGRAM_BOT = 'https://t.me/sunwatchBot';
const ATTEMPT = /^[A-Za-z0-9_-]{22}$/;
const HELP_HOURS = 48;

export function skipGrowthRequest(request) {
  const {searchParams} = new URL(request.url);
  return request.method !== 'GET' || searchParams.has('__ci') || searchParams.has('__qa') ||
    request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1' ||
    /prefetch|prerender/i.test(`${request.headers.get('Purpose') || ''} ${request.headers.get('Sec-Purpose') || ''}`);
}

export function checkoutLocale(request) {
  const language = new URL(request.url).searchParams.get('lang');
  if (language === 'en' || language === 'zh') return language;
  if (/(?:^|;\s*)lang=zh(?:;|$)/.test(request.headers.get('Cookie') || '')) return 'zh';
  const first = request.headers.get('Accept-Language')?.split(',', 1)[0].trim();
  return first && !/^zh(?:[-;]|$)/i.test(first) ? 'en' : 'zh';
}

export async function checkoutGrowth(env, operation, payload) {
  if (!env.PORTFOLIO_ALERTS) return null;
  try {
    const binding = env.PORTFOLIO_ALERTS;
    const stub = binding.get(binding.idFromName('sunwatch-checkout-growth-v1'));
    const init = {signal:AbortSignal.timeout(2000),...(payload ? {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload)} : {})};
    const response = await stub.fetch(new Request(`https://portfolio.internal/checkout-growth/${operation}`, init));
    return await response.json();
  } catch {
    return null;
  }
}

export async function purchaseRedirect(request, env, eligible) {
  const locale = checkoutLocale(request);
  let start = `buy_${locale}`;
  if (eligible) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const attempt = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    const record = await checkoutGrowth(env, 'record', {action:'redirect', attempt, locale});
    if (record?.ok) start = `buy_${locale}_${attempt}`;
  }
  return new Response(null, {status:302, headers:{location:`${TELEGRAM_BOT}?start=${start}`,'cache-control':'no-store','referrer-policy':'no-referrer'}});
}

export function parsePurchaseStart(text) {
  const tagged = /^\/start(?:@sunwatchBot)?\s+buy_(en|zh)_([A-Za-z0-9_-]{22})\s*$/i.exec(text);
  if (tagged) return {locale:tagged[1].toLowerCase(), attempt:tagged[2]};
  const localized = /^\/start(?:@sunwatchBot)?\s+buy_(en|zh)\s*$/i.exec(text);
  if (localized) return {locale:localized[1].toLowerCase()};
  if (/^\/(?:buy(?:@sunwatchBot)?|start(?:@sunwatchBot)?\s+buy)\s*$/i.test(text)) return {};
  return null;
}

export const isPrivateCheckoutChat = value => /^[1-9][0-9]{0,19}$/.test(String(value));

// Reply only to a recent help request originally sent by this bot in the owner's private chat.
function helpRecipient(message, config, now = Date.now()) {
  const quoted = message.reply_to_message;
  const date = Number(quoted?.date) * 1000;
  const age = now - date;
  if (!quoted?.from?.is_bot || String(quoted.from.id) !== String(config.token).split(':')[0] ||
      !Number.isFinite(age) || age < 0 || age > HELP_HOURS * 3600000) return null;
  const match = /^SunWatch payment help · (WeChat|Alipay)\nRef: ([1-9][0-9]{0,19})\n/.exec(quoted.text || '');
  return match && match[2] !== String(config.chatId) ? match[2] : null;
}

export async function handleCheckoutSupport({message, config, env, send, english}) {
  const text = (message.text || '').trim();
  const owner = message.chat.type === 'private' && String(message.chat.id) === String(config.chatId);
  const customer = {token:config.token, chatId:message.chat.id};
  const reply = (zh, en) => send(customer, english ? en : zh, null);
  const help = /^\/payhelp(?:@sunwatchBot)?(?:\s+(wechat|alipay))?$/i.exec(text);
  if (help) {
    if (message.chat.type !== 'private' || owner || !isPrivateCheckoutChat(message.chat.id)) return true;
    if (!help[1]) {
      await reply('请选择 /payhelp wechat 或 /payhelp alipay。发出命令会把付款方式请求转给站长，回复会回到本对话。','Send /payhelp wechat or /payhelp alipay. This shares your request with the operator, who can reply here.');
      return true;
    }
    const method = help[1].toLowerCase() === 'wechat' ? 'WeChat' : 'Alipay';
    const result = isPrivateCheckoutChat(config.chatId) && await send(config,
      `SunWatch payment help · ${method}\nRef: ${message.chat.id}\n\n请直接回复这条消息，输入 /payreply 加上付款说明。回复会发到提出请求的 Telegram 对话。`, null).catch(() => null);
    if (result?.ok) await reply('请求已转交站长。付款方式会回复到本对话。','Your request reached the operator. Payment instructions will be sent to this chat.');
    else await reply('付款咨询暂未送达，请稍后再发一次命令。','The payment request could not be delivered. Please try the command again later.');
    return true;
  }

  const answer = /^\/payreply(?:@sunwatchBot)?(?:\s+([\s\S]+))?$/i.exec(text);
  if (answer) {
    if (!owner) return true;
    const recipient = helpRecipient(message, config);
    if (!recipient || !answer[1] || answer[1].length > 3500) {
      await send(config, '请在 48 小时内直接回复机器人转来的付款请求，使用 /payreply 加上付款说明，最多 3500 字。', null);
      return true;
    }
    const result = await send({token:config.token, chatId:recipient}, answer[1], null).catch(() => null);
    await send(config, result?.ok ? '付款说明已发到提出请求的对话。' : '付款说明暂未送达，请核实后重试。', null);
    return true;
  }

  const paid = /^\/paid(?:@sunwatchBot)?(?:\s+(\S+))?$/i.exec(text);
  if (paid) {
    if (!owner) return true;
    if (!ATTEMPT.test(paid[1] || '')) {
      await send(config, '核对实际到账后，使用 /paid 加上购买说明通知里的跟踪号。该命令只记录站长确认。', null);
      return true;
    }
    const result = await checkoutGrowth(env, 'record', {action:'payment',attempt:paid[1]});
    await send(config, result?.ok
      ? result.counted ? '已记录这笔站长核验的到账。' : '这笔到账已记录。'
      : '当前无法记录到账。请核对跟踪号和付款说明送达状态。', null);
    return true;
  }
  return false;
}
