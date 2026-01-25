import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useRef,
} from 'react';
import type { EChartsOption } from 'echarts';
import type {
  KLineChartProps,
  KLineChartRef,
  PeriodType,
  IndicatorType,
  AdjustType,
  AutoRefreshOptions,
} from '@/types';
import { getTheme } from '@/types/theme';
import { useKlineData, useEcharts, useZoomHistory } from '@/hooks';
import {
  buildOption,
  mergeOption,
  getDefaultPanes,
  DATA_ZOOM_INSIDE_ID,
  DATA_ZOOM_SLIDER_ID,
} from '@/utils/optionBuilder';
import { buildTimelineOption } from '@/utils/timelineBuilder';
import { Loading, PeriodSelector, IndicatorSelector, Toolbar, IndicatorDisplay, SubPaneTitle } from '@/components';
import styles from './KLineChart.module.css';

/**
 * 判断是否为分时周期
 */
function isTimelinePeriod(period: PeriodType): boolean {
  return period === 'timeline' || period === 'timeline5';
}

/**
 * 判断是否为交易时间（A股）
 */
function isTradingTime(): boolean {
  const now = new Date();
  const day = now.getDay();
  // 周末不交易
  if (day === 0 || day === 6) return false;
  
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;
  
  // 9:30-11:30 或 13:00-15:00
  const morningStart = 9 * 60 + 30;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60;
  
  return (time >= morningStart && time <= morningEnd) || 
         (time >= afternoonStart && time <= afternoonEnd);
}

/**
 * K 线图表组件
 */
