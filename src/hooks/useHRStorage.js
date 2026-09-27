import { useState, useEffect, useCallback, useMemo } from 'react';
import { getHRData, setHRData, initHRData } from '../services/hrStorageService';

export function useHRStorage(storageKey, defaultValue = []) {
  const [data, setDataState] = useState(() => {
    initHRData();
    const stored = getHRData(storageKey, defaultValue);
    return stored !== undefined && stored !== null ? stored : defaultValue;
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (!e?.detail || e.detail.key === storageKey || e.detail.key === 'ALL') {
        const stored = getHRData(storageKey, defaultValue);
        setDataState(stored !== undefined && stored !== null ? stored : defaultValue);
      }
    };

    window.addEventListener('hr_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('hr_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [storageKey, defaultValue]);

  const setItem = useCallback((val) => {
    const current = getHRData(storageKey, defaultValue);
    const nextVal = typeof val === 'function' ? val(current) : val;
    setHRData(storageKey, nextVal);
    setDataState(nextVal);
  }, [storageKey, defaultValue]);

  return useMemo(() => {
    const target = data !== undefined && data !== null ? data : defaultValue;

    // Attach data and setItem directly to the array/object for direct property access
    try {
      if (typeof target === 'object' && target !== null) {
        Object.defineProperty(target, 'data', {
          value: target,
          writable: true,
          configurable: true,
          enumerable: false
        });
        Object.defineProperty(target, 'setItem', {
          value: setItem,
          writable: true,
          configurable: true,
          enumerable: false
        });
      }
    } catch {
      // Ignore if frozen
    }

    // Wrap with Proxy so destructuring ({ data, setItem }) and array methods (.filter, .map, etc.) both work seamlessly
    return new Proxy(target, {
      get(obj, prop, receiver) {
        if (prop === 'data') {
          return obj;
        }
        if (prop === 'setItem') {
          return setItem;
        }
        const val = Reflect.get(obj, prop, receiver);
        if (typeof val === 'function') {
          return val.bind(obj);
        }
        return val;
      }
    });
  }, [data, defaultValue, setItem]);
}
