import { useMemo } from 'react';
import type { KlineWithIndicators, IndicatorType } from '@/types';
import styles from './IndicatorDisplay.module.css';

interface IndicatorDisplayProps {
  data: KlineWithIndicators[];
  indicators: IndicatorType[];
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

const BOLL_COLORS: Record<string, string> = {
  upper: '#faad14',
  mid: '#1890ff',
  lower: '#722ed1',
};

const KC_COLORS: Record<string, string> = {
  upper: '#52c41a',
  mid: '#13c2c2',
  lower: '#eb2f96',
};

/**
 * 格式化价格
 */
function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(2);
}

/**
 * 主图指标数值显示组件
 * 支持 MA、BOLL、SAR、KC 指标
 */
export function IndicatorDisplay({ data, indicators, hoverIndex }: IndicatorDisplayProps) {
  const displayData = useMemo(() => {
    const idx = hoverIndex ?? data.length - 1;
    const item = data[idx];
    if (!item) return null;
    return item;
  }, [data, hoverIndex]);

  if (!displayData) {
    return null;
  }

  // 检查是否选择了主图指标
  const showMA = indicators.includes('ma');
  const showBOLL = indicators.includes('boll');
  const showSAR = indicators.includes('sar');
  const showKC = indicators.includes('kc');

  if (!showMA && !showBOLL && !showSAR && !showKC) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* MA 指标数值 */}
      {showMA && displayData.ma && (
        <div className={styles.group}>
          {Object.keys(displayData.ma)
            .filter((key) => key.startsWith('ma') && displayData.ma?.[key] !== null && displayData.ma?.[key] !== undefined)
            .map((key) => {
              const value = displayData.ma?.[key];
              const color = MA_COLORS[key] ?? '#999';
              return (
                <span key={key} className={styles.item} style={{ color }}>
                  {key.toUpperCase()}: {formatPrice(value)}
                </span>
              );
            })}
        </div>
      )}
      
      {/* BOLL 指标数值 */}
      {showBOLL && displayData.boll && (
        <div className={styles.group}>
          <span className={styles.item} style={{ color: BOLL_COLORS.upper }}>
            UPPER: {formatPrice(displayData.boll.upper)}
          </span>
          <span className={styles.item} style={{ color: BOLL_COLORS.mid }}>
            MID: {formatPrice(displayData.boll.mid)}
          </span>
          <span className={styles.item} style={{ color: BOLL_COLORS.lower }}>
            LOWER: {formatPrice(displayData.boll.lower)}
          </span>
        </div>
      )}

      {/* SAR 指标数值 */}
      {showSAR && displayData.sar && (
        <div className={styles.group}>
          <span
            className={styles.item}
            style={{ color: displayData.sar.trend === 1 ? '#cf1322' : '#389e0d' }}
          >
            SAR: {formatPrice(displayData.sar.sar)} {displayData.sar.trend === 1 ? '↑' : '↓'}
          </span>
        </div>
      )}

      {/* KC 指标数值 */}
      {showKC && displayData.kc && (
        <div className={styles.group}>
          <span className={styles.item} style={{ color: KC_COLORS.upper }}>
            KC上: {formatPrice(displayData.kc.upper)}
          </span>
          <span className={styles.item} style={{ color: KC_COLORS.mid }}>
            KC中: {formatPrice(displayData.kc.mid)}
          </span>
          <span className={styles.item} style={{ color: KC_COLORS.lower }}>
            KC下: {formatPrice(displayData.kc.lower)}
          </span>
        </div>
      )}
    </div>
  );
}
