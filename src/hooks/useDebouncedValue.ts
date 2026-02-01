import { useState, useEffect } from 'react';

/**
 * Debounces a value, returning the debounced version after the specified delay.
 * Useful for search inputs to prevent excessive filtering/API calls while typing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
