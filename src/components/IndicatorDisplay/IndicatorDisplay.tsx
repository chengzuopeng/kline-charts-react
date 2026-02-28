import { useMemo } from 'react';
import type { KlineWithIndicators, IndicatorType, ThemeConfig } from '@/types';
import { formatPrice } from '@/utils/formatters';
import styles from './IndicatorDisplay.module.css';

interface IndicatorDisplayProps {
  data: KlineWithIndicators[];
  indicators: IndicatorType[];
  hoverIndex?: number | null;
  theme: ThemeConfig;
}

/**
 * 主图指标数值显示组件
 * 支持 MA、BOLL、SAR、KC 指标
 */
export function IndicatorDisplay({ data, indicators, hoverIndex, theme }: IndicatorDisplayProps) {
  const maColors = theme.maColors;
  const bollColors = theme.bollColors;
  const kcColors = theme.kcColors;
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
            .map((key, i) => {
              const value = displayData.ma?.[key];
              const color = maColors[i] ?? '#999';
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
          <span className={styles.item} style={{ color: bollColors[0] }}>
            UPPER: {formatPrice(displayData.boll.upper)}
          </span>
          <span className={styles.item} style={{ color: bollColors[1] }}>
            MID: {formatPrice(displayData.boll.mid)}
          </span>
          <span className={styles.item} style={{ color: bollColors[2] }}>
            LOWER: {formatPrice(displayData.boll.lower)}
          </span>
        </div>
      )}

      {/* SAR 指标数值 */}
      {showSAR && displayData.sar && (
        <div className={styles.group}>
          <span
            className={styles.item}
            style={{ color: displayData.sar.trend === 1 ? theme.upColor : theme.downColor }}
          >
            SAR: {formatPrice(displayData.sar.sar)} {displayData.sar.trend === 1 ? '↑' : '↓'}
          </span>
        </div>
      )}

      {/* KC 指标数值 */}
      {showKC && displayData.kc && (
        <div className={styles.group}>
          <span className={styles.item} style={{ color: kcColors[0] }}>
            KC上: {formatPrice(displayData.kc.upper)}
          </span>
          <span className={styles.item} style={{ color: kcColors[1] }}>
            KC中: {formatPrice(displayData.kc.mid)}
          </span>
          <span className={styles.item} style={{ color: kcColors[2] }}>
            KC下: {formatPrice(displayData.kc.lower)}
          </span>
        </div>
      )}
    </div>
  );
}
