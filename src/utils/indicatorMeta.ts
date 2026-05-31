import type { BIASOptions, IndicatorType, MAOptions, RSIOptions, WROptions } from '@/types';

/** 指标分组：主图叠加 / 独立副图 */
export type IndicatorGroup = 'main' | 'sub';

/** 单个指标的展示元信息 */
export interface IndicatorMeta {
  value: IndicatorType;
  /** 展示名（用于选择器、副图标题、tooltip 等） */
  label: string;
  group: IndicatorGroup;
}

/**
 * 指标元信息的单一数据源。
 * 选择器、副图标题、面板布局等所有需要「指标 → 名称 / 分组」的地方都从这里取，
 * 避免散落多份导致漂移。新增指标只需在此追加一行。
 */
export const INDICATOR_META: IndicatorMeta[] = [
  // 主图指标
  { value: 'ma', label: 'MA', group: 'main' },
  { value: 'boll', label: 'BOLL', group: 'main' },
  { value: 'sar', label: 'SAR', group: 'main' },
  { value: 'kc', label: 'KC', group: 'main' },
  // 副图指标
  { value: 'volume', label: '成交量', group: 'sub' },
  { value: 'macd', label: 'MACD', group: 'sub' },
  { value: 'kdj', label: 'KDJ', group: 'sub' },
  { value: 'rsi', label: 'RSI', group: 'sub' },
  { value: 'wr', label: 'WR', group: 'sub' },
  { value: 'bias', label: 'BIAS', group: 'sub' },
  { value: 'cci', label: 'CCI', group: 'sub' },
  { value: 'atr', label: 'ATR', group: 'sub' },
  { value: 'obv', label: 'OBV', group: 'sub' },
  { value: 'roc', label: 'ROC', group: 'sub' },
  { value: 'dmi', label: 'DMI', group: 'sub' },
];

/** 指标 → 展示名 映射（派生自 INDICATOR_META） */
export const INDICATOR_LABELS = Object.fromEntries(
  INDICATOR_META.map((meta) => [meta.value, meta.label])
) as Record<IndicatorType, string>;

/** 主图指标元信息列表 */
export const MAIN_INDICATOR_METAS = INDICATOR_META.filter((meta) => meta.group === 'main');

/** 副图指标元信息列表 */
export const SUB_INDICATOR_METAS = INDICATOR_META.filter((meta) => meta.group === 'sub');

/** 主图指标 key 集合（用于快速判断分组） */
export const MAIN_INDICATOR_KEYS: IndicatorType[] = MAIN_INDICATOR_METAS.map((meta) => meta.value);

const MAIN_INDICATOR_KEY_SET = new Set<IndicatorType>(MAIN_INDICATOR_KEYS);

/** 判断指标属于主图还是副图 */
export function getIndicatorGroup(indicator: IndicatorType): IndicatorGroup {
  return MAIN_INDICATOR_KEY_SET.has(indicator) ? 'main' : 'sub';
}

function normalizePeriods(periods: number[] | undefined, fallback: number[]): number[] {
  const cleaned = (periods ?? [])
    .filter((period) => Number.isFinite(period) && period > 0)
    .map((period) => Math.floor(period));

  if (cleaned.length === 0) {
    return fallback;
  }

  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

export function getMAPeriods(options?: MAOptions): number[] {
  return normalizePeriods(options?.periods, [5, 10, 20, 30, 60]);
}

export function getRSIPeriods(options?: RSIOptions): number[] {
  return normalizePeriods(options?.periods, [6, 12, 24]);
}

export function getWRPeriods(options?: WROptions): number[] {
  return normalizePeriods(options?.periods, [6, 10]);
}

export function getBIASPeriods(options?: BIASOptions): number[] {
  return normalizePeriods(options?.periods, [6, 12, 24]);
}

function getNumericSuffix(value: string): number {
  const match = value.match(/(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function getMetricEntries(
  record: Record<string, number | null | undefined> | undefined,
  prefix: string
): Array<[string, number | null | undefined]> {
  if (!record) {
    return [];
  }

  return Object.keys(record)
    .filter((key) => key.startsWith(prefix))
    .sort((a, b) => getNumericSuffix(a) - getNumericSuffix(b))
    .map((key) => [key, record[key]]);
}

export function formatMetricLabel(key: string): string {
  return key.replace(/^[a-z]+/, (prefix) => prefix.toUpperCase());
}
