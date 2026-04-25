import type { EChartsOption } from 'echarts';
import type { TimelineData, ThemeConfig } from '@/types';
import { formatPrice, formatVolume } from './formatters';

/**
 * 构建分时图 category 类型的 xAxis 配置
 * boundarySet 控制日间分隔线，dayMidIndices 控制日期标签居中显示
 */
function makeCategoryAxis(
  times: string[],
  gridIndex: number,
  theme: ThemeConfig,
  boundarySet: Set<number>,
  dayMidIndices: Set<number>,
  labelOpts: Record<string, unknown>,
): Record<string, unknown> {
  const isMultiDay = boundarySet.size > 0;
  const axis: Record<string, unknown> = {
    type: 'category',
    gridIndex,
    axisLine: { lineStyle: { color: theme.gridLineColor } },
    axisTick: { show: false },
    axisLabel: {
      ...labelOpts,
      formatter: isMultiDay
        ? (value: string, index?: number) => {
            if (index !== undefined && dayMidIndices.has(index)) {
              const parts = value.slice(0, 10).split('-');
              if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
              return value.slice(5, 10).replace('-', '/');
            }
            return '';
          }
        : (value: string) => {
            // 单日分时：time 格式可能是 YYYY-MM-DD HH:mm 或 HH:mm
            const spaceIdx = value.indexOf(' ');
            return spaceIdx >= 0 ? value.slice(spaceIdx + 1) : value;
          },
    },
    splitLine: isMultiDay ? {
      show: true,
      interval: (index: number) => boundarySet.has(index),
      lineStyle: { color: theme.gridLineColor, type: 'dashed', width: 1 },
    } : { show: false },
    boundaryGap: false,
  };
  axis['data'] = times;
  return axis;
}

/**
 * 将任意格式颜色转为带透明度的 rgba 字符串
 * 支持 hex (#rgb / #rrggbb)、rgb()、rgba()
 */
