import { CustomIframeError } from "../../types/extra/errors";

export const handleAppError = (error: CustomIframeError): string => {
  switch (error.type) {
    case 'timeout':
      return '加载超时，请检查网络连接';
    case 'security':
      return '由于安全限制无法加载应用';
    case 'network':
      return '网络连接失败，请检查网络状态';
    default:
      return error.message || '无法加载应用内容';
  }
};

export const logAppError = (
  error: CustomIframeError, 
  appName?: string
): void => {
  console.error("App launch error:", {
    app: appName,
    type: error.type,
    message: error.message,
    url: error.url,
    code: error.code,
    details: error.details,
    timestamp: new Date(error.timestamp).toISOString(),
  });
};

export const createAppError = (
  type: CustomIframeError['type'], 
  message: string, 
  url?: string
): CustomIframeError => {
  return {
    name: 'CustomIframeError',
    type,
    message,
    url,
    timestamp: Date.now(),
  } as CustomIframeError;
};