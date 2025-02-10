"use client";

import { useState, useEffect, useCallback } from "react";

export type StorageType = "local" | "session";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  storageType: StorageType = "local"
) {
  const storage =
    storageType === "local" ? window.localStorage : window.sessionStorage;

  const readValue = useCallback((): T => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`读取 ${key} 时出错:`, error);
      return initialValue;
    }
  }, [key, initialValue, storage]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        storage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`设置 ${key} 时出错:`, error);
      }
    },
    [key, storedValue, storage]
  );

  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`删除 ${key} 时出错:`, error);
    }
  }, [key, initialValue, storage]);

  // 同步其他标签页的更改或跨组件状态更新
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          setStoredValue(
            event.newValue ? JSON.parse(event.newValue) : initialValue
          );
        } catch (error) {
          console.error(`解析 ${key} 的更新数据时出错:`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return { storedValue, setValue, removeValue };
}
