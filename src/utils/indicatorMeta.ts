import type { BIASOptions, MAOptions, RSIOptions, WROptions } from '@/types';

function normalizePeriods(periods: number[] | undefined, fallback: number[]): number[] {
  const cleaned = (periods ?? [])
    .filter((period) => Number.isFinite(period) && period > 0)
    .map((period) => Math.floor(period));

  if (cleaned.length === 0) {
    return fallback;
  }

  return Array.from(new Set(cleaned)).sort((a, b) => a - b);
}

export function getMAPeriods(options?: MAOptions | boolean): number[] {
  return normalizePeriods(typeof options === 'object' ? options.periods : undefined, [5, 10, 20, 30, 60]);
}

export function getRSIPeriods(options?: RSIOptions | boolean): number[] {
  return normalizePeriods(typeof options === 'object' ? options.periods : undefined, [6, 12, 24]);
}

export function getWRPeriods(options?: WROptions | boolean): number[] {
  return normalizePeriods(typeof options === 'object' ? options.periods : undefined, [6, 10]);
}

export function getBIASPeriods(options?: BIASOptions | boolean): number[] {
  return normalizePeriods(typeof options === 'object' ? options.periods : undefined, [6, 12, 24]);
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
