import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RequestHistoryItem {
  id: string;
  timestamp: number;
  path: string;
  method: string;
  request: {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
  };
  error?: string;
  duration: number;
}

interface RequestHistoryState {
  history: RequestHistoryItem[];
  addHistoryItem: (item: RequestHistoryItem) => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;
}

export const useRequestHistoryStore = create<RequestHistoryState>()(
  persist(
    (set) => ({
      history: [],

      addHistoryItem: (item) => {
        set((state) => ({
          history: [item, ...state.history].slice(0, 50), // 只保留最近50条记录
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      removeHistoryItem: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: "swagger-request-history",
    }
  )
);
