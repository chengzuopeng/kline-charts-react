import type { EChartsOption } from 'echarts';
import type { KlineWithIndicators, ThemeConfig, IndicatorType, PaneConfig } from '@/types';
import { formatKlineTooltip, formatVolume } from './formatters';


/**
 * 主图指标列表
 */
const MAIN_INDICATORS: IndicatorType[] = ['ma', 'boll'];

export const DATA_ZOOM_INSIDE_ID = 'kline-zoom-inside';
export const DATA_ZOOM_SLIDER_ID = 'kline-zoom-slider';

/**
 * 智能格式化数值：整数不显示小数，非整数保留适当精度
 */
function smartFormat(value: number, decimals: number): string {
  // 如果是整数，不显示小数部分
  if (Number.isInteger(value)) {
    return value.toString();
  }
  
  const formatted = value.toFixed(decimals);
  // 移除末尾的 0 和不必要的小数点
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Y轴数值格式化
 * 根据不同指标类型使用不同的格式化方式
 * 整数不显示 .00
 */
function formatYAxisValue(value: number, paneId: string): string {
  // 成交量用万/亿格式
  if (paneId.includes('volume')) {
    return formatVolume(value);
  }
  
  // 对于较大的数值（如价格），保留两位小数
  if (Math.abs(value) >= 100) {
    return smartFormat(value, 2);
  }
  
  // 对于较小的数值（如 MACD、KDJ 等指标），根据数值大小动态调整精度
  if (Math.abs(value) >= 10) {
    return smartFormat(value, 2);
  }
  
  if (Math.abs(value) >= 1) {
    return smartFormat(value, 2);
  }
  
  // 非常小的数值保留更多精度
  if (Math.abs(value) >= 0.01) {
    return smartFormat(value, 2);
  }
  
  return smartFormat(value, 4);
}

/**
 * 生成默认面板配置参数
 */
interface GetDefaultPanesOptions {
  /** 最多显示几个副图，默认 3，最大 3，传入 0 表示不显示副图 */
  maxSubPanes?: number;
}

/**
 * 生成默认面板配置
 * 每个副图指标独立一个面板
 */
export function getDefaultPanes(
  indicators: IndicatorType[],
  options: GetDefaultPanesOptions = {}
): PaneConfig[] {
  // 限制 maxSubPanes 范围：0-3
  const maxSubPanes = Math.min(Math.max(options.maxSubPanes ?? 3, 0), 3);
  
  // 副图指标（排除主图指标）
  const subIndicators = indicators.filter((i) => !MAIN_INDICATORS.includes(i));
  
  // 如果 maxSubPanes 为 0，不显示副图
  if (maxSubPanes === 0) {
    return [
      {
        id: 'main',
        height: '95%',
        indicators: MAIN_INDICATORS.filter((i) => indicators.includes(i)),
      },
    ];
  }
  
  const subCount = subIndicators.length;
  const limitedSubCount = Math.min(subCount, maxSubPanes);

  // 根据副图数量计算高度比例
  const getHeights = () => {
    if (limitedSubCount === 0) return { main: '90%', sub: '0%' };
    if (limitedSubCount === 1) return { main: '70%', sub: '25%' };
    if (limitedSubCount === 2) return { main: '55%', sub: '20%' };
    return { main: '45%', sub: '15%' }; // 3个副图
  };

  const heights = getHeights();

  // 主图面板
  const panes: PaneConfig[] = [
    {
      id: 'main',
      height: heights.main,
      indicators: MAIN_INDICATORS.filter((i) => indicators.includes(i)),
    },
  ];

  // 每个副图指标独立一个面板（最多 maxSubPanes 个）
  subIndicators.slice(0, maxSubPanes).forEach((indicator, index) => {
    panes.push({
      id: `sub_${indicator}_${index}`,
      height: heights.sub,
      indicators: [indicator],
    });
  });

  return panes;
}

/**
 * 计算 Grid 布局
 */
function calculateGridLayout(panes: PaneConfig[], containerHeight: number) {
  const grids: Array<{
    id: string;
    left: number;
    right: number;
    top: number;
    height: number;
  }> = [];

  const gap = 25; // 副图间距
  const topMargin = 50;
  const bottomMargin = 30; // 为 dataZoom slider 留空间
  const availableHeight = containerHeight - topMargin - bottomMargin - (panes.length - 1) * gap;

  // 计算每个面板的高度
  let totalPercent = 0;
  const heights: number[] = [];

  for (const pane of panes) {
    if (typeof pane.height === 'string' && pane.height.endsWith('%')) {
      const percent = parseFloat(pane.height) / 100;
      heights.push(percent);
      totalPercent += percent;
    } else if (typeof pane.height === 'number') {
      heights.push(pane.height / availableHeight);
      totalPercent += pane.height / availableHeight;
    } else {
      heights.push(0);
    }
  }

  // 分配剩余高度给未指定高度的面板
  const unspecified = heights.filter((h) => h === 0).length;
  if (unspecified > 0 && totalPercent < 1) {
    const remaining = (1 - totalPercent) / unspecified;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] === 0) {
        heights[i] = remaining;
      }
    }
  }

  // 归一化
  const sum = heights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < heights.length; i++) {
    heights[i] = (heights[i]! / sum) * availableHeight;
  }

  let currentTop = topMargin;
  for (let i = 0; i < panes.length; i++) {
    grids.push({
      id: panes[i]!.id,
      left: 60,
      right: 60,
      top: currentTop,
      height: heights[i]!,
    });
    currentTop += heights[i]! + gap;
  }

  return grids;
}

