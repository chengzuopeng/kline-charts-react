import type { EChartsOption } from 'echarts';
import type { TimelineData, ThemeConfig } from '@/types';
import { formatPrice, formatVolume } from './formatters';

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
}): EChartsOption {
  const { data, theme, prevClose, containerHeight = 500 } = params;

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
  const volumes = data.map((d, i) => {
    // 计算单根成交量（当前累计 - 前一累计）
    const prevVol = i > 0 ? (data[i - 1]?.volume ?? 0) : 0;
    return d.volume - prevVol;
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
      {
        type: 'category',
        data: times,
        gridIndex: 0,
        axisLine: { lineStyle: { color: theme.gridLineColor } },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        boundaryGap: false,
      },
      {
        type: 'category',
        data: times,
        gridIndex: 1,
        axisLine: { lineStyle: { color: theme.gridLineColor } },
        axisTick: { show: false },
        axisLabel: {
          color: theme.textColorSecondary,
          fontSize: 11,
          formatter: (value: string) => value,
        },
        splitLine: { show: false },
        boundaryGap: false,
      },
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
