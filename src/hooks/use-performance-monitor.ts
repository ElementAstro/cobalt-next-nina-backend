import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  fps: number;
  networkLatency: number;
  resourceCount: number;
}

const initialMetrics: PerformanceMetrics = {
  loadTime: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  fps: 60,
  networkLatency: 0,
  resourceCount: 0,
};

export function usePerformanceMonitor(options = { interval: 1000 }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // 初始化 Web Worker
  const initWorker = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(new URL('../workers/performance-monitor.ts', import.meta.url));
      
      worker.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'metrics') {
          setMetrics(data);
        }
      };

      worker.onerror = (error) => {
        console.error('Performance monitor worker error:', error);
        setIsMonitoring(false);
      };

      workerRef.current = worker;
    } catch (error) {
      console.error('Failed to initialize performance monitor worker:', error);
    }
  }, []);

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (!workerRef.current) {
      initWorker();
    }

    workerRef.current?.postMessage({
      type: 'start',
      data: { interval: options.interval }
    });
    
    setIsMonitoring(true);
  }, [options.interval, initWorker]);

  // 停止监控
  const stopMonitoring = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' });
    setIsMonitoring(false);
  }, []);

  // 重置指标
  const resetMetrics = useCallback(() => {
    setMetrics(initialMetrics);
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // 导出性能指标
  const exportMetrics = useCallback(() => {
    return {
      ...metrics,
      timestamp: new Date().toISOString(),
      isMonitoring,
    };
  }, [metrics, isMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    exportMetrics,
  };
}