/**
 * 构建 ECharts Option
 */
export function buildOption(params: {
  data: KlineWithIndicators[];
  theme: ThemeConfig;
  indicators: IndicatorType[];
  panes?: PaneConfig[];
  visibleCount?: number;
  containerHeight?: number;
}): EChartsOption {
  const {
    data,
    theme,
    indicators,
    panes = getDefaultPanes(indicators),
    // visibleCount 参数保留用于 API 兼容性，初始缩放状态由 KLineChart 组件设置
    visibleCount: _visibleCount = 60,
    containerHeight = 500,
  } = params;
  void _visibleCount; // 避免 unused variable 警告

  if (data.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: theme.textColorSecondary },
      },
    };
  }

  const gridLayouts = calculateGridLayout(panes, containerHeight);
  const dates = data.map((d) => d.date);
  const closes = data.map((d) => d.close);

  // 基础配置
  const option: EChartsOption = {
    animation: false,
    backgroundColor: theme.backgroundColor,
    // 显式清除 title（避免 "暂无数据" 残留）
    title: { text: '', show: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: theme.crosshairColor },
        lineStyle: { color: theme.crosshairColor, type: 'dashed' },
      },
      backgroundColor: theme.tooltipBgColor,
      borderColor: theme.tooltipBorderColor,
      textStyle: { color: theme.textColor, fontSize: 12 },
      formatter: (params: unknown) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const dataIndex = (params[0] as { dataIndex: number }).dataIndex;
        const item = data[dataIndex];
        if (!item) return '';
        return formatKlineTooltip({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          amount: item.amount,
          change: item.change,
          changePercent: item.changePercent,
          turnoverRate: item.turnoverRate,
          amplitude: item.amplitude,
        });
      },
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
    },
    grid: gridLayouts.map((g) => ({
      left: g.left,
      right: g.right,
      top: g.top,
      height: g.height,
    })),
    xAxis: gridLayouts.map((_, index) => ({
      type: 'category' as const,
      data: dates,
      gridIndex: index,
      axisLine: { lineStyle: { color: theme.gridLineColor } },
      axisTick: { show: false },
      axisLabel: {
        show: index === gridLayouts.length - 1,
        color: theme.textColorSecondary,
        fontSize: 11,
      },
      splitLine: { show: false },
      boundaryGap: true,
      min: 'dataMin',
      max: 'dataMax',
    })),
    yAxis: gridLayouts.map((g, index) => ({
      type: 'value' as const,
      gridIndex: index,
      position: 'right' as const,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.textColorSecondary,
        fontSize: 11,
        formatter: (value: number) => formatYAxisValue(value, g.id),
      },
      splitLine: {
        lineStyle: { color: theme.splitLineColor, type: 'dashed' as const },
      },
      splitNumber: 3, // 减少分割线数量，让图表更清晰
      scale: g.id !== 'volume' && !g.id.includes('volume'),
    })),
    dataZoom: [
      {
        id: DATA_ZOOM_INSIDE_ID,
        type: 'inside',
        xAxisIndex: gridLayouts.map((_, i) => i),
        minValueSpan: 10,
      },
      {
        id: DATA_ZOOM_SLIDER_ID,
        type: 'slider',
        xAxisIndex: gridLayouts.map((_, i) => i),
        bottom: 5,
        height: 15,
        borderColor: theme.gridLineColor,
        fillerColor: 'rgba(24,144,255,0.1)',
        handleStyle: { color: theme.activeColor },
        textStyle: { color: theme.textColorSecondary },
      },
    ],
    series: [],
  };

  const series: EChartsOption['series'] = [];

  // 为每个面板构建 series
  for (let paneIndex = 0; paneIndex < panes.length; paneIndex++) {
    const pane = panes[paneIndex]!;
    const gridLayout = gridLayouts[paneIndex]!;

    // 主图 K 线
    if (gridLayout.id === 'main') {
      series.push({
        type: 'candlestick',
        name: 'K线',
        xAxisIndex: paneIndex,
        yAxisIndex: paneIndex,
        data: data.map((d) => [d.open, d.close, d.low, d.high]),
        itemStyle: {
          color: theme.upColor,
          color0: theme.downColor,
          borderColor: theme.upColor,
          borderColor0: theme.downColor,
        },
      });
    }

    // MA 指标
    if (pane.indicators.includes('ma')) {
      const periods = [5, 10, 20, 30, 60];
      periods.forEach((period, i) => {
        const maKey = `ma${period}`;
        const maData = data.map((d) => d.ma?.[maKey] ?? null);
        series.push({
          type: 'line',
          name: `MA${period}`,
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: maData,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 1,
            color: theme.maColors[i] ?? theme.maColors[0],
          },
        });
      });
    }

    // BOLL 指标
    if (pane.indicators.includes('boll')) {
      series.push(
        {
          type: 'line',
          name: 'BOLL上轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.upper ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: '#faad14' },
        },
        {
          type: 'line',
          name: 'BOLL中轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.mid ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'BOLL下轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.lower ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: '#722ed1' },
        }
      );
    }

    // 成交量
    if (pane.indicators.includes('volume')) {
      series.push({
        type: 'bar',
        name: '成交量',
        xAxisIndex: paneIndex,
        yAxisIndex: paneIndex,
        data: data.map((d, i) => {
          const prevClose = i > 0 ? closes[i - 1] : d.open;
          const isUp = (d.close ?? 0) >= (prevClose ?? 0);
          return {
            value: d.volume,
            itemStyle: {
              color: isUp ? theme.volumeUpColor : theme.volumeDownColor,
            },
          };
        }),
      });
    }

    // MACD 指标
    if (pane.indicators.includes('macd')) {
      series.push(
        {
          type: 'bar',
          name: 'MACD',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => ({
            value: d.macd?.macd ?? null,
            itemStyle: {
              color: (d.macd?.macd ?? 0) >= 0 ? theme.upColor : theme.downColor,
            },
          })),
        },
        {
          type: 'line',
          name: 'DIF',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.macd?.dif ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'DEA',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.macd?.dea ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#faad14' },
        }
      );
    }

    // KDJ 指标
    if (pane.indicators.includes('kdj')) {
      series.push(
        {
          type: 'line',
          name: 'K',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kdj?.k ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'D',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kdj?.d ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#faad14' },
        },
        {
          type: 'line',
          name: 'J',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kdj?.j ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#722ed1' },
        }
      );
    }

    // RSI 指标
    if (pane.indicators.includes('rsi')) {
      const periods = [6, 12, 24];
      periods.forEach((period, i) => {
        series.push({
          type: 'line',
          name: `RSI${period}`,
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.rsi?.[`rsi${period}`] ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: theme.maColors[i] ?? '#1890ff' },
        });
      });
    }

    // WR 指标
    if (pane.indicators.includes('wr')) {
      const periods = [6, 10];
      periods.forEach((period, i) => {
        series.push({
          type: 'line',
          name: `WR${period}`,
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.wr?.[`wr${period}`] ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: theme.maColors[i] ?? '#1890ff' },
        });
      });
    }

    // BIAS 指标
    if (pane.indicators.includes('bias')) {
      const periods = [6, 12, 24];
      periods.forEach((period, i) => {
        series.push({
          type: 'line',
          name: `BIAS${period}`,
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.bias?.[`bias${period}`] ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: theme.maColors[i] ?? '#1890ff' },
        });
      });
    }

    // CCI 指标
    if (pane.indicators.includes('cci')) {
      series.push({
        type: 'line',
        name: 'CCI',
        xAxisIndex: paneIndex,
        yAxisIndex: paneIndex,
        data: data.map((d) => d.cci?.cci ?? null),
        symbol: 'none',
        lineStyle: { width: 1, color: '#1890ff' },
      });
    }

    // ATR 指标
    if (pane.indicators.includes('atr')) {
      series.push({
        type: 'line',
        name: 'ATR',
        xAxisIndex: paneIndex,
        yAxisIndex: paneIndex,
        data: data.map((d) => d.atr?.atr ?? null),
        symbol: 'none',
        lineStyle: { width: 1, color: '#1890ff' },
      });
    }
  }

  option.series = series;

  return option;
}

/**
 * 合并 ECharts Option
 */
export function mergeOption(
  baseOption: EChartsOption,
  customOption: EChartsOption | undefined,
  mode: 'safeMerge' | 'replace' = 'safeMerge'
): EChartsOption {
  if (!customOption) return baseOption;
  if (mode === 'replace') return customOption;

  // 安全合并：对于数组类型字段使用替换而非深度合并
  const result = { ...baseOption };

  for (const key of Object.keys(customOption) as (keyof EChartsOption)[]) {
    const customValue = customOption[key];
    if (customValue === undefined) continue;

    // 数组字段直接替换
    if (Array.isArray(customValue)) {
      (result as Record<string, unknown>)[key] = customValue;
    } else if (typeof customValue === 'object' && customValue !== null) {
      // 对象字段浅合并
      (result as Record<string, unknown>)[key] = {
        ...((result as Record<string, unknown>)[key] as object),
        ...customValue,
      };
    } else {
      (result as Record<string, unknown>)[key] = customValue;
    }
  }

  return result;
}
