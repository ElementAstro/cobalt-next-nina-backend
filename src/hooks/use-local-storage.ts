import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // 获取存储的值（首次加载）
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // 状态用于跟踪当前值
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 在组件挂载时从 localStorage 读取值
  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 返回一个包装函数，用于更新 localStorage 和状态
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried setting localStorage key "${key}" even though environment is not a client`);
        return;
      }

      try {
        // 允许 value 是一个函数
        const newValue = value instanceof Function ? value(storedValue) : value;

        // 保存到 localStorage
        window.localStorage.setItem(key, JSON.stringify(newValue));

        // 保存到状态
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 移除值的函数
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn(`Tried removing localStorage key "${key}" even though environment is not a client`);
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  return [storedValue, setValue, removeValue];
}
