export type StatusType = "up" | "degraded" | "down";

export interface StatusDot {
  status: StatusType;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  status: StatusType;
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  name: string;
  status: StatusType;
}

export interface Service {
  id: string;
  name: string;
  uptime: number;
  certificateDays: number;
  statusHistory: StatusDot[];
  description?: string;
  url?: string;
  responseTime?: number; // in milliseconds
  lastIncident?: Incident;
  dependencies?: Dependency[];
}

export interface ThemeConfig {
  upColor: string;
  degradedColor: string;
  downColor: string;
  backgroundColor?: string;
  textColor?: string;
  dotSize?: "sm" | "md" | "lg";
  animationSpeed?: "fast" | "normal" | "slow";
}

export interface StatusDashboardProps {
  services: Service[];
  theme?: ThemeConfig;
  refreshInterval?: number; // in milliseconds
  timeRange?: string;
  showTimestamps?: boolean;
  showDescription?: boolean;
  showResponseTime?: boolean;
  showLastIncident?: boolean;
  showDependencies?: boolean;
  onServiceClick?: (service: Service) => void;
  className?: string;
}
