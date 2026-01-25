import type { OHLCV, MAResult, MACDResult, BOLLResult, KDJResult, RSIResult, WRResult, BIASResult, CCIResult, ATRResult, OBVResult, ROCResult, DMIResult, SARResult, KCResult } from '@/types';

/**
 * 计算 SMA（简单移动平均）
 */
export function calcSMA(data: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value !== null && value !== undefined) {
      sum += value;
      count++;
    }

    if (i >= period) {
      const oldValue = data[i - period];
      if (oldValue !== null && oldValue !== undefined) {
        sum -= oldValue;
        count--;
      }
    }

    if (i >= period - 1 && count === period) {
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }

  return result;
}

/**
 * 计算 EMA（指数移动平均）
 */
export function calcEMA(data: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value === null || value === undefined) {
      result.push(ema);
      continue;
    }

    if (ema === null) {
      ema = value;
    } else {
      ema = value * k + ema * (1 - k);
    }
    result.push(ema);
  }

  return result;
}

/**
 * 计算 WMA（加权移动平均）
 */
export function calcWMA(data: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const weights = Array.from({ length: period }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }

    let sum = 0;
    let validCount = 0;
    for (let j = 0; j < period; j++) {
      const value = data[i - period + 1 + j];
      const weight = weights[j];
      if (value !== null && value !== undefined && weight !== undefined) {
        sum += value * weight;
        validCount++;
      }
    }

    if (validCount === period) {
      result.push(sum / weightSum);
    } else {
      result.push(null);
    }
  }

  return result;
}

/**
 * 计算 MA（移动平均线）
 */
export function calcMA(
  closes: (number | null)[],
  options: { periods?: number[]; type?: 'sma' | 'ema' | 'wma' } = {}
): MAResult[] {
  const { periods = [5, 10, 20, 30, 60], type = 'sma' } = options;

  const maArrays: Record<string, (number | null)[]> = {};

  for (const period of periods) {
    const key = `ma${period}`;
    switch (type) {
      case 'ema':
        maArrays[key] = calcEMA(closes, period);
        break;
      case 'wma':
        maArrays[key] = calcWMA(closes, period);
        break;
      default:
        maArrays[key] = calcSMA(closes, period);
    }
  }

  const result: MAResult[] = [];
  for (let i = 0; i < closes.length; i++) {
    const item: MAResult = {};
    for (const key of Object.keys(maArrays)) {
      const arr = maArrays[key];
      item[key] = arr !== undefined ? (arr[i] ?? null) : null;
    }
    result.push(item);
  }

  return result;
}

/**
 * 计算 MACD
 */
export function calcMACD(
  closes: (number | null)[],
  options: { short?: number; long?: number; signal?: number } = {}
): MACDResult[] {
  const { short = 12, long = 26, signal = 9 } = options;

  const emaShort = calcEMA(closes, short);
  const emaLong = calcEMA(closes, long);

  // DIF = EMA(short) - EMA(long)
  const dif: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    const s = emaShort[i];
    const l = emaLong[i];
    if (s !== null && s !== undefined && l !== null && l !== undefined) {
      dif.push(s - l);
    } else {
      dif.push(null);
    }
  }

  // DEA = EMA(DIF, signal)
  const dea = calcEMA(dif, signal);

  // MACD = (DIF - DEA) * 2
  const result: MACDResult[] = [];
  for (let i = 0; i < closes.length; i++) {
    const d = dif[i] ?? null;
    const de = dea[i] ?? null;
    result.push({
      dif: d,
      dea: de,
      macd: d !== null && de !== null ? (d - de) * 2 : null,
    });
  }

  return result;
}

/**
 * 计算 BOLL（布林带）
 */
export function calcBOLL(
  closes: (number | null)[],
  options: { period?: number; stdDev?: number } = {}
): BOLLResult[] {
  const { period = 20, stdDev = 2 } = options;

  const ma = calcSMA(closes, period);
  const result: BOLLResult[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = ma[i];
    if (mid === null || mid === undefined || i < period - 1) {
      result.push({ mid: null, upper: null, lower: null, bandwidth: null });
      continue;
    }

    // 计算标准差
    let sum = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const value = closes[j];
      if (value !== null && value !== undefined) {
        sum += Math.pow(value - mid, 2);
        count++;
      }
    }

    if (count === period) {
      const std = Math.sqrt(sum / period);
      const upper = mid + stdDev * std;
      const lower = mid - stdDev * std;
      result.push({
        mid,
        upper,
        lower,
        bandwidth: mid !== 0 ? ((upper - lower) / mid) * 100 : null,
      });
    } else {
      result.push({ mid, upper: null, lower: null, bandwidth: null });
    }
  }

  return result;
}

