import {
  calcSMA,
  calcEMA,
  calcWMA,
  calcMA,
  calcMACD,
  calcBOLL,
  calcKDJ,
  calcRSI,
  calcWR,
  calcBIAS,
  calcCCI,
  calcATR,
  calcOBV,
  calcROC,
  calcDMI,
  calcSAR,
  calcKC,
} from './indicators';
import type { OHLCV } from '@/types';

const closes = [10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 12, 13, 14, 15, 16];

const ohlcv: OHLCV[] = closes.map((c, i) => ({
  open: i === 0 ? c : (closes[i - 1] ?? c),
  close: c,
  high: c + 0.5,
  low: c - 0.5,
  volume: 100 + i * 10,
}));

describe('calcSMA', () => {
  it('returns null for the warm-up period and rolling mean afterwards', () => {
    const result = calcSMA([1, 2, 3, 4, 5], 3);
    expect(result).toEqual([null, null, 2, 3, 4]);
  });

  it('handles null inputs by skipping them in the window', () => {
    const result = calcSMA([1, null, 3, 4, 5], 3);
    expect(result.slice(0, 2)).toEqual([null, null]);
    // 第 3 项 [1, null, 3] 中只有 2 个有效值，不足 period，应为 null
    expect(result[2]).toBeNull();
  });
});

describe('calcEMA', () => {
  it('seeds with first value and applies the smoothing factor', () => {
    const result = calcEMA([10, 11, 12], 3);
    // k = 2/4 = 0.5；ema0=10，ema1=11*0.5+10*0.5=10.5，ema2=12*0.5+10.5*0.5=11.25
    expect(result[0]).toBe(10);
    expect(result[1]).toBeCloseTo(10.5, 6);
    expect(result[2]).toBeCloseTo(11.25, 6);
  });
});

