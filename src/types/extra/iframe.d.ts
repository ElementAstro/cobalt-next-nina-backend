import { CustomIframeError } from './errors';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface CustomIframeProps {
  src: string;
  title: string;
  className?: string;
  allowFullScreen?: boolean;
  showDeviceSelector?: boolean;
  showZoomControls?: boolean;
  allowScripts?: boolean;
  lazy?: boolean;
  timeout?: number;
  refreshInterval?: number;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: CustomIframeError) => void;
  onDeviceChange?: (device: DeviceType) => void;
  onScreenshot?: (dataUrl: string) => void;
  customStyles?: React.CSSProperties;
  maxRetries?: number;
  retryDelay?: number;
}

export interface IframeRef {
  reload: () => void;
  capture: () => Promise<string>;
  setDevice: (device: DeviceType) => void;
}

export interface IframeError extends CustomIframeError {
  timestamp: number;
  retryCount?: number;
}