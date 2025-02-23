import { CustomIframeError, IframeErrorType } from '../../types/extra/errors';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorInfo {
  title: string;
  description: string;
  type: ErrorSeverity;
  suggestion?: string;
  recoverable?: boolean;
}

export interface ErrorLogData {
  app?: string;
  type: IframeErrorType;
  message: string;
  url?: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  severity: ErrorSeverity;
  stack?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

interface RetryOptions {
  baseDelay?: number;
  maxDelay?: number;
  exponential?: boolean;
  jitter?: boolean;
  maxRetries?: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  jitter: true,
  maxRetries: 3,
};

export function getErrorInfo(error: CustomIframeError, isOnline: boolean): ErrorInfo {
  if (!isOnline) {
    return {
      title: '网络已断开',
      description: '请检查网络连接后重试',
      type: 'warning',
      suggestion: '检查网络连接或切换网络',
      recoverable: true,
    };
  }

  switch (error.type) {
    case 'timeout':
      return {
        title: '连接超时',
        description: '请求超时，可能是网络问题或服务器响应慢',
        type: 'warning',
        suggestion: '检查网络速度或稍后重试',
        recoverable: true,
      };
    case 'security':
      return {
        title: '安全限制',
        description: '由于安全策略限制无法加载应用',
        type: 'error',
        suggestion: '请确认应用URL是否正确且支持HTTPS',
        recoverable: false,
      };
    case 'network':
      return {
        title: '网络错误',
        description: '网络连接失败，可能是跨域限制或服务器问题',
        type: 'warning',
        suggestion: '检查网络连接或联系管理员',
        recoverable: true,
      };
    case 'permission':
      return {
        title: '权限不足',
        description: '没有足够的权限访问该应用',
        type: 'error',
        suggestion: '请联系管理员获取权限',
        recoverable: false,
      };
    case 'compatibility':
      return {
        title: '兼容性问题',
        description: '您的浏览器可能不支持某些功能',
        type: 'warning',
        suggestion: '尝试使用最新版本的浏览器',
        recoverable: false,
      };
    case 'resource':
      return {
        title: '资源加载失败',
        description: '无法加载应用所需的资源文件',
        type: 'error',
        suggestion: '检查网络连接或刷新页面重试',
        recoverable: true,
      };
    case 'server':
      return {
        title: '服务器错误',
        description: '服务器出现异常，请稍后重试',
        type: 'critical',
        suggestion: '请联系管理员或稍后重试',
        recoverable: true,
      };
    default:
      return {
        title: '加载失败',
        description: error.message || '无法加载应用内容',
        type: 'error',
        suggestion: '请刷新页面重试或联系管理员',
        recoverable: true,
      };
  }
}

export function logErrorDetails(error: CustomIframeError, appName?: string): void {
  const errorData: ErrorLogData = {
    app: appName,
    type: error.type,
    message: error.message,
    url: error.url,
    code: error.code,
    details: error.details,
    timestamp: new Date(error.timestamp).toISOString(),
    severity: getErrorSeverity(error),
    stack: error.stack,
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
  };

  // 控制台记录
  console.error('App launch error:', errorData);

  // 错误上报
  void reportError(errorData).catch(console.error);
}

function getErrorSeverity(error: CustomIframeError): ErrorSeverity {
  switch (error.type) {
    case 'security':
    case 'server':
      return 'critical';
    case 'permission':
    case 'resource':
      return 'error';
    case 'timeout':
    case 'network':
    case 'compatibility':
      return 'warning';
    default:
      return 'info';
  }
}

async function reportError(errorData: ErrorLogData): Promise<void> {
  try {
    // 这里实现错误上报到服务器的逻辑
    // 例如:
    // await fetch('/api/error-reporting', {
    //   method: 'POST',
    //   body: JSON.stringify(errorData),
    // });
  } catch (error) {
    console.error('Error reporting failed:', error);
  }
}

export function getRetryDelay(
  retryCount: number,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): number {
  const {
    baseDelay = 1000,
    maxDelay = 10000,
    exponential = true,
    jitter = true,
    maxRetries = 3,
  } = options;

  if (retryCount >= maxRetries) {
    return -1; // 表示不应该继续重试
  }

  let delay = exponential
    ? baseDelay * Math.pow(2, retryCount)
    : baseDelay * (retryCount + 1);

  if (jitter) {
    delay = delay * (0.5 + Math.random());
  }

  return Math.min(delay, maxDelay);
}

export function shouldRetry(error: CustomIframeError): boolean {
  const retriableErrors: IframeErrorType[] = ['timeout', 'network', 'resource', 'server'];
  return retriableErrors.includes(error.type);
}

export function getErrorRecoverySteps(error: CustomIframeError): string[] {
  const commonSteps = ['刷新页面重试'];
  
  switch (error.type) {
    case 'network':
      return [
        '检查网络连接是否正常',
        '尝试切换网络（如从WiFi切换到移动数据）',
        '清除浏览器缓存',
        ...commonSteps,
      ];
    case 'security':
      return [
        '确认应用URL是否正确',
        '检查是否支持HTTPS',
        '联系管理员确认安全策略',
      ];
    case 'permission':
      return [
        '检查是否已登录',
        '联系管理员获取权限',
        '确认账号权限是否正确',
      ];
    default:
      return commonSteps;
  }
}