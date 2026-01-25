import { useMemo } from 'react';
import type { KlineWithIndicators } from '@/types';
import styles from './MADisplay.module.css';

interface MADisplayProps {
  data: KlineWithIndicators[];
  hoverIndex?: number | null;
}

const MA_COLORS: Record<string, string> = {
  ma5: '#f5a623',
  ma10: '#2196f3',
  ma20: '#e91e63',
  ma30: '#4caf50',
  ma60: '#9c27b0',
  ma120: '#00bcd4',
  ma250: '#ff5722',
};

/**
 * 格式化价格
 */
function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

/**
 * MA 数值显示组件
 */
export function MADisplay({ data, hoverIndex }: MADisplayProps) {
  const displayData = useMemo(() => {
    const idx = hoverIndex ?? data.length - 1;
    const item = data[idx];
    if (!item || !item.ma) return null;
    return item;
  }, [data, hoverIndex]);

  if (!displayData || !displayData.ma) {
    return null;
  }

  const maKeys = Object.keys(displayData.ma).filter(
    (key) => key.startsWith('ma') && displayData.ma?.[key] !== null && displayData.ma?.[key] !== undefined
  );

  if (maKeys.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {maKeys.map((key) => {
        const value = displayData.ma?.[key];
        const color = MA_COLORS[key] ?? '#999';
        return (
          <span key={key} className={styles.item} style={{ color }}>
            {key.toUpperCase()}: {formatPrice(value)}
          </span>
        );
      })}
    </div>
  );
}
