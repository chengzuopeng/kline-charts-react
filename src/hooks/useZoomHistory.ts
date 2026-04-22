import { useCallback, useState } from 'react';

interface ZoomState {
  start: number;
  end: number;
}

interface ZoomHistoryState {
  history: ZoomState[];
  index: number;
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

function isSameState(a: ZoomState, b: ZoomState): boolean {
  return a.start === b.start && a.end === b.end;
}

/**
 * 缩放历史管理 Hook（支持撤销/重做）
 */
export function useZoomHistory(initialState: ZoomState = DEFAULT_STATE): UseZoomHistoryResult {
  const [zoomHistory, setZoomHistory] = useState<ZoomHistoryState>({
    history: [initialState],
    index: 0,
  });

  const currentState = zoomHistory.history[zoomHistory.index] ?? initialState;

  const pushState = useCallback((state: ZoomState) => {
    setZoomHistory((prev) => {
      const current = prev.history[prev.index];
      if (current && isSameState(current, state)) {
        return prev;
      }

      let nextHistory = prev.history.slice(0, prev.index + 1);
      nextHistory = [...nextHistory, state];

      if (nextHistory.length > MAX_HISTORY) {
        nextHistory = nextHistory.slice(nextHistory.length - MAX_HISTORY);
      }

      return {
        history: nextHistory,
        index: nextHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    let nextState: ZoomState | null = null;

    setZoomHistory((prev) => {
      if (prev.index === 0) {
        return prev;
      }

      const nextIndex = prev.index - 1;
      nextState = prev.history[nextIndex] ?? null;

      return {
        ...prev,
        index: nextIndex,
      };
    });

    return nextState;
  }, []);

  const redo = useCallback(() => {
    let nextState: ZoomState | null = null;

    setZoomHistory((prev) => {
      if (prev.index >= prev.history.length - 1) {
        return prev;
      }

      const nextIndex = prev.index + 1;
      nextState = prev.history[nextIndex] ?? null;

      return {
        ...prev,
        index: nextIndex,
      };
    });

    return nextState;
  }, []);

  const reset = useCallback((state: ZoomState = initialState) => {
    setZoomHistory({
      history: [state],
      index: 0,
    });
  }, [initialState]);

  return {
    canUndo: zoomHistory.index > 0,
    canRedo: zoomHistory.index < zoomHistory.history.length - 1,
    currentState,
    pushState,
    undo,
    redo,
    reset,
  };
}
