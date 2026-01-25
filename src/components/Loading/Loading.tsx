import styles from './Loading.module.css';

interface LoadingProps {
  text?: string;
}

/**
 * 加载状态组件
 */
export function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
