// 机械执行层的单元测试。不联网:合成日线跑完整规则梯。
//
// 为什么必须有:这套东西的失效方式是**静默的**——ATR 把不同交易日的 high 和 close 配错、
// 停牌造成的 null 让均线少算几根、杠杆品误走了非杠杆的宽止损,统统不会报错,
// 只会算出一个看起来很合理的数字,然后每天推给站长。数字型 bug 只有断言抓得住。
import { alignBars, atr, computeLevels, decide, distances, PARAMS } from "../src/rules.js";

let bad = 0;
const ok = (cond, what) => { if (!cond) { bad++; console.log("FAIL " + what); } else console.log("ok   " + what); };
const eq = (got, want, what) => ok(JSON.stringify(got) === JSON.stringify(want), what + "  got=" + JSON.stringify(got) + " want=" + JSON.stringify(want));

// --- alignBars:null 必须整根丢弃,三条序列同进同出 ---
{
  const a = alignBars([1, null, 3, 4], [1, 2, null, 4], [1, 2, 3, 4]);
  eq(a.c, [1, 4], "alignBars 丢弃任一字段为 null 的整根");
  eq(a.h.length === a.l.length && a.l.length === a.c.length, true, "alignBars 三条等长");
  const b = alignBars([1, 2], [1, 2], [1, 0]);
  eq(b.c, [1], "alignBars 丢弃收盘为 0 的根(停牌哨兵值)");
}

// --- ATR:手算一个已知答案 ---
{
  const h = [10, 12, 11], l = [9, 10, 9], c = [9.5, 11, 10];
  // TR2 = max(12-10, |12-9.5|, |10-9.5|) = 2.5 ; TR3 = max(11-9, |11-11|, |9-11|) = 2
  eq(Math.round(atr(h, l, c, 2) * 1000) / 1000, 2.25, "ATR 等于真实波幅均值");
  eq(atr(h, l, c, 50), null, "样本不足时 ATR 返回 null 而不是瞎算");
}

// --- 样本不足:不出规则,而不是用短样本硬算 ---
{
  const n = 20, h = [], l = [], c = [];
  for (let i = 0; i < n; i++) { h.push(101 + i); l.push(99 + i); c.push(100 + i); }
  eq(computeLevels(alignBars(h, l, c)), null, "不足 30 根不出读数");
  eq(decide(null).rule, "R0", "无读数时规则梯返回 R0");
}

// --- 规则梯:一条上涨→急跌的合成序列必须依次走过 持有 → 减一档 → 清仓 ---
function series(up, down) {
  const h = [], l = [], c = [];
  for (let i = 0; i < up; i++) { const p = 100 + i; h.push(p + 1); l.push(p - 1); c.push(p); }
  let p = 100 + up - 1;
  for (let i = 0; i < down; i++) { p -= 12; h.push(p + 1); l.push(p - 1); c.push(p); }
  return alignBars(h, l, c);
}
{
  const hold = computeLevels(series(140, 0));
  eq(decide(hold).state, "持有", "上涨末端 = 持有");
  ok(hold.trendLine < hold.close, "上涨中趋势线在现价下方");

  const cut = computeLevels(series(140, 4));
  eq(decide(cut).state, "减一档", "跌破吊灯止损 = 减一档");
  eq(decide(cut).rule, "R2", "减一档的规则编号是 R2");

  const out = computeLevels(series(140, 12));
  eq(decide(out).state, "清仓", "跌破 55 日最低 = 清仓");
  eq(decide(out).rule, "R1", "清仓的规则编号是 R1");
}

// --- 加仓:只在创新高且站上趋势线时 ---
{
  const lv = computeLevels(series(200, 0));
  const d = decide(lv);
  ok(d.rule === "R5" || d.rule === "R3", "持续上涨落在 R5/R3,不会误报卖出");
}

// --- 杠杆品:止损必须比非杠杆更紧,且永远没有加仓项 ---
{
  const bars = series(140, 0);
  const plain = computeLevels(bars, { lev: 1 });
  const lev = computeLevels(bars, { lev: 2 });
  ok(lev.stop > plain.stop, "杠杆品止损更靠近现价(更紧)");
  eq(lev.addLine, null, "杠杆品没有加仓线");
  eq(lev.trendDays, PARAMS.fastDays, "杠杆品走快线");
  eq(lev.exitDays, PARAMS.levExitDays, "杠杆品清仓线收紧到 20 日");
  ok(!["R5"].includes(decide(lev).rule), "杠杆品永远不会给出加仓指令");
}

// --- 规则不看成本价:同一段行情,无论从哪里买入,结论必须一致 ---
{
  const lv = computeLevels(series(140, 4));
  const a = decide(lv), b = decide({ ...lv });   // 没有任何入口可以把成本价传进去
  eq(a, b, "decide 的输入里不存在成本价这个概念");
  ok(!JSON.stringify(lv).includes("cost"), "读数里不含成本字段");
}

// --- 距离:必须按"离得最近"排序,那是"什么时候动"的答案 ---
{
  const lv = computeLevels(series(140, 0));
  const d = distances(lv);
  ok(d.length >= 3, "至少给出三条线的距离");
  for (let i = 1; i < d.length; i++) ok(Math.abs(d[i].pct) >= Math.abs(d[i - 1].pct), "距离按绝对值升序 #" + i);
}

console.log(bad ? "\n" + bad + " FAILED" : "\n全部通过");
process.exit(bad ? 1 : 0);
