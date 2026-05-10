import { act, renderHook, waitFor } from '@testing-library/react';
import type { KLineDataProvider, SDKOptions } from '@/types';
import { sampleKlineData, sampleTimelineData } from '@/test/fixtures';

const { stockSdkConstructor } = vi.hoisted(() => ({
  stockSdkConstructor: vi.fn(),
}));

vi.mock('stock-sdk', () => ({
  StockSDK: stockSdkConstructor,
}));

import { useKlineData } from './useKlineData';

describe('useKlineData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stockSdkConstructor.mockImplementation(() => ({
      getHistoryKline: vi.fn().mockResolvedValue(sampleKlineData),
      getHKHistoryKline: vi.fn().mockResolvedValue(sampleKlineData),
      getUSHistoryKline: vi.fn().mockResolvedValue(sampleKlineData),
      getMinuteKline: vi.fn().mockResolvedValue(sampleKlineData),
      getTodayTimeline: vi.fn().mockResolvedValue({
        date: '20240105',
        data: sampleTimelineData,
      }),
    }));
  });

  it('reuses cached kline data and invalidates cache on refresh', async () => {
    const symbol = 'cache-case';
    const provider: KLineDataProvider = {
      getKline: vi.fn().mockResolvedValue(sampleKlineData),
    };

    const first = renderHook(() =>
      useKlineData({
        symbol,
        market: 'A',
        period: 'daily',
        adjust: 'qfq',
        dataProvider: provider,
        requestOptions: { debounceMs: 0 },
      })
    );

    await waitFor(() => {
      expect(first.result.current.data).toHaveLength(sampleKlineData.length);
    });

    expect(provider.getKline).toHaveBeenCalledTimes(1);
    first.unmount();

    const second = renderHook(() =>
      useKlineData({
        symbol,
        market: 'A',
        period: 'daily',
        adjust: 'qfq',
        dataProvider: provider,
        requestOptions: { debounceMs: 0 },
      })
    );

    await waitFor(() => {
      expect(second.result.current.data).toHaveLength(sampleKlineData.length);
    });

    expect(provider.getKline).toHaveBeenCalledTimes(1);

    await act(async () => {
      await second.result.current.refresh();
    });

    expect(provider.getKline).toHaveBeenCalledTimes(2);
  });

  it('clears stale timeline data when leaving timeline mode', async () => {
    const provider: KLineDataProvider = {
      getKline: vi.fn().mockResolvedValue(sampleKlineData),
      getTimeline: vi.fn().mockResolvedValue({ data: sampleTimelineData, prevClose: 9.8 }),
    };

    const { result, rerender } = renderHook(
      ({ period }: { period: 'timeline' | 'daily' }) =>
        useKlineData({
          symbol: 'timeline-case',
          market: 'A',
          period,
          adjust: 'qfq',
          dataProvider: provider,
          requestOptions: { debounceMs: 0 },
        }),
      {
        initialProps: { period: 'timeline' as 'timeline' | 'daily' },
      }
    );

    await waitFor(() => {
      expect(result.current.timelineData).toHaveLength(sampleTimelineData.length);
    });

    expect(result.current.prevClose).toBe(9.8);

    rerender({ period: 'daily' as 'timeline' | 'daily' });

    await waitFor(() => {
      expect(result.current.timelineData).toHaveLength(0);
    });
    expect(result.current.prevClose).toBeNull();
  });

  it('recreates the default provider when sdkOptions change', async () => {
    const initialOptions: SDKOptions = { baseUrl: '/qt' };
    const nextOptions: SDKOptions = { baseUrl: '/qt-v2' };

    const { rerender } = renderHook(
      ({ sdkOptions }) =>
        useKlineData({
          symbol: 'sdk-case',
          market: 'A',
          period: 'daily',
          adjust: 'qfq',
          sdkOptions,
          requestOptions: { debounceMs: 0, dedupe: false },
        }),
      {
        initialProps: { sdkOptions: initialOptions },
      }
    );

    await waitFor(() => {
      expect(stockSdkConstructor).toHaveBeenCalledWith(initialOptions);
    });

    rerender({ sdkOptions: nextOptions });

    await waitFor(() => {
      expect(stockSdkConstructor).toHaveBeenCalledWith(nextOptions);
    });
  });
});
