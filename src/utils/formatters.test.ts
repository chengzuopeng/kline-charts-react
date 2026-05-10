import {
  formatNumber,
  formatPrice,
  formatPercent,
  formatChange,
  formatVolume,
  formatAmount,
  formatDate,
  formatKlineTooltip,
} from './formatters';

describe('formatNumber / formatPrice', () => {
  it('returns -- for null / undefined / NaN', () => {
    expect(formatNumber(null)).toBe('--');
    expect(formatNumber(undefined)).toBe('--');
    expect(formatNumber(Number.NaN)).toBe('--');
    expect(formatPrice(null)).toBe('--');
  });

  it('formats with two decimals by default', () => {
    expect(formatPrice(1234.5)).toMatch(/1,234\.50/);
  });
});

describe('formatPercent / formatChange', () => {
  it('adds + for positives and keeps - for negatives', () => {
    expect(formatPercent(1.5)).toBe('+1.50%');
    expect(formatPercent(-2)).toBe('-2.00%');
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatChange(1)).toBe('+1.00');
    expect(formatChange(-1)).toBe('-1.00');
  });

  it('renders -- for invalid input', () => {
    expect(formatPercent(null)).toBe('--');
    expect(formatChange(undefined)).toBe('--');
    expect(formatChange(Number.NaN)).toBe('--');
  });
});

describe('formatVolume / formatAmount', () => {
  it('switches to 万/亿 thresholds and trims trailing zeros', () => {
    expect(formatVolume(500)).toBe('500');
    expect(formatVolume(20000)).toBe('2万');
    expect(formatVolume(25500)).toBe('2.55万');
    expect(formatVolume(150_000_000)).toBe('1.5亿');
    expect(formatVolume(null)).toBe('--');
  });

  it('formats amounts via the same thresholds', () => {
    expect(formatAmount(123_456_789)).toBe('1.23亿');
    // 99999 / 10000 = 9.9999，保留 2 位四舍五入后是 10.00 → 10
    expect(formatAmount(99_999)).toBe('10万');
    // 整数 < 1万 应当返回不含小数的整数串（smartNumber 行为）
    expect(formatAmount(50)).toBe('50');
  });
});

describe('formatDate', () => {
  it('formats ISO date with default pattern', () => {
    expect(formatDate('2024-04-22')).toBe('2024-04-22');
  });

  it('returns the original string when not parseable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatKlineTooltip', () => {
  it('renders OHLC and respects the selected indicators list', () => {
    const html = formatKlineTooltip({
      date: '2024-01-01',
      open: 10,
      high: 12,
      low: 9,
      close: 11,
      volume: 1000,
      change: 1,
      changePercent: 10,
      indicators: ['ma'],
      ma: { ma5: 10.5, ma10: 9.8 },
      // 选了 ma 但没选 macd，下面的字段不应出现
      macd: { dif: 1, dea: 2, macd: 3 },
    });

    expect(html).toContain('开盘');
    expect(html).toContain('最高');
    expect(html).toContain('MA5');
    expect(html).toContain('MA10');
    expect(html).not.toContain('MACD');
  });
});
