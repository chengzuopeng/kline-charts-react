import type { IndicatorType } from '@/types';
import {
  MAIN_INDICATOR_METAS,
  SUB_INDICATOR_METAS,
  getIndicatorGroup,
} from '@/utils/indicatorMeta';
import styles from './IndicatorSelector.module.css';

interface IndicatorSelectorProps {
  value: IndicatorType[];
  onChange: (indicators: IndicatorType[]) => void;
  maxSubPanes?: number; // 最大副图数量
  maxMainIndicators?: number; // 最大主图指标数量
}

// 主图 / 副图指标列表（来自 indicatorMeta 单一数据源）
const MAIN_INDICATORS = MAIN_INDICATOR_METAS;
const SUB_INDICATORS = SUB_INDICATOR_METAS;

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
    <div className={styles.container} role="toolbar" aria-label="技术指标切换">
      {/* 主图指标 */}
      {MAIN_INDICATORS.map((indicator) => (
        <button
          key={indicator.value}
          type="button"
          className={`${styles.button} ${value.includes(indicator.value) ? styles.active : ''}`}
          onClick={() => handleToggle(indicator.value)}
          aria-pressed={value.includes(indicator.value)}
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
          aria-pressed={value.includes(indicator.value)}
        >
          {indicator.label}
        </button>
      ))}
    </div>
  );
}
