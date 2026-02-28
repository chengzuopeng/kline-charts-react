import type { EChartsOption } from 'echarts';
import type { KlineWithIndicators, ThemeConfig, IndicatorType, PaneConfig, IndicatorOptions } from '@/types';
import { formatKlineTooltip, formatVolume } from './formatters';


/**
 * 主图指标列表（在主图显示的指标）
 * SAR 和 KC 是主图指标
 */
const MAIN_INDICATORS: IndicatorType[] = ['ma', 'boll', 'sar', 'kc'];

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

  // 根据副图数量计算高度比例（主图占比更大，副图更紧凑）
  const getHeights = () => {
    if (limitedSubCount === 0) return { main: '95%', sub: '0%' };
    if (limitedSubCount === 1) return { main: '78%', sub: '18%' };
    if (limitedSubCount === 2) return { main: '65%', sub: '15%' };
    return { main: '55%', sub: '13%' }; // 3个副图
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

/** 布局常量 */
export const LAYOUT = {
  gap: 25,
  topMargin: 50,
  bottomMargin: 55,
  leftMargin: 60,
  rightMargin: 60,
} as const;

/**
 * 计算 Grid 布局
 */
export function calculateGridLayout(panes: PaneConfig[], containerHeight: number) {
  const grids: Array<{
    id: string;
    left: number;
    right: number;
    top: number;
    height: number;
  }> = [];

  const { gap, topMargin, bottomMargin } = LAYOUT;
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
      left: LAYOUT.leftMargin,
      right: LAYOUT.rightMargin,
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
  indicatorOptions?: IndicatorOptions;
}): EChartsOption {
  const {
    data,
    theme,
    indicators,
    panes = getDefaultPanes(indicators),
    // visibleCount 参数保留用于 API 兼容性，初始缩放状态由 KLineChart 组件设置
    visibleCount: _visibleCount = 60,
    containerHeight = 500,
    indicatorOptions,
  } = params;
  void _visibleCount; // 避免 unused variable 警告
  const maOpts = typeof indicatorOptions?.ma === 'object' ? indicatorOptions.ma : undefined;
  const maPeriods: number[] = maOpts?.periods ?? [5, 10, 20, 30, 60];

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
          // 传递指标数据
          indicators,
          // 主图指标
          ma: item.ma,
          boll: item.boll,
          sar: item.sar,
          kc: item.kc,
          // 副图指标
          macd: item.macd,
          kdj: item.kdj,
          rsi: item.rsi,
          wr: item.wr,
          bias: item.bias,
          cci: item.cci,
          atr: item.atr,
          obv: item.obv,
          roc: item.roc,
          dmi: item.dmi,
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
      // 主图 3 根分割线，副图 2 根
      splitNumber: g.id === 'main' ? 3 : 2,
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
        bottom: 8,
        height: 20,
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
      maPeriods.forEach((period, i) => {
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
      const [bollUpper, bollMid, bollLower] = theme.bollColors;
      series.push(
        {
          type: 'line',
          name: 'BOLL上轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.upper ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: bollUpper },
        },
        {
          type: 'line',
          name: 'BOLL中轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.mid ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: bollMid },
        },
        {
          type: 'line',
          name: 'BOLL下轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.boll?.lower ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: bollLower },
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

    // OBV 指标（能量潮）
    if (pane.indicators.includes('obv')) {
      series.push(
        {
          type: 'line',
          name: 'OBV',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.obv?.obv ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'OBV_MA',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.obv?.obvMa ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#faad14' },
        }
      );
    }

    // ROC 指标（变动率）
    if (pane.indicators.includes('roc')) {
      series.push(
        {
          type: 'line',
          name: 'ROC',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.roc?.roc ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'ROC_MA',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.roc?.signal ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#faad14' },
        }
      );
    }

    // DMI 指标（趋向指标）
    if (pane.indicators.includes('dmi')) {
      series.push(
        {
          type: 'line',
          name: '+DI',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.dmi?.pdi ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: theme.upColor },
        },
        {
          type: 'line',
          name: '-DI',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.dmi?.mdi ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: theme.downColor },
        },
        {
          type: 'line',
          name: 'ADX',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.dmi?.adx ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#1890ff' },
        },
        {
          type: 'line',
          name: 'ADXR',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.dmi?.adxr ?? null),
          symbol: 'none',
          lineStyle: { width: 1, color: '#722ed1', type: 'dashed' },
        }
      );
    }

    // SAR 指标（抛物线转向）- 主图指标
    if (pane.indicators.includes('sar')) {
      series.push({
        type: 'scatter',
        name: 'SAR',
        xAxisIndex: paneIndex,
        yAxisIndex: paneIndex,
        data: data.map((d) => ({
          value: d.sar?.sar ?? null,
          itemStyle: {
            // 上升趋势用红色，下降趋势用绿色
            color: d.sar?.trend === 1 ? theme.upColor : theme.downColor,
          },
        })),
        symbol: 'circle',
        symbolSize: 4,
      });
    }

    // KC 指标（肯特纳通道）- 主图指标
    if (pane.indicators.includes('kc')) {
      const [kcUpper, kcMid, kcLower] = theme.kcColors;
      series.push(
        {
          type: 'line',
          name: 'KC上轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kc?.upper ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: kcUpper },
        },
        {
          type: 'line',
          name: 'KC中轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kc?.mid ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: kcMid },
        },
        {
          type: 'line',
          name: 'KC下轨',
          xAxisIndex: paneIndex,
          yAxisIndex: paneIndex,
          data: data.map((d) => d.kc?.lower ?? null),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1, color: kcLower },
        }
      );
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
