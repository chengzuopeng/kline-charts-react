import { isMarketTradingTime } from './marketSessions';

describe('isMarketTradingTime', () => {
  it('matches A-share trading sessions in market timezone', () => {
    expect(isMarketTradingTime('A', new Date('2026-04-22T02:00:00Z'))).toBe(true);
    expect(isMarketTradingTime('A', new Date('2026-04-22T04:30:00Z'))).toBe(false);
  });

  it('matches HK trading sessions in market timezone', () => {
    expect(isMarketTradingTime('HK', new Date('2026-04-22T02:00:00Z'))).toBe(true);
    expect(isMarketTradingTime('HK', new Date('2026-04-22T04:30:00Z'))).toBe(false);
  });

  it('matches US trading sessions in market timezone', () => {
    expect(isMarketTradingTime('US', new Date('2026-04-22T14:00:00Z'))).toBe(true);
    expect(isMarketTradingTime('US', new Date('2026-04-22T21:30:00Z'))).toBe(false);
  });

  it('returns false on weekends', () => {
    expect(isMarketTradingTime('A', new Date('2026-04-25T02:00:00Z'))).toBe(false);
  });

  it('treats the closing minute as non-trading (15:00 Beijing for A-share)', () => {
    // 北京时间 15:00 == UTC 07:00；这一刻已收盘，不应再触发自动刷新
    expect(isMarketTradingTime('A', new Date('2026-04-22T07:00:00Z'))).toBe(false);
    // 14:59 北京时间仍在交易（UTC 06:59）
    expect(isMarketTradingTime('A', new Date('2026-04-22T06:59:00Z'))).toBe(true);
  });
});
