// 机械执行层(2026-09-10,站长指令:「告诉我应该在哪些时间买入卖出,机械式而不是代情绪」)。
//
// 这个文件里没有任何判断,只有算术。它存在的理由是本仓 CLAUDE.md 的铁律 3
// ——「不做预测,做触发执行」——此前只落实了一半:WATCHLIST 的触发线确实存在,
// 但它们是 7 月手写进代码的常数,两个月没有重算,其中一条的 label 直接写着「待校准」。
// 一个两个月不变的阈值不是机械系统,是一个被冻起来的判断。
//
// 三条刻意的设计约束,每一条都是为了把情绪挡在外面:
//
// 1. **不看成本价。** 规则的输入只有价格序列,没有你的买入价、没有浮盈浮亏。
//    只要系统知道你套了多少,「等回本再走」就有了入口——这是散户最贵的一句话。
//    机械系统必须对「你从哪进来的」一无所知。
// 2. **参数写死并公开。** 100/55/20/14/3 全部在下面这张表里,页面上原样渲染。
//    事后改参数去迎合已经发生的行情,是最隐蔽的一种自欺;改了就会在 git 里留痕。
// 3. **只在状态翻转时报警。** 每 30 分钟重复推送同一个「持有」会把人训练成无视通知,
//    而无视通知之后接管决策的就是情绪。
//
// 免责:研究框架,非投资建议。规则会亏钱;机械不等于正确,只等于可复算、可审计。

export const PARAMS = {
  trendDays: 100,      // ≈20 周。7-20 那次周检想用 20 周均线,当时沙箱取不到日线,只能"按未跌破处理"
  fastDays: 50,        // 杠杆品用的快线
  exitDays: 55,        // 唐奇安下轨:跌破 = 清仓
  entryDays: 55,       // 唐奇安上轨:突破 = 加一档(仅非杠杆)
  levExitDays: 20,     // 杠杆品的下轨收紧到 20 日
  atrDays: 14,
  atrMult: 3,          // 吊灯止损宽度(非杠杆)
  levAtrMult: 2,       // 杠杆品收紧
};

const last = (a, n) => a.slice(Math.max(0, a.length - n));
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);

// Yahoo 的日线数组里会有 null(停牌/半日市)。三条序列必须按同一组下标对齐后再算,
// 否则 ATR 会把不同交易日的 high 和 close 配到一起——这种错不会报错,只会算出一个
// 看起来很合理的错数字。
export function alignBars(highs, lows, closes) {
  const n = Math.min(highs?.length || 0, lows?.length || 0, closes?.length || 0);
  const h = [], l = [], c = [];
  for (let i = 0; i < n; i++) {
    const H = highs[i], L = lows[i], C = closes[i];
    if (H == null || L == null || C == null || !(C > 0)) continue;
    h.push(H); l.push(L); c.push(C);
  }
  return { h, l, c };
}

export function atr(h, l, c, days) {
  if (c.length < days + 1) return null;
  const tr = [];
  for (let i = 1; i < c.length; i++) {
    tr.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])));
  }
  return mean(last(tr, days));
}

// 全部读数一次算完。价格序列进,数字出,没有任何分支依赖"今天是什么情况"。
export function computeLevels(bars, { lev = 1 } = {}) {
  const { h, l, c } = bars;
  if (c.length < 30) return null;           // 上市不足 30 个交易日:不出规则,而不是用短样本硬算
  const P = PARAMS;
  const A = atr(h, l, c, P.atrDays);
  const exitDays = lev > 1 ? P.levExitDays : P.exitDays;
  const mult = lev > 1 ? P.levAtrMult : P.atrMult;
  const trend = mean(last(c, lev > 1 ? P.fastDays : P.trendDays));
  // 吊灯止损从"通道内的最高价"往下量,而不是从你的成本或某个记忆里的高点往下量。
  // 它**包含今天**:创新高就该把止损往上抬,这正是吊灯止损的定义。
  const peak = Math.max(...last(h, exitDays));
  // 唐奇安通道则必须**排除今天**——这是单元测试抓出来的真 bug。把今天算进去,
  // 「跌破 N 日最低」在直线下跌里永远不成立(今天自己就是那个最低),清仓规则等于死代码;
  // 加仓线同理,「收盘 > N 日最高」也几乎不可能为真。经典形态本来就是拿今天的收盘
  // 去比**此前** N 根的极值,写错了不会报错,只会让两条规则一辈子不触发。
  const prevH = h.slice(0, -1), prevL = l.slice(0, -1);
  const floor_ = prevL.length ? Math.min(...last(prevL, exitDays)) : null;
  return {
    bars: c.length,
    close: r2(c[c.length - 1]),
    trendLine: r2(trend),
    trendDays: lev > 1 ? P.fastDays : P.trendDays,
    atr: r2(A),
    stop: A == null ? null : r2(peak - mult * A),
    stopFrom: r2(peak),
    exitLine: r2(floor_),
    exitDays,
    addLine: lev > 1 || !prevH.length ? null : r2(Math.max(...last(prevH, P.entryDays))),
    lev,
  };
}

// 规则梯:自上而下第一条命中即返回。每条都带编号,推送里原样带上——
// 一条不能说出自己是哪条规则的报警,和一个意见没有区别。
export function decide(lv) {
  if (!lv || lv.close == null) return { rule: "R0", state: "数据不足", action: "不动:样本不足,不出规则" };
  const { close, trendLine, stop, exitLine, addLine, lev } = lv;
  if (exitLine != null && close < exitLine)
    return { rule: lev > 1 ? "L1" : "R1", state: "清仓",
             action: `清仓:收盘 ${close} < ${lv.exitDays} 日最低 ${exitLine}` };
  if (stop != null && close < stop)
    return { rule: lev > 1 ? "L2" : "R2", state: "减一档",
             action: `卖出 1/3:收盘 ${close} < 吊灯止损 ${stop}(=区间高 ${lv.stopFrom} − ${lev > 1 ? PARAMS.levAtrMult : PARAMS.atrMult}×ATR ${lv.atr})` };
  if (addLine != null && trendLine != null && close > addLine && close > trendLine)
    return { rule: "R5", state: "加一档",
             action: `买入 1/3:收盘 ${close} 创 ${PARAMS.entryDays} 日新高且在 ${lv.trendDays} 日线 ${trendLine} 上方` };
  if (trendLine != null && close < trendLine)
    return { rule: lev > 1 ? "L4" : "R4", state: "不新建",
             action: `不买不卖:收盘 ${close} < ${lv.trendDays} 日线 ${trendLine},趋势关闭,禁止加仓;止损 ${stop} 由系统盯守` };
  return { rule: lev > 1 ? "L3" : "R3", state: "持有",
           action: `不动:在 ${lv.trendDays} 日线 ${trendLine} 上方,止损 ${stop},清仓线 ${exitLine}` };
}

// 距离最近一条会改变动作的线还有多远——「什么时候买卖」的时间感来自这里。
export function distances(lv) {
  if (!lv || lv.close == null) return [];
  const out = [];
  const push = (name, v) => { if (v != null && v > 0) out.push({ name, level: v, pct: Math.round(((v - lv.close) / lv.close) * 1000) / 10 }); };
  push("止损", lv.stop); push("清仓线", lv.exitLine); push(`${lv.trendDays}日线`, lv.trendLine); push("加仓线", lv.addLine);
  return out.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
}
