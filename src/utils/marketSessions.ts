import type { MarketType } from '@/types';

interface MarketSessionConfig {
  timeZone: string;
  sessions: Array<[start: number, end: number]>;
}

const MARKET_SESSIONS: Record<MarketType, MarketSessionConfig> = {
  A: {
    timeZone: 'Asia/Shanghai',
    sessions: [
      [9 * 60 + 30, 11 * 60 + 30],
      [13 * 60, 15 * 60],
    ],
  },
  HK: {
    timeZone: 'Asia/Hong_Kong',
    sessions: [
      [9 * 60 + 30, 12 * 60],
      [13 * 60, 16 * 60],
    ],
  },
  US: {
    timeZone: 'America/New_York',
    sessions: [[9 * 60 + 30, 16 * 60]],
  },
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  formatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedTimeParts(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return { weekday, minutes: hour * 60 + minute };
}

export function isMarketTradingTime(market: MarketType, date = new Date()): boolean {
  const config = MARKET_SESSIONS[market];
  const { weekday, minutes } = getZonedTimeParts(date, config.timeZone);

  if (weekday === 'Sat' || weekday === 'Sun') {
    return false;
  }

  // 收盘时刻不算交易中（end 是闭市点）
  return config.sessions.some(([start, end]) => minutes >= start && minutes < end);
}
