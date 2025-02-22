import { create } from 'zustand';

export interface AppStats {
  appId: string;
  stats: {
    launchCount: number;
    totalDuration: number;
    trend: 'up' | 'down';
    weekChange: number;
  };
}

interface StatisticsStore {
  getTopApps: (limit: number) => AppStats[];
  getAppTrends: (timeRange: string) => Array<{
    date: string;
    count: number;
    duration: number;
  }>;
}

export const useStatistics = create<StatisticsStore>(() => ({
  getTopApps: (limit: number) => {
    // Mock data - 实际应用中应该从后端获取
    return Array(limit)
      .fill(0)
      .map((_, i) => ({
        appId: `App ${i + 1}`,
        stats: {
          launchCount: Math.floor(Math.random() * 100),
          totalDuration: Math.floor(Math.random() * 3600),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          weekChange: Math.floor(Math.random() * 50),
        },
      }));
  },
  getAppTrends: (timeRange: string) => {
    // Mock data - 实际应用中应该从后端获取
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array(days)
      .fill(0)
      .map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50),
          duration: Math.floor(Math.random() * 120),
        };
      })
      .reverse();
  },
}));
