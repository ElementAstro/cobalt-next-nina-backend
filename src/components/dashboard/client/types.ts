export interface ExtendedPerformance extends Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  downlinkMax?: number;
}

export type ClientInfo = {
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  timezone: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean | null;
  online: boolean;
  performance: {
    memory?: string;
    loadTime: string;
  };
  battery?: {
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  webGL: {
    renderer: string;
    vendor: string;
  };
  storage: {
    localStorageSize: number;
    sessionStorageSize: number;
  };
  network: {
    type: string;
    downlinkMax: number;
  };
  cpu: {
    cores: number;
  };
  mediaDevices: {
    audioinput: number;
    audiooutput: number;
  };
  fonts?: string[];
};
