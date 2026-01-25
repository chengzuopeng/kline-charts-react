import { useState, useCallback, useRef } from 'react';

interface ZoomState {
  start: number;
  end: number;
}

interface UseZoomHistoryResult {
  canUndo: boolean;
  canRedo: boolean;
  currentState: ZoomState;
  pushState: (state: ZoomState) => void;
  undo: () => ZoomState | null;
  redo: () => ZoomState | null;
  reset: (state?: ZoomState) => void;
}

const DEFAULT_STATE: ZoomState = { start: 70, end: 100 };
const MAX_HISTORY = 50;

/**
 * 缩放历史管理 Hook（支持撤销/重做）
 */
export function useZoomHistory(initialState: ZoomState = DEFAULT_STATE): UseZoomHistoryResult {
  const historyRef = useRef<ZoomState[]>([initialState]);
  const indexRef = useRef(0);
  const [, forceUpdate] = useState({});

  const currentState = historyRef.current[indexRef.current] ?? initialState;

  const pushState = useCallback((state: ZoomState) => {
    // 如果不在历史末尾，删除后面的记录
    if (indexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    }

    // 限制历史记录数量
    if (historyRef.current.length >= MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(1);
    }

    historyRef.current.push(state);
    indexRef.current = historyRef.current.length - 1;
    forceUpdate({});
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--;
      forceUpdate({});
      return historyRef.current[indexRef.current] ?? null;
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      forceUpdate({});
      return historyRef.current[indexRef.current] ?? null;
    }
    return null;
  }, []);

  const reset = useCallback((state: ZoomState = initialState) => {
    historyRef.current = [state];
    indexRef.current = 0;
    forceUpdate({});
  }, [initialState]);

  return {
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
    currentState,
    pushState,
    undo,
    redo,
    reset,
  };
}
