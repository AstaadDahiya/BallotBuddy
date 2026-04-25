import { useState, useEffect, useCallback } from 'react';

/**
 * usePersistentState — Custom hook that behaves like useState but
 * persists the value to localStorage so it survives page reloads.
 *
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Default value if nothing stored
 * @returns {[*, Function]} - [value, setValue] tuple
 */
export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [key, value]);

  const clearValue = useCallback(() => {
    setValue(initialValue);
    try {
      localStorage.removeItem(key);
    } catch {
      // noop
    }
  }, [key, initialValue]);

  return [value, setValue, clearValue];
}
