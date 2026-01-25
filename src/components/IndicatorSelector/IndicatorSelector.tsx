import type { IndicatorType } from '@/types';
import styles from './IndicatorSelector.module.css';

interface IndicatorSelectorProps {
  value: IndicatorType[];
  onChange: (indicators: IndicatorType[]) => void;
  maxSubPanes?: number; // 最大副图数量
  maxMainIndicators?: number; // 最大主图指标数量
}

interface IndicatorItem {
  value: IndicatorType;
  label: string;
  group: 'main' | 'sub';
}

// 主图指标
const MAIN_INDICATORS: IndicatorItem[] = [
  { value: 'ma', label: 'MA', group: 'main' },
  { value: 'boll', label: 'BOLL', group: 'main' },
  { value: 'sar', label: 'SAR', group: 'main' },
  { value: 'kc', label: 'KC', group: 'main' },
];

// 副图指标
const SUB_INDICATORS: IndicatorItem[] = [
  { value: 'volume', label: '成交量', group: 'sub' },
  { value: 'macd', label: 'MACD', group: 'sub' },
  { value: 'kdj', label: 'KDJ', group: 'sub' },
  { value: 'rsi', label: 'RSI', group: 'sub' },
  { value: 'wr', label: 'WR', group: 'sub' },
  { value: 'bias', label: 'BIAS', group: 'sub' },
  { value: 'cci', label: 'CCI', group: 'sub' },
  { value: 'atr', label: 'ATR', group: 'sub' },
  { value: 'obv', label: 'OBV', group: 'sub' },
  { value: 'roc', label: 'ROC', group: 'sub' },
  { value: 'dmi', label: 'DMI', group: 'sub' },
];

// 获取指标分组
function getIndicatorGroup(indicator: IndicatorType): 'main' | 'sub' {
  const mainItem = MAIN_INDICATORS.find((i) => i.value === indicator);
  return mainItem ? 'main' : 'sub';
}

/**
 * 指标选择器组件
 */
export function IndicatorSelector({
  value,
  onChange,
  maxSubPanes = 3,
  maxMainIndicators = 2,
}: IndicatorSelectorProps) {
  const handleToggle = (indicator: IndicatorType) => {
    const group = getIndicatorGroup(indicator);
    
    if (value.includes(indicator)) {
      // 取消选中
      onChange(value.filter((v) => v !== indicator));
    } else {
      // 新增选中
      if (group === 'main') {
        // 主图指标，检查数量限制（最多 2 个）
        const currentMainIndicators = value.filter((v) => getIndicatorGroup(v) === 'main');
        
        if (currentMainIndicators.length >= maxMainIndicators) {
          // 已达到最大数量，移除最后选中的主图指标，添加新的
          const lastMainIndicator = currentMainIndicators[currentMainIndicators.length - 1]!;
          const newValue = value.filter((v) => v !== lastMainIndicator);
          onChange([...newValue, indicator]);
        } else {
          onChange([...value, indicator]);
        }
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
      {/* 主图指标 */}
      {MAIN_INDICATORS.map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          className={`${styles.button} ${value.includes(indicator.value) ? styles.active : ''}`}
          onClick={() => handleToggle(indicator.value)}
        >
          {indicator.label}
        </button>
      ))}
      
      {/* 分隔线 */}
      <div className={styles.divider} />
      
      {/* 副图指标 */}
      {SUB_INDICATORS.map((indicator) => (
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
