export type VisualMode = "table" | "graph" | "grid";

export interface BadPixelData {
  width: number;
  height: number;
  hotPixels: number[];
  coldPixels: number[];
}

export interface HistoryRecord {
  hotPixels: number[];
  coldPixels: number[];
  timestamp: string;
}

export interface SaveState {
  loading: boolean;
  lastSaved?: Date;
  error?: string;
}

export interface BadPixelOptions {
  language: "zh" | "en";
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
