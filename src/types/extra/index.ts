export interface App {
  id: string;
  name: string;
  icon: string;
  url: string;
  category: string;
  description?: string;
  isPinned: boolean;
  lastOpened?: string;
  version?: string;
  author?: string;
}

export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark';
export type SortMode = 'name' | 'date' | 'category';

export interface SelectableCategory {
  id: string;
  name: string;
  icon: JSX.Element;
  description?: string;
  count?: number;
}

export interface CategoryFilters {
  selectedCategory: string | string[] | null;
  categoryCounts?: Record<string, number>;
  enableMultiSelect?: boolean;
  orientation?: 'horizontal' | 'vertical';
  showCounts?: boolean;
  animate?: boolean;
}

export interface AppPerformance {
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AppEvent {
  type: 'launch' | 'close' | 'error';
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface AppAnalytics {
  appId: string;
  events: AppEvent[];
  totalUsageTime: number;
  averageSessionDuration: number;
  launchCount: number;
}

export interface AppLaunchOptions {
  fullscreen?: boolean;
  newWindow?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  timeout?: number;
}

export interface WorkspaceLayout {
  name: string;
  apps: string[];
  layout: 'grid' | 'list';
  sortOrder: string[];
  filters: Partial<CategoryFilters>;
}
