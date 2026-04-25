import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StockSDK } from 'stock-sdk';
import type {
  KlineData,
  KlineWithIndicators,
  TimelineData,
  PeriodType,
  MarketType,
  AdjustType,
  IndicatorType,
  KLineDataProvider,
  SDKOptions,
  RequestOptions,
  IndicatorOptions,
} from '@/types';
import {
  calcMA,
  calcMACD,
  calcBOLL,
  calcKDJ,
  calcRSI,
  calcWR,
  calcBIAS,
  calcCCI,
  calcATR,
  calcOBV,
  calcROC,
  calcDMI,
  calcSAR,
  calcKC,
} from '@/utils/indicators';
import { DataCache, getTTLByPeriod } from '@/utils/cache';

interface UseKlineDataParams {
  symbol: string;
  market: MarketType;
  period: PeriodType;
  adjust: AdjustType;
  dataProvider?: KLineDataProvider;
  sdkOptions?: SDKOptions;
  requestOptions?: RequestOptions;
  indicatorOptions?: IndicatorOptions;
  indicators?: IndicatorType[];
}

interface UseKlineDataResult {
  data: KlineWithIndicators[];
  timelineData: TimelineData[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const klineCache = new DataCache<KlineData[]>();
const timelineCache = new DataCache<TimelineData[]>();

// 请求去重：存储正在进行中的请求 Promise
const pendingKlineRequests = new Map<string, Promise<KlineData[]>>();
const pendingTimelineRequests = new Map<string, Promise<TimelineData[]>>();

/**
 * 默认防抖时间（毫秒）
 * 避免快速切换参数时发起过多请求
 */
const DEFAULT_DEBOUNCE_MS = 150;

/**
 * loadMore 每次请求的历史数据条数
 */
const LOAD_MORE_LIMIT = 180;

/**
 * 创建默认的数据提供者（基于 stock-sdk）
 */
function createDefaultProvider(sdkOptions?: SDKOptions): KLineDataProvider {
  const sdk = new StockSDK(sdkOptions);

  return {
    getKline: async (params) => {
      const { symbol, market, period, adjust } = params;

      // 分时数据
      if (period === 'timeline') {
        const response = await sdk.getTodayTimeline(symbol);
        return response.data.map((item) => ({
          date: `${response.date.slice(0, 4)}-${response.date.slice(4, 6)}-${response.date.slice(6, 8)} ${item.time}`,
          open: item.price,
          close: item.price,
          high: item.price,
          low: item.price,
          volume: item.volume,
          amount: item.amount,
        }));
      }

      // 五日分时数据（使用1分钟K线获取最近5天数据）
      if (period === 'timeline5') {
        // 计算5天前的日期
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // 多取几天以覆盖周末
        
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const result = await sdk.getMinuteKline(symbol, {
          period: '1',
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
        });
        
        return result.map((item) => ({
          date: 'time' in item ? item.time : '',
          open: item.open,
          close: item.close,
          high: item.high,
          low: item.low,
          volume: item.volume,
          amount: item.amount,
        }));
      }

      // 分钟 K 线
      if (['1', '5', '15', '30', '60'].includes(period)) {
        const result = await sdk.getMinuteKline(symbol, {
          period: period as '1' | '5' | '15' | '30' | '60',
          adjust: adjust || 'qfq',
        });
        
        let mappedData = result.map((item) => ({
          date: 'time' in item ? item.time : '',
          open: item.open,
          close: item.close,
          high: item.high,
          low: item.low,
          volume: item.volume,
          amount: item.amount,
          changePercent: 'changePercent' in item ? item.changePercent : undefined,
          change: 'change' in item ? item.change : undefined,
          amplitude: 'amplitude' in item ? item.amplitude : undefined,
          turnoverRate: 'turnoverRate' in item ? item.turnoverRate : undefined,
        }));
        
        // 1分钟K线只保留最近一个交易日
        if (period === '1' && mappedData.length > 0) {
          // 获取最后一条数据的日期
          const lastDate = mappedData[mappedData.length - 1]!.date.split(' ')[0];
          mappedData = mappedData.filter((d) => d.date.startsWith(lastDate!));
        }
        
        return mappedData;
      }

      // 日/周/月 K 线
      const periodMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
        daily: 'daily',
        weekly: 'weekly',
        monthly: 'monthly',
      };

      const klinePeriod = periodMap[period] ?? 'daily';

      switch (market) {
        case 'HK': {
          const result = await sdk.getHKHistoryKline(symbol, {
            period: klinePeriod,
            adjust: adjust || 'qfq',
          });
          return result;
        }
        case 'US': {
          const result = await sdk.getUSHistoryKline(symbol, {
            period: klinePeriod,
            adjust: adjust || 'qfq',
          });
          return result;
        }
        default: {
          const result = await sdk.getHistoryKline(symbol, {
            period: klinePeriod,
            adjust: adjust || 'qfq',
          });
          return result;
        }
      }
    },
    getTimeline: async (params) => {
      const response = await sdk.getTodayTimeline(params.symbol);
      return response.data;
    },
  };
}

function buildKlineCacheKey(params: {
  symbol: string;
  market: MarketType;
  period: PeriodType;
  adjust: AdjustType;
}) {
  return DataCache.buildKey(params);
}

function buildTimelineCacheKey(params: { symbol: string; market: MarketType; type?: 'timeline' | 'timeline5' }) {
  return DataCache.buildKey({ ...params, type: params.type ?? 'timeline' });
}

/**
 * 为 K 线数据添加技术指标
 */
function addIndicators(
  data: KlineData[],
  indicators: IndicatorType[],
  options: IndicatorOptions = {}
): KlineWithIndicators[] {
  if (data.length === 0) return [];

  const closes = data.map((d) => d.close);
  const ohlcv = data.map((d) => ({
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  }));

  // 计算各指标
  const maResult = indicators.includes('ma')
    ? calcMA(closes, typeof options.ma === 'object' ? options.ma : {})
    : null;

  const macdResult = indicators.includes('macd')
    ? calcMACD(closes, typeof options.macd === 'object' ? options.macd : {})
    : null;

  const bollResult = indicators.includes('boll')
    ? calcBOLL(closes, typeof options.boll === 'object' ? options.boll : {})
    : null;

  const kdjResult = indicators.includes('kdj')
    ? calcKDJ(ohlcv, typeof options.kdj === 'object' ? options.kdj : {})
    : null;

  const rsiResult = indicators.includes('rsi')
    ? calcRSI(closes, typeof options.rsi === 'object' ? options.rsi : {})
    : null;

  const wrResult = indicators.includes('wr')
    ? calcWR(ohlcv, typeof options.wr === 'object' ? options.wr : {})
    : null;

  const biasResult = indicators.includes('bias')
    ? calcBIAS(closes, typeof options.bias === 'object' ? options.bias : {})
    : null;

  const cciResult = indicators.includes('cci')
    ? calcCCI(ohlcv, typeof options.cci === 'object' ? options.cci : {})
    : null;

  const atrResult = indicators.includes('atr')
    ? calcATR(ohlcv, typeof options.atr === 'object' ? options.atr : {})
    : null;

  const obvResult = indicators.includes('obv')
    ? calcOBV(ohlcv, typeof options.obv === 'object' ? options.obv : {})
    : null;

  const rocResult = indicators.includes('roc')
    ? calcROC(closes, typeof options.roc === 'object' ? options.roc : {})
    : null;

  const dmiResult = indicators.includes('dmi')
    ? calcDMI(ohlcv, typeof options.dmi === 'object' ? options.dmi : {})
    : null;

  const sarResult = indicators.includes('sar')
    ? calcSAR(ohlcv, typeof options.sar === 'object' ? options.sar : {})
    : null;

  const kcResult = indicators.includes('kc')
    ? calcKC(ohlcv, typeof options.kc === 'object' ? options.kc : {})
    : null;

  // 合并结果
  return data.map((item, i) => ({
    ...item,
    ma: maResult?.[i],
    macd: macdResult?.[i],
    boll: bollResult?.[i],
    kdj: kdjResult?.[i],
    rsi: rsiResult?.[i],
    wr: wrResult?.[i],
    bias: biasResult?.[i],
    cci: cciResult?.[i],
    atr: atrResult?.[i],
    obv: obvResult?.[i],
    roc: rocResult?.[i],
    dmi: dmiResult?.[i],
    sar: sarResult?.[i],
    kc: kcResult?.[i],
  }));
}

/**
 * K 线数据获取 Hook
 */
export function useKlineData(params: UseKlineDataParams): UseKlineDataResult {
  const {
    symbol,
    market,
    period,
    adjust,
    dataProvider,
    sdkOptions,
    requestOptions,
    indicatorOptions,
    indicators = ['ma', 'volume', 'macd'],
  } = params;

  const [rawData, setRawData] = useState<KlineData[]>([]);
  const [timelineState, setTimelineState] = useState<{ key: string; data: TimelineData[] }>({
    key: '',
    data: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<KLineDataProvider | null>(null);
  const requestIdRef = useRef(0);
  const loadMoreLimitRef = useRef(requestOptions?.loadMoreLimit ?? LOAD_MORE_LIMIT);
  useEffect(() => {
    loadMoreLimitRef.current = requestOptions?.loadMoreLimit ?? LOAD_MORE_LIMIT;
  }, [requestOptions?.loadMoreLimit]);
  const paramsRef = useRef({ symbol, market, period, adjust });
  useEffect(() => {
    paramsRef.current = { symbol, market, period, adjust };
  }, [symbol, market, period, adjust]);

  useEffect(() => {
    if (!dataProvider) {
      providerRef.current = null;
    }
  }, [dataProvider, sdkOptions]);

  // 获取或创建 provider
  const getProvider = useCallback(() => {
    if (dataProvider) return dataProvider;
    if (!providerRef.current) {
      providerRef.current = createDefaultProvider(sdkOptions);
    }
    return providerRef.current;
  }, [dataProvider, sdkOptions]);

  // 加载数据
  const loadData = useCallback(async () => {
    // 切换参数时清空旧数据，避免显示上一个周期的残留数据
    setRawData([]);
    setTimelineState({ key: '', data: [] });
    setHasMore(true);

    // 取消之前的请求
    if (requestOptions?.abortOnChange !== false && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    abortControllerRef.current = controller;
    const useDedupe = requestOptions?.dedupe !== false;
    const isActiveRequest = () => requestId === requestIdRef.current && !controller.signal.aborted;

    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const klineCacheKey = buildKlineCacheKey({ symbol, market, period, adjust });
      const timelineCacheKey = buildTimelineCacheKey({ symbol, market });
      const ttl = getTTLByPeriod(period);

      let klineData = useDedupe ? klineCache.get(klineCacheKey) : undefined;
      if (!klineData) {
        const pendingRequest = useDedupe ? pendingKlineRequests.get(klineCacheKey) : undefined;
        if (pendingRequest) {
          try {
            klineData = await pendingRequest;
          } catch {
            // 复用的请求失败，忽略错误（会由原始请求处理）
          }
        } else {
          const requestPromise = provider.getKline(
            { symbol, market, period, adjust },
            controller.signal
          );

          pendingKlineRequests.set(klineCacheKey, requestPromise);

          try {
            klineData = await requestPromise;
          } finally {
            pendingKlineRequests.delete(klineCacheKey);
          }
        }
      }

      if (!isActiveRequest() || !klineData) return;

      klineCache.set(klineCacheKey, klineData, ttl);
      setRawData(klineData);

      if (period === 'timeline' && provider.getTimeline) {
        let nextTimelineData = useDedupe ? timelineCache.get(timelineCacheKey) : undefined;

        if (!nextTimelineData) {
          setTimelineState({ key: timelineCacheKey, data: [] });

          const pendingTimelineRequest = useDedupe
            ? pendingTimelineRequests.get(timelineCacheKey)
            : undefined;
          if (pendingTimelineRequest) {
            try {
              nextTimelineData = await pendingTimelineRequest;
            } catch {
              // 复用的请求失败，忽略错误（会由原始请求处理）
            }
          } else {
            const timelineRequest = provider.getTimeline({ symbol, market }, controller.signal);
            pendingTimelineRequests.set(timelineCacheKey, timelineRequest);

            try {
              nextTimelineData = await timelineRequest;
            } finally {
              pendingTimelineRequests.delete(timelineCacheKey);
            }
          }
        }

        if (isActiveRequest() && nextTimelineData) {
          timelineCache.set(timelineCacheKey, nextTimelineData, ttl);
          setTimelineState({ key: timelineCacheKey, data: nextTimelineData });
        }
      } else if (period === 'timeline5') {
        // VWAP 计算，按交易日重置
        let cumAmount = 0;
        let cumVolume = 0;
        let prevDate = '';
        const timeline: TimelineData[] = klineData
          .filter((d) => d.date && d.date.length >= 10)
          .map((d) => {
            const dateStr = d.date.slice(0, 10);
            if (dateStr !== prevDate) {
              cumAmount = 0;
              cumVolume = 0;
              prevDate = dateStr;
            }
            const vol = d.volume ?? 0;
            const amt = d.amount ?? 0;
            cumAmount += amt;
            cumVolume += vol;
            return {
              time: d.date,
              price: d.close ?? 0,
              volume: cumVolume,
              amount: cumAmount,
              avgPrice: cumVolume > 0 ? cumAmount / cumVolume : (d.close ?? 0),
            };
          });
        if (isActiveRequest()) {
          const timeline5CacheKey = buildTimelineCacheKey({ symbol, market, type: 'timeline5' });
          timelineCache.set(timeline5CacheKey, timeline, ttl);
          setTimelineState({ key: timeline5CacheKey, data: timeline });
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err as Error);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [symbol, market, period, adjust, getProvider, requestOptions]);

  // 刷新方法
  const refresh = useCallback(async () => {
    // 清除缓存
    const klineCacheKey = buildKlineCacheKey({ symbol, market, period, adjust });
    klineCache.delete(klineCacheKey);

    if (period === 'timeline') {
      timelineCache.delete(buildTimelineCacheKey({ symbol, market }));
      setTimelineState({ key: '', data: [] });
    } else if (period === 'timeline5') {
      const timeline5CacheKey = buildTimelineCacheKey({ symbol, market, type: 'timeline5' });
      timelineCache.delete(timeline5CacheKey);
      setTimelineState({ key: '', data: [] });
    }
    setHasMore(true);
    setLoading(true);

    await loadData();
  }, [symbol, market, period, adjust, loadData]);

  // 监听参数变化 - 直接监听核心参数，避免 useCallback 依赖问题
  useEffect(() => {
    // 立即清空旧数据，不等 debounce
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stable setState, safe to call
    setRawData([]);
    setTimelineState({ key: '', data: [] });
    setHasMore(true);

    // 防抖处理（默认启用 150ms 防抖，减少快速切换时的请求）
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const debounceMs = requestOptions?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    debounceTimerRef.current = setTimeout(loadData, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, market, period, adjust, loadData, requestOptions?.debounceMs]);

  // 加载更多历史数据（向左滚动触发）
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    if (rawData.length === 0) return;
    const isKline = ['daily', 'weekly', 'monthly'].includes(period);
    if (!isKline) return;

    // 快照当前参数，用于异步完成后校验
    const snapshot = { ...paramsRef.current };

    setLoadingMore(true);
    try {
      const provider = getProvider();
      const earliestDate = rawData[0]?.date;
      if (!earliestDate) return;

      const olderData = await provider.getKline(
        { symbol, market, period, adjust, cursor: earliestDate, limit: loadMoreLimitRef.current },
      );

      // 参数已变化，丢弃结果
      const current = paramsRef.current;
      if (snapshot.symbol !== current.symbol || snapshot.market !== current.market || snapshot.period !== current.period || snapshot.adjust !== current.adjust) return;

      if (olderData.length === 0) {
        setHasMore(false);
        return;
      }

      const filtered = olderData.filter((d) => d.date < earliestDate);

      if (filtered.length === 0) {
        setHasMore(false);
        return;
      }

      const merged = [...filtered, ...rawData];
      const klineCacheKey = buildKlineCacheKey({ symbol, market, period, adjust });
      klineCache.set(klineCacheKey, merged, getTTLByPeriod(period));
      setRawData(merged);
    } catch (e) {
      // 加载更多失败不阻塞，但记录错误
      console.warn('loadMore failed:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, rawData, period, symbol, market, adjust, getProvider]);

  // 计算带指标的数据（仅在原始数据、指标列表或指标参数变化时重算）
  const data = useMemo(
    () => addIndicators(rawData, indicators, indicatorOptions),
    [rawData, indicators, indicatorOptions]
  );

  const activeTimelineKey = period === 'timeline'
    ? buildTimelineCacheKey({ symbol, market })
    : period === 'timeline5'
      ? buildTimelineCacheKey({ symbol, market, type: 'timeline5' })
      : '';
  const timelineData = timelineState.key === activeTimelineKey ? timelineState.data : [];

  return { data, timelineData, loading, loadingMore, error, hasMore, refresh, loadMore };
}
