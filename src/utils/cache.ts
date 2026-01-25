interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

const defaultConfig: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 50,
};

/**
 * 简单的内存缓存
 */
export class DataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 生成缓存 key
   */
  static buildKey(params: Record<string, unknown>): string {
    return Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join('|');
  }

  /**
   * 获取缓存
   */
  get(key: string): T | undefined {
    if (!this.config.enabled) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T): void {
    if (!this.config.enabled) return;

    // 超过最大容量时清理最老的条目
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 全局数据缓存实例
 */
export const dataCache = new DataCache<unknown>();
