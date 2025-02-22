import { CustomIframeError } from '../../types/extra/errors';

export interface ErrorInfo {
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error';
}

export function getErrorInfo(error: CustomIframeError, isOnline: boolean): ErrorInfo {
  if (!isOnline) {
    return {
      title: '网络已断开',
      description: '请检查网络连接后重试',
      type: 'warning'
    };
  }

  switch (error.type) {
    case 'timeout':
      return {
        title: '连接超时',
        description: '请检查网络连接或应用配置',
        type: 'warning'
      };
    case 'security':
      return {
        title: '安全限制',
        description: '由于安全策略限制无法加载应用',
        type: 'error'
      };
    case 'network':
      return {
        title: '网络错误',
        description: '网络连接失败，请稍后重试',
        type: 'warning'
      };
    default:
      return {
        title: '加载失败',
        description: error.message || '无法加载应用内容',
        type: 'error'
      };
  }
}

export function logErrorDetails(error: CustomIframeError, appName?: string): void {
  console.error('App launch error:', {
    app: appName,
    type: error.type,
    message: error.message,
    url: error.url,
    code: error.code,
    details: error.details,
    timestamp: new Date(error.timestamp).toISOString()
  });
}

export function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 10000); // 最大10秒
}