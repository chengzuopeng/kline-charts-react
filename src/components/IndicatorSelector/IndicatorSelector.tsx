import type { IndicatorType } from '@/types';
import styles from './IndicatorSelector.module.css';

interface IndicatorSelectorProps {
  value: IndicatorType[];
  onChange: (indicators: IndicatorType[]) => void;
  maxSubPanes?: number; // 最大副图数量
}

interface IndicatorItem {
  value: IndicatorType;
  label: string;
  group: 'main' | 'sub';
}

const INDICATORS: IndicatorItem[] = [
  { value: 'ma', label: 'MA', group: 'main' },
  { value: 'boll', label: 'BOLL', group: 'main' },
  { value: 'volume', label: '成交量', group: 'sub' },
  { value: 'macd', label: 'MACD', group: 'sub' },
  { value: 'kdj', label: 'KDJ', group: 'sub' },
  { value: 'rsi', label: 'RSI', group: 'sub' },
  { value: 'wr', label: 'WR', group: 'sub' },
  { value: 'bias', label: 'BIAS', group: 'sub' },
  { value: 'cci', label: 'CCI', group: 'sub' },
  { value: 'atr', label: 'ATR', group: 'sub' },
];

// 获取指标分组
function getIndicatorGroup(indicator: IndicatorType): 'main' | 'sub' {
  const item = INDICATORS.find((i) => i.value === indicator);
  return item?.group ?? 'sub';
}

/**
 * 指标选择器组件
 */
export function IndicatorSelector({ value, onChange, maxSubPanes = 3 }: IndicatorSelectorProps) {
  const handleToggle = (indicator: IndicatorType) => {
    const group = getIndicatorGroup(indicator);
    
    if (value.includes(indicator)) {
      // 取消选中
      onChange(value.filter((v) => v !== indicator));
    } else {
      // 新增选中
      if (group === 'main') {
        // 主图指标直接添加
        onChange([...value, indicator]);
      } else {
        // 副图指标，检查数量限制
        const currentSubIndicators = value.filter((v) => getIndicatorGroup(v) === 'sub');
        
        if (currentSubIndicators.length >= maxSubPanes) {
          // 已达到最大数量，移除最后选中的副图指标，添加新的
          const lastSubIndicator = currentSubIndicators[currentSubIndicators.length - 1]!;
          const newValue = value.filter((v) => v !== lastSubIndicator);
          onChange([...newValue, indicator]);
        } else {
          onChange([...value, indicator]);
        }
      }
    }
  };

  return (
    <div className={styles.container}>
      {INDICATORS.map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          className={`${styles.button} ${value.includes(indicator.value) ? styles.active : ''}`}
          onClick={() => handleToggle(indicator.value)}
        >
          {indicator.label}
        </button>
      ))}
    </div>
  );
}
