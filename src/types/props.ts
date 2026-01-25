import type { CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';
import type { KlineData, TimelineData } from './data';
import type { ThemeConfig } from './theme';

/**
 * 周期类型
 */
export type PeriodType =
  | 'timeline'
  | 'timeline5'
  | '1'
  | '5'
  | '15'
  | '30'
  | '60'
  | 'daily'
  | 'weekly'
  | 'monthly';

/**
 * 市场类型
 */
export type MarketType = 'A' | 'HK' | 'US';

/**
 * 复权类型
 */
export type AdjustType = '' | 'qfq' | 'hfq';

/**
 * 指标类型
 */
export type IndicatorType =
  | 'ma'
  | 'macd'
  | 'boll'
  | 'kdj'
  | 'rsi'
  | 'wr'
  | 'bias'
  | 'cci'
  | 'atr'
  | 'obv'
  | 'roc'
  | 'dmi'
  | 'sar'
  | 'kc'
  | 'volume';

/**
 * MA 指标配置
 */
export interface MAOptions {
  periods?: number[];
  type?: 'sma' | 'ema' | 'wma';
}

/**
 * MACD 指标配置
 */
export interface MACDOptions {
  short?: number;
  long?: number;
  signal?: number;
}

/**
 * BOLL 指标配置
 */
export interface BOLLOptions {
  period?: number;
  stdDev?: number;
}

/**
 * KDJ 指标配置
 */
export interface KDJOptions {
  period?: number;
  kPeriod?: number;
  dPeriod?: number;
}

/**
 * RSI 指标配置
 */
export interface RSIOptions {
  periods?: number[];
}

/**
 * WR 指标配置
 */
export interface WROptions {
  periods?: number[];
}

/**
 * BIAS 指标配置
 */
export interface BIASOptions {
  periods?: number[];
}

/**
 * CCI 指标配置
 */
export interface CCIOptions {
  period?: number;
}

/**
 * ATR 指标配置
 */
export interface ATROptions {
  period?: number;
}

/**
 * OBV 指标配置（能量潮）
 */
export interface OBVOptions {
  maPeriod?: number;
}

/**
 * ROC 指标配置（变动率）
 */
export interface ROCOptions {
  period?: number;
  signalPeriod?: number;
}

/**
 * DMI 指标配置（趋向指标）
 */
export interface DMIOptions {
  period?: number;
  adxPeriod?: number;
}

/**
 * SAR 指标配置（抛物线转向）
 */
export interface SAROptions {
  afStart?: number;
  afIncrement?: number;
  afMax?: number;
}

/**
 * KC 指标配置（肯特纳通道）
 */
export interface KCOptions {
  emaPeriod?: number;
  atrPeriod?: number;
  multiplier?: number;
}

/**
 * 指标参数配置
 */
export interface IndicatorOptions {
  ma?: MAOptions | boolean;
  macd?: MACDOptions | boolean;
  boll?: BOLLOptions | boolean;
  kdj?: KDJOptions | boolean;
  rsi?: RSIOptions | boolean;
  wr?: WROptions | boolean;
  bias?: BIASOptions | boolean;
  cci?: CCIOptions | boolean;
  atr?: ATROptions | boolean;
  obv?: OBVOptions | boolean;
  roc?: ROCOptions | boolean;
  dmi?: DMIOptions | boolean;
  sar?: SAROptions | boolean;
  kc?: KCOptions | boolean;
}

/**
 * 获取 K 线数据参数
 */
export interface GetKlineParams {
  symbol: string;
  market: MarketType;
  period: PeriodType;
  adjust: AdjustType;
  cursor?: string | number;
  limit?: number;
}

/**
 * 获取分时数据参数
 */
export interface GetTimelineParams {
  symbol: string;
  market: MarketType;
}

/**
 * 数据源提供者
 */
export interface KLineDataProvider {
  getKline: (params: GetKlineParams, signal?: AbortSignal) => Promise<KlineData[]>;
  getTimeline?: (params: GetTimelineParams, signal?: AbortSignal) => Promise<TimelineData[]>;
}

/**
 * 请求配置
 */
export interface RequestOptions {
  debounceMs?: number;
  abortOnChange?: boolean;
  dedupe?: boolean;
}

/**
 * 自动刷新配置
 */
export interface AutoRefreshOptions {
  intervalMs?: number;
  onlyTradingTime?: boolean;
}

/**
 * 时间轴配置
 */
export type TimeAxisOptions =
  | { mode: 'trading'; sessionCompression?: boolean }
  | { mode: 'continuous' };

/**
 * ECharts Option 合并配置
 */
export interface EChartsOptionMergeOptions {
  mode?: 'safeMerge' | 'replace';
  replaceMerge?: string[];
}

/**
 * 面板配置
 */
export interface PaneConfig {
  id: string;
  height?: number | string;
  indicators: IndicatorType[];
}

/**
 * SDK 配置
 */
export interface SDKOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * KLineChart 组件 Props
 */
export interface KLineChartProps {
  /** 股票代码（必填） */
  symbol: string;
  /** 市场类型 */
  market?: MarketType;
  /** K 线周期 */
  period?: PeriodType;
  /** 复权类型 */
  adjust?: AdjustType;
  /** 图表高度 */
  height?: number | string;
  /** 图表宽度 */
  width?: number | string;
  /** 主题 */
  theme?: 'light' | 'dark' | ThemeConfig;
  /** 启用的技术指标 */
  indicators?: IndicatorType[];
  /** 指标参数配置 */
  indicatorOptions?: IndicatorOptions;
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 是否显示周期切换 */
  showPeriodSelector?: boolean;
  /** 是否显示指标切换 */
  showIndicatorSelector?: boolean;
  /** 最多显示几个副图，默认 3，最大 3，传入 0 表示不显示副图 */
  maxSubPanes?: number;
  /** 初始可见 K 线数量 */
  visibleCount?: number;
  /** 数据加载回调 */
  onDataLoad?: (data: KlineData[]) => void;
  /** 周期切换回调 */
  onPeriodChange?: (period: PeriodType) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 数据源提供者 */
  dataProvider?: KLineDataProvider;
  /** stock-sdk 配置 */
  sdkOptions?: SDKOptions;
  /** 请求配置 */
  requestOptions?: RequestOptions;
  /** 自动刷新配置 */
  autoRefresh?: boolean | AutoRefreshOptions;
  /** 时间轴配置 */
  timeAxis?: TimeAxisOptions;
  /** 自定义 ECharts 配置 */
  echartsOption?: EChartsOption;
  /** ECharts Option 合并策略 */
  echartsOptionMerge?: EChartsOptionMergeOptions;
  /** 面板配置 */
  panes?: PaneConfig[];
  /** 类名 */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
}

/**
 * KLineChart Ref 方法
 */
export interface KLineChartRef {
  refresh(): Promise<void>;
  setPeriod(period: PeriodType): void;
  setIndicators(indicators: IndicatorType[]): void;
  zoomTo(start: number, end: number): void;
  resetZoom(): void;
  getEchartsInstance(): unknown | null;
  exportImage(type?: 'png' | 'jpeg'): string;
  getData(): KlineData[];
}
