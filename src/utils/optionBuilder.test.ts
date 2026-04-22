import { calcBIAS, calcMA, calcRSI, calcWR } from './indicators';
import { buildOption } from './optionBuilder';
import { sampleKlineData } from '@/test/fixtures';
import { lightTheme } from '@/types/theme';

describe('buildOption', () => {
  it('uses configured periods for MA/RSI/WR/BIAS series', () => {
    const closes = sampleKlineData.map((item) => item.close);
    const ohlcv = sampleKlineData.map((item) => ({
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    const ma = calcMA(closes, { periods: [2, 4] });
    const rsi = calcRSI(closes, { periods: [2, 3] });
    const wr = calcWR(ohlcv, { periods: [2, 4] });
    const bias = calcBIAS(closes, { periods: [2, 4] });

    const data = sampleKlineData.map((item, index) => ({
      ...item,
      ma: ma[index],
      rsi: rsi[index],
      wr: wr[index],
      bias: bias[index],
    }));

    const option = buildOption({
      data,
      theme: lightTheme,
      indicators: ['ma', 'rsi', 'wr', 'bias'],
      panes: [
        { id: 'main', height: '65%', indicators: ['ma'] },
        { id: 'sub_combo', height: '20%', indicators: ['rsi', 'wr', 'bias'] },
      ],
      indicatorOptions: {
        ma: { periods: [2, 4] },
        rsi: { periods: [2, 3] },
        wr: { periods: [2, 4] },
        bias: { periods: [2, 4] },
      },
    });

    const seriesNames = ((option.series ?? []) as Array<{ name?: string }>).map((series) => series.name);
    expect(seriesNames).toEqual(
      expect.arrayContaining(['MA2', 'MA4', 'RSI2', 'RSI3', 'WR2', 'WR4', 'BIAS2', 'BIAS4'])
    );
  });
});