/**
 * 计算 KDJ
 */
export function calcKDJ(
  data: OHLCV[],
  options: { period?: number; kPeriod?: number; dPeriod?: number } = {}
): KDJResult[] {
  const { period = 9, kPeriod = 3, dPeriod = 3 } = options;

  const result: KDJResult[] = [];
  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ k: null, d: null, j: null });
      continue;
    }

    // 计算 N 日最高价和最低价
    let highN = -Infinity;
    let lowN = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      const item = data[j];
      if (item !== undefined && item.high !== null && item.high !== undefined) {
        highN = Math.max(highN, item.high);
      }
      if (item !== undefined && item.low !== null && item.low !== undefined) {
        lowN = Math.min(lowN, item.low);
      }
    }

    const currentItem = data[i];
    const close = currentItem !== undefined ? currentItem.close : null;
    if (close === null || close === undefined || highN === -Infinity || lowN === Infinity) {
      result.push({ k: null, d: null, j: null });
      continue;
    }

    // RSV
    const rsv = highN === lowN ? 50 : ((close - lowN) / (highN - lowN)) * 100;

    // K = (2/3) * prevK + (1/3) * RSV (或使用 kPeriod)
    const k = (prevK * (kPeriod - 1) + rsv) / kPeriod;
    // D = (2/3) * prevD + (1/3) * K
    const d = (prevD * (dPeriod - 1) + k) / dPeriod;
    // J = 3K - 2D
    const j = 3 * k - 2 * d;

    result.push({ k, d, j });
    prevK = k;
    prevD = d;
  }

  return result;
}

/**
 * 计算 RSI
 */
export function calcRSI(
  closes: (number | null)[],
  options: { periods?: number[] } = {}
): RSIResult[] {
  const { periods = [6, 12, 24] } = options;

  const rsiArrays: Record<string, (number | null)[]> = {};

  for (const period of periods) {
    const key = `rsi${period}`;
    const rsi: (number | null)[] = [];

    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < closes.length; i++) {
      const current = closes[i];
      const prev = closes[i - 1];
      if (i === 0 || current === null || current === undefined || prev === null || prev === undefined) {
        rsi.push(null);
        continue;
      }

      const change = current - prev;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      if (i < period) {
        avgGain += gain;
        avgLoss += loss;
        rsi.push(null);
      } else if (i === period) {
        avgGain = (avgGain + gain) / period;
        avgLoss = (avgLoss + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    rsiArrays[key] = rsi;
  }

  const result: RSIResult[] = [];
  for (let i = 0; i < closes.length; i++) {
    const item: RSIResult = {};
    for (const key of Object.keys(rsiArrays)) {
      const arr = rsiArrays[key];
      item[key] = arr !== undefined ? (arr[i] ?? null) : null;
    }
    result.push(item);
  }

  return result;
}

/**
 * 计算 WR（威廉指标）
 */
export function calcWR(
  data: OHLCV[],
  options: { periods?: number[] } = {}
): WRResult[] {
  const { periods = [6, 10] } = options;

  const wrArrays: Record<string, (number | null)[]> = {};

  for (const period of periods) {
    const key = `wr${period}`;
    const wr: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        wr.push(null);
        continue;
      }

      let highN = -Infinity;
      let lowN = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        const item = data[j];
        if (item !== undefined && item.high !== null && item.high !== undefined) {
          highN = Math.max(highN, item.high);
        }
        if (item !== undefined && item.low !== null && item.low !== undefined) {
          lowN = Math.min(lowN, item.low);
        }
      }

      const currentItem = data[i];
      const close = currentItem !== undefined ? currentItem.close : null;
      if (close === null || close === undefined || highN === lowN) {
        wr.push(null);
      } else {
        wr.push(((highN - close) / (highN - lowN)) * -100);
      }
    }

    wrArrays[key] = wr;
  }

  const result: WRResult[] = [];
  for (let i = 0; i < data.length; i++) {
    const item: WRResult = {};
    for (const key of Object.keys(wrArrays)) {
      const arr = wrArrays[key];
      item[key] = arr !== undefined ? (arr[i] ?? null) : null;
    }
    result.push(item);
  }

  return result;
}

/**
 * 计算 BIAS（乖离率）
 */
