import { DataCache, getTTLByPeriod } from './cache';

describe('DataCache.buildKey', () => {
  it('produces stable keys regardless of property order or undefined values', () => {
    const a = DataCache.buildKey({ symbol: 'sh600519', period: 'daily', adjust: 'qfq', extra: undefined });
    const b = DataCache.buildKey({ adjust: 'qfq', period: 'daily', symbol: 'sh600519' });
    expect(a).toBe(b);
  });
});

describe('DataCache get/set/delete', () => {
  it('returns undefined for missing keys', () => {
    const cache = new DataCache<number>();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('honours per-entry ttl over the global one', () => {
    vi.useFakeTimers();
    try {
      const cache = new DataCache<number>({ ttl: 60_000 });
      cache.set('short-lived', 1, 100);
      cache.set('long-lived', 2);

      vi.setSystemTime(Date.now() + 200);
      expect(cache.get('short-lived')).toBeUndefined();
      expect(cache.get('long-lived')).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('evicts the oldest entry when full', () => {
    const cache = new DataCache<string>({ maxSize: 2, ttl: 60_000 });
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');
    expect(cache.size()).toBeLessThanOrEqual(2);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('c')).toBe('C');
  });

  it('clear removes everything', () => {
    const cache = new DataCache<number>();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('skips set/get when disabled', () => {
    const cache = new DataCache<number>({ enabled: false });
    cache.set('a', 1);
    expect(cache.get('a')).toBeUndefined();
  });
});

describe('getTTLByPeriod', () => {
  it('returns short ttl for live data and longer ttl for daily/weekly/monthly', () => {
    expect(getTTLByPeriod('timeline')).toBeLessThan(getTTLByPeriod('1'));
    expect(getTTLByPeriod('1')).toBeLessThan(getTTLByPeriod('daily'));
    expect(getTTLByPeriod('weekly')).toBe(getTTLByPeriod('daily'));
  });
});
