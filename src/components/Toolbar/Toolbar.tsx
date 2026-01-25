import type { AdjustType } from '@/types';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  adjust: AdjustType;
  onAdjustChange: (adjust: AdjustType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onReset: () => void;
  onFullscreen?: () => void;
}

const ADJUST_OPTIONS: { value: AdjustType; label: string }[] = [
  { value: '', label: '不复权' },
  { value: 'qfq', label: '前复权' },
  { value: 'hfq', label: '后复权' },
];

/**
 * 工具栏组件
 */
export function Toolbar({
  adjust,
  onAdjustChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onReset,
  onFullscreen,
}: ToolbarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onRedo}
          disabled={!canRedo}
          title="重做"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
          </svg>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onZoomIn}
          title="放大"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onZoomOut}
          title="缩小"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onPanLeft}
          title="向左"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onPanRight}
          title="向右"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <button
          type="button"
          className={styles.textButton}
          onClick={onReset}
          title="重置"
        >
          重置
        </button>
      </div>

      <div className={styles.spacer} />

      <div className={styles.group}>
        {ADJUST_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.textButton} ${adjust === option.value ? styles.active : ''}`}
            onClick={() => onAdjustChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {onFullscreen && (
        <>
          <div className={styles.divider} />
          <button
            type="button"
            className={styles.iconButton}
            onClick={onFullscreen}
            title="全屏"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
