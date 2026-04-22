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
});
