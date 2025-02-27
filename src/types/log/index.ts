export interface LogMetadata {
  userId?: string;
  sessionId?: string;
  browser?: {
    name: string;
    version: string;
  };
  os?: {
    name: string;
    version: string;
  };
  performance?: {
    responseTime: number;
    memoryUsage: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  tags?: string[];
  note?: string;
  source?: string;
  metadata?: LogMetadata;
}

export interface LogFilter {
  search?: string;
  level?: "error" | "warn" | "info" | "all";
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface TimeSeriesData {
  timestamp: string;
  error: number;
  warn: number;
  info: number;
  total: number;
}

export type TimeRange = "1h" | "24h" | "7d" | "30d";
export type ChartType = "bar" | "line" | "pie" | "radar";
export type ExportFormat = "json" | "csv";