export function calcBIAS(
  closes: (number | null)[],
  options: { periods?: number[] } = {}
): BIASResult[] {
  const { periods = [6, 12, 24] } = options;

  const biasArrays: Record<string, (number | null)[]> = {};

  for (const period of periods) {
    const key = `bias${period}`;
    const ma = calcSMA(closes, period);
    const bias: (number | null)[] = [];

    for (let i = 0; i < closes.length; i++) {
      const close = closes[i];
      const m = ma[i];
      if (close === null || close === undefined || m === null || m === undefined || m === 0) {
        bias.push(null);
      } else {
        bias.push(((close - m) / m) * 100);
      }
    }

    biasArrays[key] = bias;
  }

  const result: BIASResult[] = [];
  for (let i = 0; i < closes.length; i++) {
    const item: BIASResult = {};
    for (const key of Object.keys(biasArrays)) {
      const arr = biasArrays[key];
      item[key] = arr !== undefined ? (arr[i] ?? null) : null;
    }
    result.push(item);
  }

  return result;
}

/**
 * 计算 CCI（顺势指标）
 */
export function calcCCI(
  data: OHLCV[],
  options: { period?: number } = {}
): CCIResult[] {
  const { period = 14 } = options;

  // TP = (High + Low + Close) / 3
  const tp: (number | null)[] = data.map((item) => {
    if (item.high === null || item.low === null || item.close === null) {
      return null;
    }
    return (item.high + item.low + item.close) / 3;
  });

  const maTp = calcSMA(tp, period);

  const result: CCIResult[] = [];
  for (let i = 0; i < data.length; i++) {
    const tpVal = tp[i];
    const maTpVal = maTp[i];
    if (i < period - 1 || tpVal === null || tpVal === undefined || maTpVal === null || maTpVal === undefined) {
      result.push({ cci: null });
      continue;
    }

    // 计算平均偏差
    let sum = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const t = tp[j];
      if (t !== null && t !== undefined) {
        sum += Math.abs(t - maTpVal);
        count++;
      }
    }

    const md = count > 0 ? sum / count : 0;
    if (md === 0) {
      result.push({ cci: 0 });
    } else {
      result.push({ cci: (tpVal - maTpVal) / (0.015 * md) });
    }
  }

  return result;
}

/**
 * 计算 ATR（平均真实波幅）
 */
export function calcATR(
  data: OHLCV[],
  options: { period?: number } = {}
): ATRResult[] {
  const { period = 14 } = options;

  const result: ATRResult[] = [];
  const trList: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item === undefined || item.high === null || item.low === null || item.close === null) {
      trList.push(null);
      result.push({ tr: null, atr: null });
      continue;
    }

    let tr: number;
    if (i === 0) {
      tr = item.high - item.low;
    } else {
      const prevItem = data[i - 1];
      const prevClose = prevItem !== undefined ? prevItem.close : null;
      if (prevClose === null || prevClose === undefined) {
        tr = item.high - item.low;
      } else {
        tr = Math.max(
          item.high - item.low,
          Math.abs(item.high - prevClose),
          Math.abs(item.low - prevClose)
        );
      }
    }

    trList.push(tr);

    if (i < period - 1) {
      result.push({ tr, atr: null });
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += trList[j] ?? 0;
      }
      result.push({ tr, atr: sum / period });
    } else {
      const prevResult = result[i - 1];
      const prevAtr = prevResult !== undefined ? prevResult.atr : null;
      if (prevAtr === null || prevAtr === undefined) {
        result.push({ tr, atr: null });
      } else {
        result.push({ tr, atr: (prevAtr * (period - 1) + tr) / period });
      }
    }
  }

  return result;
}

/**
 * 计算 OBV（能量潮）
 */
export function calcOBV(
  data: OHLCV[],
  options: { maPeriod?: number } = {}
): OBVResult[] {
  const { maPeriod = 30 } = options;

  const result: OBVResult[] = [];
  let obv = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item === undefined || item.close === null || item.volume === null || item.volume === undefined) {
      result.push({ obv: null, obvMa: null });
      continue;
    }

    if (i === 0) {
      obv = item.volume;
    } else {
      const prevItem = data[i - 1];
      const prevClose = prevItem !== undefined ? prevItem.close : null;
      if (prevClose === null || prevClose === undefined) {
        obv = item.volume;
      } else if (item.close > prevClose) {
        obv += item.volume;
      } else if (item.close < prevClose) {
        obv -= item.volume;
      }
      // 如果收盘价相等，OBV 不变
    }

    result.push({ obv, obvMa: null });
  }

  // 计算 OBV 的移动平均
  const obvValues = result.map((r) => r.obv);
  const obvMa = calcSMA(obvValues, maPeriod);

  for (let i = 0; i < result.length; i++) {
    const r = result[i];
    if (r !== undefined) {
      r.obvMa = obvMa[i] ?? null;
    }
  }

  return result;
}