function colorWithAlpha(color: string, alpha: number): string {
  // 已有 rgba
  if (color.startsWith('rgba')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
  }
  // rgb(r, g, b) → rgba(r, g, b, alpha)
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  // hex → rgba
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 构建分时图 Option
 */
export function buildTimelineOption(params: {
  data: TimelineData[];
  theme: ThemeConfig;
  prevClose?: number;
  containerHeight?: number;
  showDataZoom?: boolean;
}): EChartsOption {
  const { data, theme, prevClose, containerHeight = 500, showDataZoom = true } = params;

  if (data.length === 0) {
    return {
      title: {
        text: '暂无分时数据',
        left: 'center',
        top: 'center',
        textStyle: { color: theme.textColorSecondary },
      },
    };
  }

  const times = data.map((d) => d.time);
  const prices = data.map((d) => d.price);
  const avgPrices = data.map((d) => d.avgPrice);

  // 检测日期分界点（五日图：time 格式 YYYY-MM-DD HH:mm）
  const dayBoundaries: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const prevDate = times[i - 1]!.slice(0, 10);
    const currDate = times[i]!.slice(0, 10);
    if (prevDate !== currDate && prevDate.length === 10) {
      dayBoundaries.push(i);
    }
  }
  const boundarySet = new Set(dayBoundaries);

  // 每个交易日的中间索引，用于居中显示日期标签
  const dayStarts = [0, ...dayBoundaries];
  const dayMidIndices = new Set<number>();
  for (let d = 0; d < dayStarts.length; d++) {
    const start = dayStarts[d]!;
    const end = d + 1 < dayStarts.length ? dayStarts[d + 1]! : times.length;
    dayMidIndices.add(Math.floor((start + end) / 2));
  }

  const volumes = data.map((d, i) => {
    // 计算单根成交量（当前累计 - 前一累计）
    const prevVol = i > 0 ? (data[i - 1]?.volume ?? 0) : 0;
    const delta = d.volume - prevVol;
    // 差值为负说明跨交易日累计重置，取当前值作为单根量
    return delta >= 0 ? delta : d.volume;
  });

  // 计算价格范围（防止所有价格为 0 或过滤后为空数组）
  const validPrices = prices.filter((p) => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1 || 1;

  // 涨跌颜色判断
  const lastPrice = prices[prices.length - 1] ?? 0;
  const priceColor = prevClose
    ? lastPrice >= prevClose
      ? theme.upColor
      : theme.downColor
    : theme.activeColor;

  // 成交量高度
  const volumeHeight = Math.max(60, containerHeight * 0.15);
  const mainHeight = containerHeight - volumeHeight - 100;

  const option: EChartsOption = {
    animation: false,
    backgroundColor: theme.backgroundColor,
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

        const changePercent = prevClose
          ? (((item.price - prevClose) / prevClose) * 100).toFixed(2)
          : '--';
        const changeColor =
          prevClose && item.price >= prevClose ? theme.upColor : theme.downColor;

        return `
          <div style="font-weight:bold;margin-bottom:4px">${item.time}</div>
          <div>价格: <span style="color:${changeColor};font-weight:500">${formatPrice(item.price)}</span></div>
          <div>均价: ${formatPrice(item.avgPrice)}</div>
          <div>涨跌: <span style="color:${changeColor}">${changePercent}%</span></div>
          <div>成交量: ${formatVolume(item.volume)}</div>
        `;
      },
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }],
    },
    ...(showDataZoom
      ? {
          dataZoom: [
            {
              id: 'kline-zoom-inside',
              type: 'inside',
              xAxisIndex: [0, 1],
              minValueSpan: 10,
            },
            {
              id: 'kline-zoom-slider',
              type: 'slider',
              xAxisIndex: [0, 1],
              bottom: 8,
              height: 20,
              borderColor: theme.gridLineColor,
              fillerColor: 'rgba(24,144,255,0.1)',
              handleStyle: { color: theme.activeColor },
              textStyle: { color: theme.textColorSecondary },
            },
          ],
        }
      : { dataZoom: [] }),
    grid: [
      {
        left: 60,
        right: 60,
        top: 40,
        height: mainHeight,
      },
      {
        left: 60,
        right: 60,
        top: mainHeight + 70,
        height: volumeHeight,
      },
    ],
    xAxis: [
      makeCategoryAxis(times, 0, theme, boundarySet, dayMidIndices, { show: false }),
      makeCategoryAxis(times, 1, theme, boundarySet, dayMidIndices, {
        show: true,
        color: theme.textColorSecondary,
        fontSize: 11,
        ...(boundarySet.size > 0
          ? { interval: (index: number) => dayMidIndices.has(index) }
          : {}),
      }),
    ],
    yAxis: [
      {
        type: 'value',
        gridIndex: 0,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: theme.textColorSecondary,
          fontSize: 11,
          formatter: (value: number) => formatPrice(value),
        },
        splitLine: {
          lineStyle: { color: theme.splitLineColor, type: 'dashed' },
        },
        min: minPrice - pricePadding,
        max: maxPrice + pricePadding,
      },
      {
        type: 'value',
        gridIndex: 1,
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: theme.textColorSecondary,
          fontSize: 11,
          formatter: (value: number) => formatVolume(value),
        },
        splitLine: {
          lineStyle: { color: theme.splitLineColor, type: 'dashed' },
        },
      },
    ],
    series: [
      // 分时价格线
      {
        type: 'line',
        name: '价格',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: prices,
        symbol: 'none',
        lineStyle: {
          width: 1.5,
          color: priceColor,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colorWithAlpha(priceColor, 0.3) },
              { offset: 1, color: colorWithAlpha(priceColor, 0.05) },
            ],
          },
        },
      },
      // 均价线
      {
        type: 'line',
        name: '均价',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: avgPrices,
        symbol: 'none',
        lineStyle: {
          width: 1,
          color: '#faad14',
          type: 'dashed',
        },
      },
      // 昨收线
      ...(prevClose
        ? [
            {
              type: 'line' as const,
              name: '昨收',
              xAxisIndex: 0,
              yAxisIndex: 0,
              data: times.map(() => prevClose),
              symbol: 'none',
              lineStyle: {
                width: 1,
                color: theme.textColorSecondary,
                type: 'dotted' as const,
              },
            },
          ]
        : []),
      // 成交量
      {
        type: 'bar',
        name: '成交量',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes.map((vol, i) => {
          const price = prices[i] ?? 0;
          const prevPrice = i > 0 ? (prices[i - 1] ?? price) : (prevClose ?? price);
          return {
            value: vol,
            itemStyle: {
              color: price >= prevPrice ? theme.volumeUpColor : theme.volumeDownColor,
            },
          };
        }),
      },
    ],
  };

  return option;
}
