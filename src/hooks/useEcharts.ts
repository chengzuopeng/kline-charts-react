import { useRef, useEffect, useCallback } from 'react';
import * as echarts from 'echarts/core';
import {
  CandlestickChart,
  LineChart,
  BarChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  AxisPointerComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

// 注册必需的组件
echarts.use([
  CandlestickChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  AxisPointerComponent,
  CanvasRenderer,
]);

export type EChartsInstance = echarts.ECharts;

interface SetOptionOpts {
  notMerge?: boolean;
  lazyUpdate?: boolean;
  replaceMerge?: string[];
}

interface UseEchartsResult {
  chartRef: React.RefObject<HTMLDivElement | null>;
  chartInstance: EChartsInstance | null;
  setOption: (option: EChartsOption, opts?: boolean | SetOptionOpts, lazyUpdate?: boolean) => void;
  resize: () => void;
  dispose: () => void;
  getDataURL: (opts?: { type?: 'png' | 'jpeg'; pixelRatio?: number; backgroundColor?: string }) => string;
  bindEvent: (eventName: string, handler: (params: unknown) => void) => () => void;
}

/**
 * ECharts 实例管理 Hook
 */
export function useEcharts(): UseEchartsResult {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<EChartsInstance | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return;

    // 创建实例
    instanceRef.current = echarts.init(chartRef.current);

    // 监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  // 设置配置
  const setOption = useCallback(
    (option: EChartsOption, opts?: boolean | SetOptionOpts, lazyUpdate = false) => {
      // 兼容旧的 boolean 参数形式
      let finalOpts: SetOptionOpts;
      if (typeof opts === 'boolean') {
        finalOpts = { notMerge: opts, lazyUpdate };
      } else {
        finalOpts = opts ?? {};
      }
      instanceRef.current?.setOption(option, finalOpts);
    },
    []
  );

  // 调整大小
  const resize = useCallback(() => {
    instanceRef.current?.resize();
  }, []);

  // 销毁实例
  const dispose = useCallback(() => {
    instanceRef.current?.dispose();
    instanceRef.current = null;
  }, []);

  // 导出图片
  const getDataURL = useCallback(
    (opts?: { type?: 'png' | 'jpeg'; pixelRatio?: number; backgroundColor?: string }) => {
      if (!instanceRef.current) return '';
      return instanceRef.current.getDataURL({
        type: opts?.type ?? 'png',
        pixelRatio: opts?.pixelRatio ?? 2,
        backgroundColor: opts?.backgroundColor ?? '#fff',
      });
    },
    []
  );

  // 绑定事件
  const bindEvent = useCallback(
    (eventName: string, handler: (params: unknown) => void) => {
      const instance = instanceRef.current;
      if (!instance) {
        return () => {};
      }
      instance.on(eventName, handler);
      return () => {
        instance.off(eventName, handler);
      };
    },
    []
  );

  return {
    chartRef,
    chartInstance: instanceRef.current,
    setOption,
    resize,
    dispose,
    getDataURL,
    bindEvent,
  };
}