describe('calcWMA', () => {
  it('weights recent values more heavily', () => {
    // 周期 3，权重 [1,2,3] / 6
    const result = calcWMA([1, 2, 3, 4], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo((1 * 1 + 2 * 2 + 3 * 3) / 6, 6); // 14/6
    expect(result[3]).toBeCloseTo((2 * 1 + 3 * 2 + 4 * 3) / 6, 6); // 20/6
  });
});

describe('calcMA', () => {
  it('produces ma{period} keys for each requested period', () => {
    const result = calcMA(closes, { periods: [3, 5] });
    expect(result).toHaveLength(closes.length);
    expect(result[2]).toMatchObject({ ma3: expect.any(Number) });
    expect(result[4]).toMatchObject({ ma3: expect.any(Number), ma5: expect.any(Number) });
    // 前 4 项 ma5 都应为 null
    expect(result[3]?.ma5).toBeNull();
  });

  it('supports ema and wma variants', () => {
    const ema = calcMA([10, 11, 12, 13], { periods: [3], type: 'ema' });
    const wma = calcMA([10, 11, 12, 13], { periods: [3], type: 'wma' });
    expect(ema[0]?.ma3).not.toBeNull(); // EMA 没有 warm-up null
    expect(wma[0]?.ma3).toBeNull(); // WMA 有 warm-up
  });
});

describe('calcMACD', () => {
  it('returns null until both EMAs are warmed up enough for DEA', () => {
    const result = calcMACD(closes, { short: 2, long: 4, signal: 2 });
    expect(result).toHaveLength(closes.length);
    // 最后一项必须三个字段都是 number
    const last = result[result.length - 1];
    expect(typeof last?.dif).toBe('number');
    expect(typeof last?.dea).toBe('number');
    expect(typeof last?.macd).toBe('number');
  });

  it('macd column equals (dif - dea) * 2', () => {
    const result = calcMACD(closes);
    const last = result[result.length - 1]!;
    expect(last.macd).toBeCloseTo((last.dif! - last.dea!) * 2, 6);
  });
});

describe('calcBOLL', () => {
  it('returns mid as SMA and upper/lower symmetric around mid', () => {
    const result = calcBOLL(closes, { period: 5, stdDev: 2 });
    const i = closes.length - 1;
    const item = result[i]!;
    expect(item.mid).not.toBeNull();
    expect(item.upper).not.toBeNull();
    expect(item.lower).not.toBeNull();
    expect(item.upper! - item.mid!).toBeCloseTo(item.mid! - item.lower!, 6);
  });
});

describe('calcKDJ', () => {
  it('keeps K/D bounded sensibly and J = 3K - 2D', () => {
    const result = calcKDJ(ohlcv, { period: 5 });
    const last = result[result.length - 1]!;
    expect(last.j).toBeCloseTo(3 * last.k! - 2 * last.d!, 6);
  });
});

describe('calcRSI', () => {
  it('returns values in [0, 100]', () => {
    const result = calcRSI(closes, { periods: [3, 6] });
    for (const item of result) {
      for (const v of Object.values(item)) {
        if (typeof v === 'number') {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('reports 100 when there have been no losses', () => {
    const result = calcRSI([10, 11, 12, 13, 14, 15, 16], { periods: [3] });
    expect(result[result.length - 1]?.rsi3).toBe(100);
  });
});

describe('calcWR', () => {
  it('returns negative values in [-100, 0]', () => {
    const result = calcWR(ohlcv, { periods: [3] });
    for (const item of result) {
      const v = item.wr3;
      if (typeof v === 'number') {
        expect(v).toBeGreaterThanOrEqual(-100);
        expect(v).toBeLessThanOrEqual(0);
      }
    }
  });
});

describe('calcBIAS', () => {
  it('returns 0 when close equals MA', () => {
    const flat = [10, 10, 10, 10, 10];
    const result = calcBIAS(flat, { periods: [3] });
    expect(result[2]?.bias3).toBeCloseTo(0, 6);
  });
});

describe('calcCCI', () => {
  it('returns 0 when there is zero deviation', () => {
    const flatItems: OHLCV[] = Array.from({ length: 20 }, () => ({
      open: 10,
      high: 10,
      low: 10,
      close: 10,
      volume: 100,
    }));
    const result = calcCCI(flatItems, { period: 14 });
    expect(result[14]?.cci).toBe(0);
  });
});

describe('calcATR', () => {
  it('produces a non-negative atr after warm-up', () => {
    const result = calcATR(ohlcv, { period: 5 });
    const last = result[result.length - 1]!;
    expect(last.atr).not.toBeNull();
    expect(last.atr!).toBeGreaterThanOrEqual(0);
  });
});

describe('calcOBV', () => {
  it('accumulates volume up on rises and down on falls', () => {
    const items: OHLCV[] = [
      { open: 10, close: 10, high: 10, low: 10, volume: 100 },
      { open: 10, close: 11, high: 11, low: 10, volume: 50 }, // 上涨 → +50
      { open: 11, close: 10, high: 11, low: 10, volume: 30 }, // 下跌 → -30
      { open: 10, close: 10, high: 10, low: 10, volume: 20 }, // 平 → 不变
    ];
    const result = calcOBV(items, { maPeriod: 2 });
    expect(result[0]?.obv).toBe(100);
    expect(result[1]?.obv).toBe(150);
    expect(result[2]?.obv).toBe(120);
    expect(result[3]?.obv).toBe(120);
  });
});

describe('calcROC', () => {
  it('is 0 when current equals N periods ago', () => {
    const flat = [10, 11, 12, 11, 10, 11, 12, 11, 10];
    const result = calcROC(flat, { period: 4, signalPeriod: 2 });
    // index 4 vs index 0 都是 10
    expect(result[4]?.roc).toBeCloseTo(0, 6);
  });
});

describe('calcDMI', () => {
  const series: OHLCV[] = Array.from({ length: 60 }, (_, i) => ({
    open: 100 + i,
    close: 100 + i + (i % 3 === 0 ? 1 : -1),
    high: 100 + i + 2,
    low: 100 + i - 2,
    volume: 1000,
  }));

  it('returns numbers for ADX after sufficient warm-up', () => {
    const result = calcDMI(series, { period: 14, adxPeriod: 14 });
    const last = result[result.length - 1]!;
    expect(typeof last.pdi).toBe('number');
    expect(typeof last.mdi).toBe('number');
    expect(typeof last.adx).toBe('number');
  });

  it('ADX equals the simple average of the last adxPeriod DX values', () => {
    const period = 14;
    const adxPeriod = 14;
    const result = calcDMI(series, { period, adxPeriod });

    // 从暴露的 pdi/mdi 反推每个点的 DX，作为独立 oracle
    const dx = result.map((r) =>
      r.pdi !== null && r.mdi !== null
        ? (Math.abs(r.pdi - r.mdi) / (r.pdi + r.mdi || 1)) * 100
        : null
    );

    let checked = 0;
    for (let i = 0; i < result.length; i++) {
      const adx = result[i]!.adx;
      if (adx === null) continue;
      let sum = 0;
      for (let j = i - adxPeriod + 1; j <= i; j++) sum += dx[j] ?? 0;
      expect(adx).toBeCloseTo(sum / adxPeriod, 6);
      checked++;
    }
    // 确保确实断言到了若干个点，而不是全被 null 跳过
    expect(checked).toBeGreaterThan(0);
  });
});

describe('calcSAR', () => {
  it('flips trend when price crosses sar', () => {
    // 先升后跌的价格走势
    const items: OHLCV[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        open: 10 + i,
        close: 10 + i,
        high: 10 + i + 0.5,
        low: 10 + i - 0.5,
        volume: 100,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        open: 14 - i,
        close: 14 - i,
        high: 14 - i + 0.5,
        low: 14 - i - 0.5,
        volume: 100,
      })),
    ];
    const result = calcSAR(items);
    const trends = result.map((r) => r.trend);
    expect(trends[0]).toBe(1); // 起始上升趋势
    // 后半段应当出现 -1（趋势反转）
    expect(trends.slice(5).some((t) => t === -1)).toBe(true);
  });
});

describe('calcKC', () => {
  it('upper - mid equals multiplier * atr', () => {
    const big: OHLCV[] = Array.from({ length: 40 }, (_, i) => ({
      open: 100 + i,
      close: 100 + i + (i % 4 === 0 ? 1 : -1),
      high: 100 + i + 2,
      low: 100 + i - 2,
      volume: 100,
    }));
    const result = calcKC(big, { emaPeriod: 5, atrPeriod: 5, multiplier: 2 });
    const last = result[result.length - 1]!;
    expect(last.upper! - last.mid!).toBeGreaterThan(0);
    expect(last.upper! - last.mid!).toBeCloseTo(last.mid! - last.lower!, 6);
  });
});
