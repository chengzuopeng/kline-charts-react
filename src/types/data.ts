/**
 * K 线数据结构
 */
export interface KlineData {
  /** 日期/时间 */
  date: string;
  /** 股票代码 */
  code?: string;
  /** 股票名称 */
  name?: string;
  /** 开盘价 */
  open: number | null;
  /** 收盘价 */
  close: number | null;
  /** 最高价 */
  high: number | null;
  /** 最低价 */
  low: number | null;
  /** 成交量 */
  volume: number | null;
  /** 成交额 */
  amount: number | null;
  /** 涨跌幅 */
  changePercent?: number | null;
  /** 涨跌额 */
  change?: number | null;
  /** 振幅 */
  amplitude?: number | null;
  /** 换手率 */
  turnoverRate?: number | null;
}

/**
 * 分时数据结构
 */
export interface TimelineData {
  /** 时间 HH:mm */
  time: string;
  /** 价格 */
  price: number;
  /** 成交量（累计） */
  volume: number;
  /** 成交额（累计） */
  amount: number;
  /** 均价 */
  avgPrice: number;
}

/**
 * 带指标的 K 线数据
 */
export interface KlineWithIndicators extends KlineData {
  /** MA 指标 */
  ma?: MAResult;
  /** MACD 指标 */
  macd?: MACDResult;
  /** BOLL 指标 */
  boll?: BOLLResult;
  /** KDJ 指标 */
  kdj?: KDJResult;
  /** RSI 指标 */
  rsi?: RSIResult;
  /** WR 指标 */
  wr?: WRResult;
  /** BIAS 指标 */
  bias?: BIASResult;
  /** CCI 指标 */
  cci?: CCIResult;
  /** ATR 指标 */
  atr?: ATRResult;
  /** OBV 指标（能量潮） */
  obv?: OBVResult;
  /** ROC 指标（变动率） */
  roc?: ROCResult;
  /** DMI 指标（趋向指标） */
  dmi?: DMIResult;
  /** SAR 指标（抛物线转向） */
  sar?: SARResult;
  /** KC 指标（肯特纳通道） */
  kc?: KCResult;
}

/**
 * MA 指标结果
 */
export interface MAResult {
  ma5?: number | null;
  ma10?: number | null;
  ma20?: number | null;
  ma30?: number | null;
  ma60?: number | null;
  ma120?: number | null;
  ma250?: number | null;
  [key: string]: number | null | undefined;
}

/**
 * MACD 指标结果
 */
export interface MACDResult {
  dif: number | null;
  dea: number | null;
  macd: number | null;
}

/**
 * BOLL 指标结果
 */
export interface BOLLResult {
  mid: number | null;
  upper: number | null;
  lower: number | null;
  bandwidth?: number | null;
}

/**
 * KDJ 指标结果
 */
export interface KDJResult {
  k: number | null;
  d: number | null;
  j: number | null;
}

/**
 * RSI 指标结果
 */
export interface RSIResult {
  rsi6?: number | null;
  rsi12?: number | null;
  rsi24?: number | null;
  [key: string]: number | null | undefined;
}

/**
 * WR 指标结果
 */
export interface WRResult {
  wr6?: number | null;
  wr10?: number | null;
  [key: string]: number | null | undefined;
}

/**
 * BIAS 指标结果
 */
export interface BIASResult {
  bias6?: number | null;
  bias12?: number | null;
  bias24?: number | null;
  [key: string]: number | null | undefined;
}

/**
 * CCI 指标结果
 */
export interface CCIResult {
  cci: number | null;
}

/**
 * ATR 指标结果
 */
export interface ATRResult {
  tr?: number | null;
  atr: number | null;
}

/**
 * OBV 指标结果（能量潮）
 */
export interface OBVResult {
  obv: number | null;
  obvMa: number | null;
}

/**
 * ROC 指标结果（变动率）
 */
export interface ROCResult {
  roc: number | null;
  signal: number | null;
}

/**
 * DMI 指标结果（趋向指标）
 */
export interface DMIResult {
  pdi: number | null;
  mdi: number | null;
  adx: number | null;
  adxr: number | null;
}

/**
 * SAR 指标结果（抛物线转向）
 */
export interface SARResult {
  sar: number | null;
  trend: 1 | -1 | null;
  ep: number | null;
  af: number | null;
}

/**
 * KC 指标结果（肯特纳通道）
 */
export interface KCResult {
  mid: number | null;
  upper: number | null;
  lower: number | null;
  width: number | null;
}

/**
 * OHLCV 数据（用于指标计算）
 */
export interface OHLCV {
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume?: number | null;
}
