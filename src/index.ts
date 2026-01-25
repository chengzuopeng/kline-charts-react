// 主组件
export { KLineChart } from './KLineChart';

// 类型导出
export type {
  // Props
  KLineChartProps,
  KLineChartRef,
  PeriodType,
  MarketType,
  AdjustType,
  IndicatorType,
  IndicatorOptions,
  KLineDataProvider,
  GetKlineParams,
  GetTimelineParams,
  RequestOptions,
  AutoRefreshOptions,
  TimeAxisOptions,
  EChartsOptionMergeOptions,
  PaneConfig,
  SDKOptions,
  // Data
  KlineData,
  KlineWithIndicators,
  TimelineData,
  MAResult,
  MACDResult,
  BOLLResult,
  KDJResult,
  RSIResult,
  WRResult,
  BIASResult,
  CCIResult,
  ATRResult,
  OHLCV,
  // Theme
  ThemeConfig,
} from './types';

// 主题
export { lightTheme, darkTheme, getTheme } from './types/theme';

// 工具函数
export {
  formatNumber,
  formatPrice,
  formatPercent,
  formatChange,
  formatVolume,
  formatAmount,
  formatDate,
  formatKlineTooltip,
} from './utils/formatters';

// 指标计算
export {
  calcMA,
  calcSMA,
  calcEMA,
  calcWMA,
  calcMACD,
  calcBOLL,
  calcKDJ,
  calcRSI,
  calcWR,
  calcBIAS,
  calcCCI,
  calcATR,
} from './utils/indicators';

// Hooks
export { useKlineData, useEcharts, useZoomHistory } from './hooks';

// 子组件（可选使用）
export { Loading, PeriodSelector, IndicatorSelector, Toolbar } from './components';

// 样式
import './styles/index.css';
