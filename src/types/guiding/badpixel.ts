export interface PixelData {
  width: number;
  height: number;
  hotPixels: number[];
  coldPixels: number[];
  correctionLevels: {
    hot: number;
    cold: number;
  };
}

export interface BadPixelOptions {
  language: "zh" | "en";
  theme: "light" | "dark";
  autoRefresh: boolean;
  refreshInterval: number;
  displayMode: "scatter" | "heatmap" | "grid";
  showOverlay: boolean;
  filterThreshold: number;
  darkFrameEnabled: boolean;
  autoSave: boolean;
  saveInterval: number;
  advancedMode: boolean;
  sensitivity: number;
  hotPixelThreshold: number;
  autoBackup: boolean;
}
