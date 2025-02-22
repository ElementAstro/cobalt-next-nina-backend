import { useState, useEffect } from 'react';

interface NetworkInformation extends EventTarget {
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export interface NetworkStatus {
  isOnline: boolean;
  type?: NetworkInformation['type'];
  effectiveType?: NetworkInformation['effectiveType'];
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [connectionInfo, setConnectionInfo] = useState<{
    type?: NetworkInformation['type'];
    effectiveType?: NetworkInformation['effectiveType'];
  }>({
    type: undefined,
    effectiveType: undefined,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const updateConnectionInfo = () => {
      if (typeof navigator !== 'undefined') {
        const nav = navigator as NavigatorWithConnection;
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
        
        if (conn) {
          setConnectionInfo({
            type: conn.type,
            effectiveType: conn.effectiveType,
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined') {
      const nav = navigator as NavigatorWithConnection;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

      if (conn) {
        conn.addEventListener('change', updateConnectionInfo);
        updateConnectionInfo();
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (typeof navigator !== 'undefined') {
        const nav = navigator as NavigatorWithConnection;
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

        if (conn) {
          conn.removeEventListener('change', updateConnectionInfo);
        }
      }
    };
  }, []);

  return {
    isOnline,
    ...connectionInfo,
  };
}