export const KLineChart = forwardRef<KLineChartRef, KLineChartProps>(function KLineChart(
  props,
  ref
) {
  const {
    symbol,
    market = 'A',
    period: initialPeriod = 'daily',
    adjust: initialAdjust = 'hfq',
    height = 500,
    width = '100%',
    theme = 'light',
    indicators: initialIndicators = ['ma', 'volume', 'macd'],
    indicatorOptions,
    showToolbar = true,
    showPeriodSelector = true,
    showIndicatorSelector = true,
    visibleCount = 60,
    onDataLoad,
    onPeriodChange,
    onError,
    dataProvider,
    sdkOptions,
    requestOptions,
    autoRefresh,
    panes,
    echartsOption,
    echartsOptionMerge,
    className,
    style,
  } = props;

  // 内部状态
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const [adjust, setAdjust] = useState<AdjustType>(initialAdjust);
  const [indicators, setIndicators] = useState<IndicatorType[]>(initialIndicators);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 主题配置
  const themeConfig = useMemo(() => getTheme(theme), [theme]);

  // 计算实际使用的面板配置
  const actualPanes = useMemo(
    () => panes ?? getDefaultPanes(indicators),
    [panes, indicators]
  );

  // 数据获取
  const { data, timelineData, loading, error, refresh } = useKlineData({
    symbol,
    market,
    period,
    adjust,
    dataProvider,
    sdkOptions,
    requestOptions,
    indicatorOptions,
    indicators,
  });

  // ECharts 实例
  const { chartRef, setOption, getDataURL, bindEvent } = useEcharts();

  // 缩放历史
  const { canUndo, canRedo, currentState, pushState, undo, redo, reset: resetZoom } = useZoomHistory();

  // 图表容器实际高度
  const [chartHeight, setChartHeight] = useState(500);
  
  // 监听图表容器高度变化
  useEffect(() => {
    const chartEl = chartRef.current;
    if (!chartEl) return;
    
    const updateHeight = () => {
      const h = chartEl.offsetHeight;
      if (h > 0) {
        setChartHeight(h);
      }
    };
    
    // 初始化
    updateHeight();
    
    // 监听 resize
    const observer = new ResizeObserver(updateHeight);
    observer.observe(chartEl);
    
    return () => observer.disconnect();
  }, []);
  

  // 解析自动刷新配置
  const autoRefreshConfig = useMemo((): AutoRefreshOptions | null => {
    if (!autoRefresh) return null;
    if (autoRefresh === true) {
      return { intervalMs: 5000, onlyTradingTime: true };
    }
    return autoRefresh;
  }, [autoRefresh]);

  // 自动刷新逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    // 只在分时周期启用自动刷新
    if (!autoRefreshConfig || !isTimelinePeriod(period)) return;

    const { intervalMs = 5000, onlyTradingTime = true } = autoRefreshConfig;

    autoRefreshTimerRef.current = setInterval(() => {
      if (onlyTradingTime && !isTradingTime()) return;
      refresh();
    }, intervalMs);

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [autoRefreshConfig, period, refresh]);

  // 监听 hover 事件获取数据索引
  useEffect(() => {
    const unbind = bindEvent('mousemove', (params: unknown) => {
      const p = params as { dataIndex?: number } | undefined;
      if (p?.dataIndex !== undefined) {
        setHoverIndex(p.dataIndex);
      }
    });
    
    const unbindLeave = bindEvent('mouseout', () => {
      setHoverIndex(null);
    });

    return () => {
      unbind();
      unbindLeave();
    };
  }, [bindEvent]);

  // 构建并设置图表配置
  useEffect(() => {
    if (data.length === 0 && !loading) return;

    let chartOption: EChartsOption;

    // 分时图使用专门的构建器
    if (isTimelinePeriod(period) && timelineData.length > 0) {
      const prevClose = data.length > 0 ? (data[0]?.close ?? undefined) : undefined;
      chartOption = buildTimelineOption({
        data: timelineData,
        theme: themeConfig,
        prevClose: prevClose ?? undefined,
        containerHeight: chartHeight,
      }) as EChartsOption;
    } else {
      // K 线图
      chartOption = buildOption({
        data,
        theme: themeConfig,
        indicators,
        panes: actualPanes,
        visibleCount,
        containerHeight: chartHeight,
      });
    }

    const mergedOption = mergeOption(
      chartOption,
      echartsOption,
      echartsOptionMerge?.mode
    );

    // 使用 replaceMerge 来保留 dataZoom 的状态（用户的缩放操作）
    setOption(mergedOption as EChartsOption, {
      replaceMerge: ['series', 'xAxis', 'yAxis', 'grid'],
    });
  }, [
    data,
    timelineData,
    themeConfig,
    indicators,
    actualPanes,
    visibleCount,
    chartHeight,
    echartsOption,
    echartsOptionMerge,
    setOption,
    loading,
    period,
  ]);

  // 数据加载回调
  useEffect(() => {
    if (data.length > 0 && onDataLoad) {
      onDataLoad(data);
    }
  }, [data, onDataLoad]);

  // 错误回调
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // 周期切换
  const handlePeriodChange = useCallback(
    (newPeriod: PeriodType) => {
      setPeriod(newPeriod);
      resetZoom();
      onPeriodChange?.(newPeriod);
    },
    [onPeriodChange, resetZoom]
  );

  // 复权切换
  const handleAdjustChange = useCallback((newAdjust: AdjustType) => {
    setAdjust(newAdjust);
  }, []);

  // 指标切换
  const handleIndicatorsChange = useCallback((newIndicators: IndicatorType[]) => {
    setIndicators(newIndicators);
  }, []);

  const applyZoom = useCallback(
    (start: number, end: number, commit = true) => {
      const safeStart = Math.max(0, Math.min(100, start));
      const safeEnd = Math.max(safeStart, Math.min(100, end));

      setOption({
        dataZoom: [
          { id: DATA_ZOOM_INSIDE_ID, start: safeStart, end: safeEnd },
          { id: DATA_ZOOM_SLIDER_ID, start: safeStart, end: safeEnd },
        ],
      });

      if (commit) {
        pushState({ start: safeStart, end: safeEnd });
      }
    },
    [setOption, pushState]
  );

  const getInitialZoom = useCallback(
    (total: number) => {
      if (total <= 0) return { start: 0, end: 100 };
      const start = Math.max(0, ((total - visibleCount) / total) * 100);
      return { start, end: 100 };
    },
    [visibleCount]
  );

  // 缩放操作 - 基于当前状态进行相对调整
  const handleZoomIn = useCallback(() => {
    const { start, end } = currentState;
    const range = end - start;
    const newRange = Math.max(range * 0.6, 5); // 缩小到 60%，最小 5%
    const center = (start + end) / 2;
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    applyZoom(newStart, newEnd);
  }, [applyZoom, currentState]);

  const handleZoomOut = useCallback(() => {
    const { start, end } = currentState;
    const range = end - start;
    const newRange = Math.min(range * 1.5, 100); // 放大到 150%，最大 100%
    const center = (start + end) / 2;
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(100, center + newRange / 2);

    applyZoom(newStart, newEnd);
  }, [applyZoom, currentState]);

  // 平移操作 - 基于当前状态进行相对调整
  const handlePanLeft = useCallback(() => {
    const { start, end } = currentState;
    const range = end - start;
    const step = range * 0.2; // 平移 20% 范围
    const newStart = Math.max(0, start - step);
    const newEnd = newStart + range;

    applyZoom(newStart, newEnd);
  }, [applyZoom, currentState]);

  const handlePanRight = useCallback(() => {
    const { start, end } = currentState;
    const range = end - start;
    const step = range * 0.2; // 平移 20% 范围
    const newEnd = Math.min(100, end + step);
    const newStart = newEnd - range;

    applyZoom(newStart, newEnd);
  }, [applyZoom, currentState]);

  // 撤销/重做
  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      applyZoom(state.start, state.end, false);
    }
  }, [undo, applyZoom]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      applyZoom(state.start, state.end, false);
    }
  }, [redo, applyZoom]);

  // 重置
  const handleReset = useCallback(() => {
    const { start, end } = getInitialZoom(data.length);
    applyZoom(start, end, false);
    resetZoom({ start, end });
  }, [data.length, getInitialZoom, applyZoom, resetZoom]);

  // 全屏切换
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // 全屏失败，忽略
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        // 退出全屏失败，忽略
      });
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 暴露 ref 方法
  useImperativeHandle(
    ref,
    () => ({
      refresh,
      setPeriod: handlePeriodChange,
      setIndicators: handleIndicatorsChange,
      zoomTo: (start: number, end: number) => {
        applyZoom(start, end);
      },
      resetZoom: handleReset,
      getEchartsInstance: () => chartRef.current,
      exportImage: (type?: 'png' | 'jpeg') => getDataURL({ type }),
      getData: () => data,
    }),
    [
      refresh,
      handlePeriodChange,
      handleIndicatorsChange,
      handleReset,
      applyZoom,
      chartRef,
      getDataURL,
      data,
    ]
  );

  useEffect(() => {
    if (isTimelinePeriod(period) || data.length === 0) return;
    const { start, end } = getInitialZoom(data.length);
    applyZoom(start, end, false);
    resetZoom({ start, end });
  }, [data.length, period, getInitialZoom, applyZoom, resetZoom]);

  // CSS 变量
  const cssVars = useMemo(
    () =>
      ({
        '--kline-bg-color': themeConfig.backgroundColor,
        '--kline-text-color': themeConfig.textColor,
        '--kline-text-secondary': themeConfig.textColorSecondary,
        '--kline-border-color': themeConfig.gridLineColor,
        '--kline-active-color': themeConfig.activeColor,
        '--kline-hover-bg': theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
        '--kline-tag-bg': theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
        '--kline-text-disabled': theme === 'dark' ? '#444' : '#ccc',
      }) as React.CSSProperties,
    [themeConfig, theme]
  );

  // 判断是否显示主图指标数值（MA 或 BOLL）
  const showIndicatorDisplay = (indicators.includes('ma') || indicators.includes('boll')) && !isTimelinePeriod(period) && data.length > 0;

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''} ${className ?? ''}`}
      style={{ ...cssVars, width, height: isFullscreen ? '100vh' : height, ...style }}
    >
      {/* 周期选择器 */}
      {showPeriodSelector && (
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      )}

      {/* 工具栏 */}
      {showToolbar && !isTimelinePeriod(period) && (
        <Toolbar
          adjust={adjust}
          onAdjustChange={handleAdjustChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onPanLeft={handlePanLeft}
          onPanRight={handlePanRight}
          onReset={handleReset}
          onFullscreen={handleFullscreen}
        />
      )}

      {/* 分时模式工具栏（简化版） */}
      {showToolbar && isTimelinePeriod(period) && (
        <div className={styles.timelineToolbar}>
          <span className={styles.timelineLabel}>分时走势</span>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={refresh}
            disabled={loading}
          >
            刷新
          </button>
          <button
            type="button"
            className={styles.fullscreenButton}
            onClick={handleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
        </div>
      )}

      {/* MA 数值显示 */}
      {/* 主图指标数值显示（MA/BOLL） */}
      {showIndicatorDisplay && (
        <IndicatorDisplay data={data} indicators={indicators} hoverIndex={hoverIndex} />
      )}

      {/* 图表区域 */}
      <div className={styles.chartWrapper}>
        {loading && data.length === 0 && <Loading />}
        {error && data.length === 0 && (
          <div className={styles.error}>
            <span>加载失败：{error.message}</span>
            <button type="button" onClick={refresh}>
              重试
            </button>
          </div>
        )}
        <div
          ref={chartRef as React.RefObject<HTMLDivElement>}
          className={styles.chart}
          style={{ visibility: data.length > 0 || timelineData.length > 0 ? 'visible' : 'hidden' }}
        />
        {/* 副图标题 */}
        {!isTimelinePeriod(period) && data.length > 0 && (
          <SubPaneTitle
            panes={actualPanes}
            data={data}
            hoverIndex={hoverIndex}
            containerHeight={chartHeight}
          />
        )}
      </div>

      {/* 指标选择器（分时模式不显示） */}
      {showIndicatorSelector && !isTimelinePeriod(period) && (
        <IndicatorSelector value={indicators} onChange={handleIndicatorsChange} />
      )}
    </div>
  );
});
