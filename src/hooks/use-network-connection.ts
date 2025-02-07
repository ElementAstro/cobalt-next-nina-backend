import { useState, useEffect, useCallback } from "react";

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  downlinkMax?: number;
  type?: string;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

// 扩展 Navigator 接口，增加 connection 属性
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

export interface NetworkStatus {
  online: boolean;
  downlink?: number;
  rtt?: number;
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  downlinkMax?: number;
}

// 扩展钩子函数，增加 refresh 方法和 onChange 回调参数，使其更加灵活
export function useNetworkStatus(onChange?: (status: NetworkStatus) => void) {
  const [status, setStatus] = useState<NetworkStatus>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true, // SSR 后备为 true
    downlink: undefined,
    rtt: undefined,
    type: undefined,
    effectiveType: undefined,
    saveData: undefined,
    downlinkMax: undefined,
  });

  // 更新网络状态并调用 onChange 回调（如果存在）
  const updateNetworkStatus = useCallback(() => {
    // 使用扩展后的 Navigator 类型获取 connection 对象
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection;
    const newStatus: NetworkStatus = {
      online: navigator.onLine,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      type: connection?.type,
      effectiveType: connection?.effectiveType,
      saveData: connection?.saveData,
      downlinkMax: connection?.downlinkMax,
    };
    setStatus(newStatus);
    if (onChange) {
      onChange(newStatus);
    }
  }, [onChange]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      updateNetworkStatus();

      // 监听 online/offline 事件
      window.addEventListener("online", updateNetworkStatus);
      window.addEventListener("offline", updateNetworkStatus);

      // 监听 connection 对象的 change 事件
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection;
      if (connection) {
        connection.addEventListener("change", updateNetworkStatus);
      }

      // 清除事件监听
      return () => {
        window.removeEventListener("online", updateNetworkStatus);
        window.removeEventListener("offline", updateNetworkStatus);
        if (connection) {
          connection.removeEventListener("change", updateNetworkStatus);
        }
      };
    }
  }, [onChange, updateNetworkStatus]);

  // 新增 refresh 方法，可以手动刷新网络状态
  return { status, refresh: updateNetworkStatus };
}
