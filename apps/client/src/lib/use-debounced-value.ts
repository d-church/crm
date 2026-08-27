import { useEffect, useState } from 'react';

/**
 * Delays a fast-changing value — a search box feeding a server request should
 * fire once the typing stops, not on every keystroke.
 */
export const useDebouncedValue = <T>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
