import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { KLineChartRef, KLineDataProvider } from '@/types';
import { sampleKlineData } from '@/test/fixtures';

let zoomState = { start: 70, end: 100 };
const setOptionMock = vi.fn((option: unknown) => {
  const nextOption = option as {
    dataZoom?: Array<{ id?: string; start?: number; end?: number }>;
  };

  const nextZoom =
    nextOption.dataZoom?.find((item) => item.id === 'kline-zoom-inside') ??
    nextOption.dataZoom?.[0];

  if (nextZoom?.start !== undefined && nextZoom.end !== undefined) {
    zoomState = { start: nextZoom.start, end: nextZoom.end };
  }
});
const getDataURLMock = vi.fn(() => 'data:image/png;base64,fake');
const eventHandlers = new Map<string, (params: unknown) => void>();
const getInstanceMock = vi.fn(() => ({
  getOption: () => ({
    dataZoom: [
      { id: 'kline-zoom-inside', ...zoomState },
      { id: 'kline-zoom-slider', ...zoomState },
    ],
  }),
}));

vi.mock('@/hooks', async () => {
  const React = await import('react');
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');

  return {
    ...actual,
    useEcharts: () => ({
      chartRef: React.useRef<HTMLDivElement | null>(null),
      setOption: setOptionMock,
      resize: vi.fn(),
      dispose: vi.fn(),
      getInstance: getInstanceMock,
      getDataURL: getDataURLMock,
      bindEvent: (eventName: string, handler: (params: unknown) => void) => {
        eventHandlers.set(eventName, handler);
        return () => {
          eventHandlers.delete(eventName);
        };
      },
    }),
  };
});

import { KLineChart } from './KLineChart';

describe('KLineChart', () => {
  beforeEach(() => {
    zoomState = { start: 70, end: 100 };
    setOptionMock.mockClear();
    getDataURLMock.mockClear();
    getInstanceMock.mockClear();
    eventHandlers.clear();
  });

  it('keeps period controlled until the prop changes', async () => {
    const provider: KLineDataProvider = {
      getKline: vi.fn().mockResolvedValue(sampleKlineData),
    };
    const onPeriodChange = vi.fn();
    const { rerender } = render(
      <KLineChart
        symbol="controlled-case"
        period="daily"
        onPeriodChange={onPeriodChange}
        dataProvider={provider}
        requestOptions={{ debounceMs: 0 }}
      />
    );

    await waitFor(() => {
      expect(provider.getKline).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'daily' }),
        expect.any(AbortSignal)
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '周K' }));
    expect(onPeriodChange).toHaveBeenCalledWith('weekly');

    await waitFor(() => {
      expect(provider.getKline).toHaveBeenCalledTimes(1);
    });

    rerender(
      <KLineChart
        symbol="controlled-case"
        period="weekly"
        onPeriodChange={onPeriodChange}
        dataProvider={provider}
        requestOptions={{ debounceMs: 0 }}
      />
    );

    await waitFor(() => {
      expect(provider.getKline).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'weekly' }),
        expect.any(AbortSignal)
      );
    });
  });

  it('supports pane labels, visible range tracking, and ref-based exports', async () => {
    const provider: KLineDataProvider = {
      getKline: vi.fn().mockResolvedValue(sampleKlineData),
    };
    const onVisibleRangeChange = vi.fn();
    const ref = createRef<KLineChartRef>();

    render(
      <KLineChart
        ref={ref}
        symbol="pane-case"
        theme="dark"
        indicators={['ma', 'macd', 'rsi']}
        panes={[
          { id: 'main', height: '65%', indicators: ['ma'] },
          { id: 'sub_combo', height: '20%', indicators: ['macd', 'rsi'] },
        ]}
        dataProvider={provider}
        requestOptions={{ debounceMs: 0 }}
        onVisibleRangeChange={onVisibleRangeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('MACD / RSI')).toBeInTheDocument();
    });

    act(() => {
      ref.current?.zoomTo(10, 90);
    });

    await waitFor(() => {
      expect(ref.current?.getVisibleRange()).toEqual({ start: 10, end: 90 });
    });

    act(() => {
      zoomState = { start: 15, end: 75 };
      eventHandlers.get('datazoom')?.({});
    });

    await waitFor(() => {
      expect(ref.current?.getVisibleRange()).toEqual({ start: 15, end: 75 });
      expect(onVisibleRangeChange).toHaveBeenCalledWith({ start: 15, end: 75 });
    });

    expect(ref.current?.getEchartsInstance()).not.toBeNull();
    expect(ref.current?.exportImage('png')).toBe('data:image/png;base64,fake');
    expect(getDataURLMock).toHaveBeenCalledWith({
      type: 'png',
      backgroundColor: '#1a1a1a',
    });
  });
});
