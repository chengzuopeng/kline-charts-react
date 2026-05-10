import { act, renderHook } from '@testing-library/react';
import { useControllableValue } from './controllable';

describe('useControllableValue', () => {
  it('uses defaultValue and updates internal state when uncontrolled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableValue<string>({ value: undefined, defaultValue: 'a', onChange })
    );

    expect(result.current[0]).toBe('a');

    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('does not update internal state when controlled, only fires onChange', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) =>
        useControllableValue<string>({ value, defaultValue: 'a', onChange }),
      { initialProps: { value: 'x' } }
    );

    expect(result.current[0]).toBe('x');

    act(() => result.current[1]('y'));
    expect(result.current[0]).toBe('x'); // 受控：内部状态没变
    expect(onChange).toHaveBeenCalledWith('y');

    rerender({ value: 'y' });
    expect(result.current[0]).toBe('y');
  });
});
