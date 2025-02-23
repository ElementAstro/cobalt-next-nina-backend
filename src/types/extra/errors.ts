export interface CustomError extends Error {
  code?: string;
  details?: unknown;
}

export type IframeErrorType = 
  | 'load' 
  | 'security' 
  | 'network' 
  | 'timeout' 
  | 'permission'
  | 'compatibility'
  | 'resource'
  | 'server'
  | 'unknown';

export interface IframeError extends CustomError {
  type: IframeErrorType;
  url?: string;
  timestamp: number;
}

export class CustomIframeError extends Error implements IframeError {
  type: IframeErrorType;
  url?: string;
  timestamp: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    type: IframeErrorType = 'unknown',
    options?: {
      url?: string;
      code?: string;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'CustomIframeError';
    this.type = type;
    this.url = options?.url;
    this.code = options?.code;
    this.details = options?.details;
    this.timestamp = Date.now();
  }

  static fromError(error: Error): CustomIframeError {
    return new CustomIframeError(
      error.message,
      'unknown',
      { details: error }
    );
  }

  static timeout(url: string): CustomIframeError {
    return new CustomIframeError(
      '加载超时',
      'timeout',
      { url, code: 'TIMEOUT' }
    );
  }

  static security(url: string): CustomIframeError {
    return new CustomIframeError(
      '安全限制',
      'security',
      { url, code: 'SECURITY_ERROR' }
    );
  }

  static network(url: string): CustomIframeError {
    return new CustomIframeError(
      '网络错误',
      'network',
      { url, code: 'NETWORK_ERROR' }
    );
  }

  static permission(url: string): CustomIframeError {
    return new CustomIframeError(
      '权限不足',
      'permission',
      { url, code: 'PERMISSION_DENIED' }
    );
  }

  static compatibility(url: string): CustomIframeError {
    return new CustomIframeError(
      '兼容性问题',
      'compatibility',
      { url, code: 'COMPATIBILITY_ERROR' }
    );
  }

  static resource(url: string): CustomIframeError {
    return new CustomIframeError(
      '资源加载失败',
      'resource',
      { url, code: 'RESOURCE_ERROR' }
    );
  }

  static server(url: string): CustomIframeError {
    return new CustomIframeError(
      '服务器错误',
      'server',
      { url, code: 'SERVER_ERROR' }
    );
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      url: this.url,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export type ErrorHandler = (error: CustomIframeError) => void;