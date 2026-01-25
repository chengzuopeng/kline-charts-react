import type { PeriodType } from '@/types';
import styles from './PeriodSelector.module.css';

interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
}

interface PeriodGroup {
  label: string;
  periods: { value: PeriodType; label: string }[];
}

const PERIOD_GROUPS: PeriodGroup[] = [
  {
    label: '分时',
    periods: [
      { value: 'timeline', label: '分时' },
      { value: 'timeline5', label: '五日' },
    ],
  },
  {
    label: '周期',
    periods: [
      { value: 'daily', label: '日K' },
      { value: 'weekly', label: '周K' },
      { value: 'monthly', label: '月K' },
    ],
  },
  {
    label: '分钟',
    periods: [
      { value: '1', label: '1分' },
      { value: '5', label: '5分' },
      { value: '15', label: '15分' },
      { value: '30', label: '30分' },
      { value: '60', label: '60分' },
    ],
  },
];

/**
 * 周期选择器组件
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className={styles.container}>
      {PERIOD_GROUPS.map((group) => (
        <div key={group.label} className={styles.group}>
          {group.periods.map((period) => (
            <button
              key={period.value}
              type="button"
              className={`${styles.button} ${value === period.value ? styles.active : ''}`}
              onClick={() => onChange(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