/**
 * 计算 ROC（变动率）
 */
export function calcROC(
  closes: (number | null)[],
  options: { period?: number; signalPeriod?: number } = {}
): ROCResult[] {
  const { period = 12, signalPeriod = 6 } = options;

  const roc: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const current = closes[i];
    const prev = closes[i - period];
    if (
      i < period ||
      current === null ||
      current === undefined ||
      prev === null ||
      prev === undefined ||
      prev === 0
    ) {
      roc.push(null);
    } else {
      roc.push(((current - prev) / prev) * 100);
    }
  }

  // 计算信号线（ROC 的 EMA）
  const signal = calcEMA(roc, signalPeriod);

  const result: ROCResult[] = [];
  for (let i = 0; i < closes.length; i++) {
    result.push({
      roc: roc[i] ?? null,
      signal: signal[i] ?? null,
    });
  }

  return result;
}

/**
 * 计算 DMI（趋向指标）
 */
export function calcDMI(
  data: OHLCV[],
  options: { period?: number; adxPeriod?: number } = {}
): DMIResult[] {
  const { period = 14, adxPeriod = 14 } = options;

  const result: DMIResult[] = [];
  const trList: number[] = [];
  const plusDMList: number[] = [];
  const minusDMList: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item === undefined || item.high === null || item.low === null || item.close === null) {
      result.push({ pdi: null, mdi: null, adx: null, adxr: null });
      continue;
    }

    // 计算 TR
    let tr: number;
    if (i === 0) {
      tr = item.high - item.low;
    } else {
      const prevItem = data[i - 1];
      const prevClose = prevItem !== undefined ? prevItem.close : null;
      if (prevClose === null || prevClose === undefined) {
        tr = item.high - item.low;
      } else {
        tr = Math.max(
          item.high - item.low,
          Math.abs(item.high - prevClose),
          Math.abs(item.low - prevClose)
        );
      }
    }
    trList.push(tr);

    // 计算 +DM 和 -DM
    if (i === 0) {
      plusDMList.push(0);
      minusDMList.push(0);
    } else {
      const prevItem = data[i - 1];
      if (prevItem === undefined || prevItem.high === null || prevItem.low === null) {
        plusDMList.push(0);
        minusDMList.push(0);
      } else {
        const upMove = item.high - prevItem.high;
        const downMove = prevItem.low - item.low;

        const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
        const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

        plusDMList.push(plusDM);
        minusDMList.push(minusDM);
      }
    }

    if (i < period - 1) {
      result.push({ pdi: null, mdi: null, adx: null, adxr: null });
      continue;
    }

    // 计算平滑的 TR、+DM、-DM
    let smoothTR = 0;
    let smoothPlusDM = 0;
    let smoothMinusDM = 0;
    for (let j = i - period + 1; j <= i; j++) {
      smoothTR += trList[j] ?? 0;
      smoothPlusDM += plusDMList[j] ?? 0;
      smoothMinusDM += minusDMList[j] ?? 0;
    }

    // +DI 和 -DI
    const pdi = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const mdi = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;

    // DX
    const diSum = pdi + mdi;
    const dx = diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0;

    // 计算 ADX（DX 的平滑均值）
    let adx: number | null = null;
    if (i >= period - 1 + adxPeriod - 1) {
      let dxSum = 0;
      for (let j = i - adxPeriod + 1; j <= i; j++) {
        const prevR = result[j];
        if (prevR === undefined) continue;
        // 重新计算该位置的 DX
        let prevSmTR = 0;
        let prevSmPlusDM = 0;
        let prevSmMinusDM = 0;
        for (let k = j - period + 1; k <= j; k++) {
          prevSmTR += trList[k] ?? 0;
          prevSmPlusDM += plusDMList[k] ?? 0;
          prevSmMinusDM += minusDMList[k] ?? 0;
        }
        const prevPdi = prevSmTR > 0 ? (prevSmPlusDM / prevSmTR) * 100 : 0;
        const prevMdi = prevSmTR > 0 ? (prevSmMinusDM / prevSmTR) * 100 : 0;
        const prevDiSum = prevPdi + prevMdi;
        const prevDx = prevDiSum > 0 ? (Math.abs(prevPdi - prevMdi) / prevDiSum) * 100 : 0;
        dxSum += prevDx;
      }
      dxSum += dx; // 当前 dx
      adx = dxSum / adxPeriod;
    }

    // ADXR = (当前 ADX + N 周期前 ADX) / 2
    let adxr: number | null = null;
    if (adx !== null && i >= period - 1 + adxPeriod - 1 + adxPeriod) {
      const prevAdxResult = result[i - adxPeriod];
      if (prevAdxResult !== undefined && prevAdxResult.adx !== null) {
        adxr = (adx + prevAdxResult.adx) / 2;
      }
    }

    result.push({ pdi, mdi, adx, adxr });
  }

  return result;
}

