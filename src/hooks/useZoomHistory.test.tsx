import { act, renderHook } from '@testing-library/react';
import { useZoomHistory } from './useZoomHistory';

describe('useZoomHistory', () => {
  it('starts with the initial state and no undo/redo available', () => {
    const { result } = renderHook(() => useZoomHistory({ start: 0, end: 100 }));
    expect(result.current.currentState).toEqual({ start: 0, end: 100 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushes states and walks history with undo / redo', () => {
    const { result } = renderHook(() => useZoomHistory({ start: 0, end: 100 }));

    act(() => result.current.pushState({ start: 10, end: 90 }));
    act(() => result.current.pushState({ start: 20, end: 80 }));

    expect(result.current.currentState).toEqual({ start: 20, end: 80 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });
    expect(result.current.currentState).toEqual({ start: 10, end: 90 });
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });
    expect(result.current.currentState).toEqual({ start: 20, end: 80 });
  });

  it('skips no-op pushes', () => {
    const { result } = renderHook(() => useZoomHistory({ start: 0, end: 100 }));
    act(() => result.current.pushState({ start: 0, end: 100 }));
    expect(result.current.canUndo).toBe(false);
  });

  it('discards forward history when pushing after undo', () => {
    const { result } = renderHook(() => useZoomHistory({ start: 0, end: 100 }));
    act(() => result.current.pushState({ start: 10, end: 90 }));
    act(() => result.current.pushState({ start: 20, end: 80 }));
    act(() => {
      result.current.undo();
    });
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.pushState({ start: 30, end: 70 }));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.currentState).toEqual({ start: 30, end: 70 });
  });

  it('reset replaces history with a single entry', () => {
    const { result } = renderHook(() => useZoomHistory({ start: 0, end: 100 }));
    act(() => result.current.pushState({ start: 10, end: 90 }));
    act(() => result.current.reset({ start: 5, end: 95 }));
    expect(result.current.currentState).toEqual({ start: 5, end: 95 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
