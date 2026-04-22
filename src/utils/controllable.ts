import { useCallback, useState } from 'react';

interface UseControllableValueParams<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}

export function useControllableValue<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableValueParams<T>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const setValue = useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange]
  );

  return [currentValue, setValue] as const;
}