/**
 * 计算 SAR（抛物线转向指标）
 */
export function calcSAR(
  data: OHLCV[],
  options: { afStart?: number; afIncrement?: number; afMax?: number } = {}
): SARResult[] {
  const { afStart = 0.02, afIncrement = 0.02, afMax = 0.2 } = options;

  const result: SARResult[] = [];

  if (data.length === 0) return result;

  // 初始化
  let trend: 1 | -1 = 1; // 1=上升趋势，-1=下降趋势
  let sar = data[0]?.low ?? 0;
  let ep = data[0]?.high ?? 0; // 极点价
  let af = afStart;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item === undefined || item.high === null || item.low === null) {
      result.push({ sar: null, trend: null, ep: null, af: null });
      continue;
    }

    if (i === 0) {
      // 第一个点，初始化
      result.push({ sar: item.low, trend: 1, ep: item.high, af: afStart });
      sar = item.low;
      ep = item.high;
      trend = 1;
      af = afStart;
      continue;
    }

    // 更新 SAR
    const prevSar = sar;
    sar = prevSar + af * (ep - prevSar);

    // 根据趋势调整 SAR
    if (trend === 1) {
      // 上升趋势：SAR 不能高于前两天的最低价
      const prevItem1 = data[i - 1];
      const prevItem2 = data[i - 2];
      if (prevItem1 !== undefined && prevItem1.low !== null) {
        sar = Math.min(sar, prevItem1.low);
      }
      if (prevItem2 !== undefined && prevItem2.low !== null) {
        sar = Math.min(sar, prevItem2.low);
      }

      // 检查是否反转
      if (item.low < sar) {
        trend = -1;
        sar = ep;
        ep = item.low;
        af = afStart;
      } else {
        // 更新 EP 和 AF
        if (item.high > ep) {
          ep = item.high;
          af = Math.min(af + afIncrement, afMax);
        }
      }
    } else {
      // 下降趋势：SAR 不能低于前两天的最高价
      const prevItem1 = data[i - 1];
      const prevItem2 = data[i - 2];
      if (prevItem1 !== undefined && prevItem1.high !== null) {
        sar = Math.max(sar, prevItem1.high);
      }
      if (prevItem2 !== undefined && prevItem2.high !== null) {
        sar = Math.max(sar, prevItem2.high);
      }

      // 检查是否反转
      if (item.high > sar) {
        trend = 1;
        sar = ep;
        ep = item.high;
        af = afStart;
      } else {
        // 更新 EP 和 AF
        if (item.low < ep) {
          ep = item.low;
          af = Math.min(af + afIncrement, afMax);
        }
      }
    }

    result.push({ sar, trend, ep, af });
  }

  return result;
}

/**
 * 计算 KC（肯特纳通道）
 */
export function calcKC(
  data: OHLCV[],
  options: { emaPeriod?: number; atrPeriod?: number; multiplier?: number } = {}
): KCResult[] {
  const { emaPeriod = 20, atrPeriod = 10, multiplier = 2 } = options;

  const closes = data.map((item) => item.close);
  const ema = calcEMA(closes, emaPeriod);
  const atr = calcATR(data, { period: atrPeriod });

  const result: KCResult[] = [];

  for (let i = 0; i < data.length; i++) {
    const mid = ema[i];
    const atrVal = atr[i]?.atr;

    if (mid === null || mid === undefined || atrVal === null || atrVal === undefined) {
      result.push({ mid: null, upper: null, lower: null, width: null });
      continue;
    }

    const upper = mid + multiplier * atrVal;
    const lower = mid - multiplier * atrVal;
    const width = mid !== 0 ? ((upper - lower) / mid) * 100 : null;

    result.push({ mid, upper, lower, width });
  }

  return result;
}
