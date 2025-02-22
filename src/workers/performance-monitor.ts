// Web Worker for performance monitoring

let monitoringInterval: number | null = null;

// 模拟获取性能数据
function getPerformanceMetrics() {
  return {
    loadTime: Math.random() * 1000,
    memoryUsage: Math.random() * 100,
    cpuUsage: Math.random() * 100,
    fps: 60 - Math.random() * 20,
    networkLatency: Math.random() * 200,
    resourceCount: Math.floor(Math.random() * 50),
  };
}

// 开始监控
function startMonitoring(interval = 1000) {
  if (monitoringInterval) return;
  
  monitoringInterval = setInterval(() => {
    const metrics = getPerformanceMetrics();
    self.postMessage({ type: 'metrics', data: metrics });
  }, interval) as unknown as number;
}

// 停止监控
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// 监听主线程消息
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'start':
      startMonitoring(data?.interval);
      break;
    case 'stop':
      stopMonitoring();
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};