import { useState, useEffect, useCallback, useRef } from 'react';
import { StockSDK } from 'stock-sdk';
import type {
  KlineData,
  KlineWithIndicators,
  TimelineData,
  PeriodType,
  MarketType,
  AdjustType,
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
} from '@/utils/indicators';
import { DataCache } from '@/utils/cache';

interface UseKlineDataParams {
  symbol: string;
  market: MarketType;
  period: PeriodType;
  adjust: AdjustType;
  dataProvider?: KLineDataProvider;
  sdkOptions?: SDKOptions;
  requestOptions?: RequestOptions;
  indicatorOptions?: IndicatorOptions;
  indicators?: string[];
}

interface UseKlineDataResult {
  data: KlineWithIndicators[];
  timelineData: TimelineData[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const cache = new DataCache<KlineData[]>();

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
          adjust: adjust || 'hfq',
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
            adjust: adjust || 'hfq',
          });
          return result;
        }
        case 'US': {
          const result = await sdk.getUSHistoryKline(symbol, {
            period: klinePeriod,
            adjust: adjust || 'hfq',
          });
          return result;
        }
        default: {
          const result = await sdk.getHistoryKline(symbol, {
            period: klinePeriod,
            adjust: adjust || 'hfq',
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

/**
 * 为 K 线数据添加技术指标
 */
function addIndicators(
  data: KlineData[],
  indicators: string[],
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
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<KLineDataProvider | null>(null);

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
    // 取消之前的请求
    if (requestOptions?.abortOnChange !== false && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();

      // 检查缓存
      const cacheKey = DataCache.buildKey({ symbol, market, period, adjust });
      const cachedData = cache.get(cacheKey) as KlineData[] | undefined;

      let klineData: KlineData[];

      if (cachedData && requestOptions?.dedupe !== false) {
        klineData = cachedData;
      } else {
        klineData = await provider.getKline(
          { symbol, market, period, adjust },
          controller.signal
        );
        cache.set(cacheKey, klineData);
      }

      // 检查是否已取消
      if (controller.signal.aborted) return;

      setRawData(klineData);

      // 如果是分时周期，同时获取分时数据
      if (period === 'timeline' && provider.getTimeline) {
        const timeline = await provider.getTimeline({ symbol, market }, controller.signal);
        if (!controller.signal.aborted) {
          setTimelineData(timeline);
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
    const cacheKey = DataCache.buildKey({ symbol, market, period, adjust });
    cache.delete(cacheKey);
    await loadData();
  }, [symbol, market, period, adjust, loadData]);

  // 监听参数变化 - 直接监听核心参数，避免 useCallback 依赖问题
  useEffect(() => {
    // 防抖处理
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const debounceMs = requestOptions?.debounceMs ?? 0;
    if (debounceMs > 0) {
      debounceTimerRef.current = setTimeout(loadData, debounceMs);
    } else {
      loadData();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // 显式监听核心参数，确保复权等参数变化时触发重新加载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, market, period, adjust, loadData, requestOptions?.debounceMs]);

  // 计算带指标的数据
  const data = addIndicators(rawData, indicators, indicatorOptions);

  return { data, timelineData, loading, error, refresh };
}
