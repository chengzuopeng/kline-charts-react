import { useMemo } from 'react';
import type { KlineWithIndicators, IndicatorType, PaneConfig } from '@/types';
import styles from './SubPaneTitle.module.css';
import { formatPrice, formatVolume } from '@/utils/formatters';

interface SubPaneTitleProps {
  panes: PaneConfig[];
  data: KlineWithIndicators[];
  hoverIndex?: number | null;
  containerHeight: number;
}

/**
 * 指标显示名称
 */
const INDICATOR_LABELS: Record<IndicatorType, string> = {
  ma: 'MA',
  boll: 'BOLL',
  volume: '成交量',
  macd: 'MACD',
  kdj: 'KDJ',
  rsi: 'RSI',
  wr: 'WR',
  bias: 'BIAS',
  cci: 'CCI',
  atr: 'ATR',
};

/**
 * 获取指标数值文本
 */
function getIndicatorValueText(
  indicator: IndicatorType,
  data: KlineWithIndicators | undefined
): string {
  if (!data) return '';

  switch (indicator) {
    case 'volume':
      return `VOL: ${formatVolume(data.volume)}`;
    case 'macd':
      if (!data.macd) return '';
      return `DIF: ${formatPrice(data.macd.dif)}  DEA: ${formatPrice(data.macd.dea)}  MACD: ${formatPrice(data.macd.macd)}`;
    case 'kdj':
      if (!data.kdj) return '';
      return `K: ${formatPrice(data.kdj.k)}  D: ${formatPrice(data.kdj.d)}  J: ${formatPrice(data.kdj.j)}`;
    case 'rsi':
      if (!data.rsi) return '';
      return `RSI6: ${formatPrice(data.rsi.rsi6)}  RSI12: ${formatPrice(data.rsi.rsi12)}  RSI24: ${formatPrice(data.rsi.rsi24)}`;
    case 'wr':
      if (!data.wr) return '';
      return `WR6: ${formatPrice(data.wr.wr6)}  WR10: ${formatPrice(data.wr.wr10)}`;
    case 'bias':
      if (!data.bias) return '';
      return `BIAS6: ${formatPrice(data.bias.bias6)}  BIAS12: ${formatPrice(data.bias.bias12)}  BIAS24: ${formatPrice(data.bias.bias24)}`;
    case 'cci':
      if (!data.cci) return '';
      return `CCI: ${formatPrice(data.cci.cci)}`;
    case 'atr':
      if (!data.atr) return '';
      return `ATR: ${formatPrice(data.atr.atr)}`;
    default:
      return '';
  }
}

/**
 * 计算副图位置
 */
function calculatePanePositions(panes: PaneConfig[], containerHeight: number) {
  const gap = 25; // 与 optionBuilder 保持一致
  const topMargin = 50;
  const bottomMargin = 30; // 与 optionBuilder 保持一致
  const availableHeight = containerHeight - topMargin - bottomMargin - (panes.length - 1) * gap;

  // 计算每个面板的高度
  const heights: number[] = [];
  let totalPercent = 0;

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

  // 分配剩余高度
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

  // 计算位置
  const positions: { top: number; height: number }[] = [];
  let currentTop = topMargin;
  for (let i = 0; i < panes.length; i++) {
    positions.push({ top: currentTop, height: heights[i]! });
    currentTop += heights[i]! + gap;
  }

  return positions;
}

/**
 * 副图标题组件
 * 显示在每个副图的左上角
 */
export function SubPaneTitle({ panes, data, hoverIndex, containerHeight }: SubPaneTitleProps) {
  const displayIndex = hoverIndex ?? data.length - 1;
  const displayData = data[displayIndex];

  const positions = useMemo(
    () => calculatePanePositions(panes, containerHeight),
    [panes, containerHeight]
  );

  // 跳过主图（index 0），只渲染副图标题
  const subPanes = panes.slice(1);
  const subPositions = positions.slice(1);

  if (subPanes.length === 0) return null;

  return (
    <>
      {subPanes.map((pane, index) => {
        const indicator = pane.indicators[0];
        if (!indicator) return null;

        const label = INDICATOR_LABELS[indicator] || indicator.toUpperCase();
        const valueText = getIndicatorValueText(indicator, displayData);
        const position = subPositions[index];

        return (
          <div
            key={pane.id}
            className={styles.title}
            style={{ top: position?.top ?? 0 }}
          >
            <span className={styles.label}>{label}</span>
            {valueText && <span className={styles.value}>{valueText}</span>}
          </div>
        );
      })}
    </>
  );
}
