import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Analytics {
  dailyUsage: Record<
    string,
    {
      appId: string;
      duration: number;
      launches: number;
    }
  >;
  weeklyUsage: Record<
    string,
    {
      appId: string;
      duration: number;
      launches: number;
    }
  >;
  monthlyUsage: Record<
    string,
    {
      appId: string;
      duration: number;
      launches: number;
    }
  >;
  tags: Record<string, string[]>;
  categories: Record<
    string,
    {
      totalUsage: number;
      lastUsed: string;
    }
  >;
  favorites: string[];
}

interface AnalyticsActions {
  trackAppUsage: (appId: string, duration: number) => void;
  addTag: (appId: string, tag: string) => void;
  removeTag: (appId: string, tag: string) => void;
  toggleFavorite: (appId: string) => void;
  clearHistory: () => void;
  exportAnalytics: () => Promise<Analytics>;
  importAnalytics: (data: Analytics) => void;
}

const useAnalyticsStore = create<Analytics & AnalyticsActions>()(
  persist(
    (set, get) => ({
      dailyUsage: {},
      weeklyUsage: {},
      monthlyUsage: {},
      tags: {},
      categories: {},
      favorites: [],

      trackAppUsage: (appId, duration) => {
        const date = new Date().toISOString().split("T")[0];
        const week = getWeekNumber(new Date()); // 需要实现这个函数
        const month = new Date().toISOString().slice(0, 7);

        set((state) => {
          // 更新日使用统计
          const daily = { ...state.dailyUsage };
          if (!daily[date]) {
            daily[date] = { appId, duration: 0, launches: 0 };
          }
          daily[date].duration += duration;
          daily[date].launches += 1;

          // 更新周使用统计
          const weekly = { ...state.weeklyUsage };
          if (!weekly[week]) {
            weekly[week] = { appId, duration: 0, launches: 0 };
          }
          weekly[week].duration += duration;
          weekly[week].launches += 1;

          // 更新月使用统计
          const monthly = { ...state.monthlyUsage };
          if (!monthly[month]) {
            monthly[month] = { appId, duration: 0, launches: 0 };
          }
          monthly[month].duration += duration;
          monthly[month].launches += 1;

          return {
            dailyUsage: daily,
            weeklyUsage: weekly,
            monthlyUsage: monthly,
          };
        });
      },

      addTag: (appId, tag) => {
        set((state) => ({
          tags: {
            ...state.tags,
            [appId]: [...(state.tags[appId] || []), tag],
          },
        }));
      },

      removeTag: (appId, tag) => {
        set((state) => ({
          tags: {
            ...state.tags,
            [appId]: (state.tags[appId] || []).filter((t) => t !== tag),
          },
        }));
      },

      toggleFavorite: (appId) => {
        set((state) => ({
          favorites: state.favorites.includes(appId)
            ? state.favorites.filter((id) => id !== appId)
            : [...state.favorites, appId],
        }));
      },

      clearHistory: () => {
        set(() => ({
          dailyUsage: {},
          weeklyUsage: {},
          monthlyUsage: {},
        }));
      },

      exportAnalytics: async () => {
        return get();
      },

      importAnalytics: (data) => {
        set(data);
      },
    }),
    {
      name: "app-analytics",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number): Analytics => {
        const state = persistedState as Partial<Analytics>;

        if (version === 0) {
          return {
            weeklyUsage: {},
            monthlyUsage: {},
            dailyUsage: state.dailyUsage || {},
            tags: state.tags || {},
            categories: state.categories || {},
            favorites: state.favorites || [],
          };
        }

        return {
          weeklyUsage: state.weeklyUsage || {},
          monthlyUsage: state.monthlyUsage || {},
          dailyUsage: state.dailyUsage || {},
          tags: state.tags || {},
          categories: state.categories || {},
          favorites: state.favorites || [],
        };
      },
      partialize: (state) => ({
        dailyUsage: state.dailyUsage,
        weeklyUsage: state.weeklyUsage,
        monthlyUsage: state.monthlyUsage,
        tags: state.tags,
        categories: state.categories,
        favorites: state.favorites,
      }),
    }
  )
);

// 辅助函数：获取周数
function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

export default useAnalyticsStore;
