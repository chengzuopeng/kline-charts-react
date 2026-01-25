interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // 单条数据的自定义 TTL
}

interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
}

const defaultConfig: CacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 100, // 增加缓存容量
};

/**
 * 根据周期类型获取推荐的缓存 TTL
 * - 分时数据：30 秒（需要较实时的数据）
 * - 分钟 K 线：2 分钟
 * - 日/周/月 K 线：10 分钟（历史数据变化慢）
 */
export function getTTLByPeriod(period: string): number {
  switch (period) {
    case 'timeline':
    case 'timeline5':
      return 30 * 1000; // 30 秒
    case '1':
    case '5':
    case '15':
    case '30':
    case '60':
      return 2 * 60 * 1000; // 2 分钟
    case 'daily':
    case 'weekly':
    case 'monthly':
    default:
      return 10 * 60 * 1000; // 10 分钟
  }
}

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

    // 检查是否过期（使用条目自定义 TTL 或全局 TTL）
    const ttl = entry.ttl ?? this.config.ttl;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 可选的自定义 TTL（毫秒）
   */
  set(key: string, data: T, ttl?: number): void {
    if (!this.config.enabled) return;

    // 超过最大容量时清理过期条目和最老的条目
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
      // 如果清理后仍然超过容量，删除最老的条目
      if (this.cache.size >= this.config.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.ttl ?? this.config.ttl;
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
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
