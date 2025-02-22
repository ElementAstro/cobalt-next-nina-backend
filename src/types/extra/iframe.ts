export interface CustomIframeError extends Error {
  message: string;
  code?: string;
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface IframeEventHandlers {
  onLoad?: () => void;
  onError?: (error: CustomIframeError) => void;
  onDeviceChange?: (device: DeviceType) => void;
  onZoomChange?: (zoom: number) => void;
  onScreenshot?: (dataUrl: string) => void;
}

export interface CustomIframeProps extends IframeEventHandlers {
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
  customStyles?: Record<string, string>;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}