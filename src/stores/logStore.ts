import { create } from "zustand";
import { LogEntry } from "@/types/log";
import { persist } from "zustand/middleware";

interface LogState {
  // 基础数据
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  selectedLogs: string[];
  
  // 过滤条件
  filter: string;
  search: string;
  logLevel: "all" | "error" | "warn" | "info";
  dateRange?: { from: Date; to: Date };
  
  // 分页设置
  logCount: number;
  currentPage: number;
  isPaginationEnabled: boolean;
  
  // 图表设置
  activeTab: "logs" | "analysis" | "timeseries" | "comparison";
  chartType: "bar" | "line" | "pie" | "radar";
  comparisonTimeRange: "1h" | "24h" | "7d";
  exportFormat: "json" | "csv";
  
  // 实时更新设置
  isRealTimeEnabled: boolean;
  
  // 备注和标签
  selectedLogForNote: LogEntry | null;
  newNote: string;
  newTag: string;
  
  // Actions
  setLogs: (logs: LogEntry[]) => void;
  setFilteredLogs: (logs: LogEntry[]) => void;
  setSelectedLogs: (ids: string[]) => void;
  setFilter: (filter: string) => void;
  setSearch: (search: string) => void;
  setLogLevel: (level: "all" | "error" | "warn" | "info") => void;
  setDateRange: (range?: { from: Date; to: Date }) => void;
  setLogCount: (count: number) => void;
  setCurrentPage: (page: number) => void;
  setIsPaginationEnabled: (enabled: boolean) => void;
  setActiveTab: (tab: "logs" | "analysis" | "timeseries" | "comparison") => void;
  setChartType: (type: "bar" | "line" | "pie" | "radar") => void;
  setComparisonTimeRange: (range: "1h" | "24h" | "7d") => void;
  setExportFormat: (format: "json" | "csv") => void;
  setIsRealTimeEnabled: (enabled: boolean) => void;
  setSelectedLogForNote: (log: LogEntry | null) => void;
  setNewNote: (note: string) => void;
  setNewTag: (tag: string) => void;
  
  // 辅助函数
  refreshLogs: () => void;
  applyFilters: () => void;
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      // 初始状态
      logs: [],
      filteredLogs: [],
      selectedLogs: [],
      filter: "",
      search: "",
      logLevel: "all",
      dateRange: undefined,
      logCount: 100,
      currentPage: 1,
      isPaginationEnabled: false,
      activeTab: "logs",
      chartType: "bar",
      comparisonTimeRange: "24h",
      exportFormat: "json",
      isRealTimeEnabled: true,
      selectedLogForNote: null,
      newNote: "",
      newTag: "",

      // Actions
      setLogs: (logs) => {
        set({ logs });
        get().applyFilters();
      },
      
      setFilteredLogs: (filteredLogs) => set({ filteredLogs }),
      
      setSelectedLogs: (selectedLogs) => set({ selectedLogs }),
      
      setFilter: (filter) => {
        set({ filter });
        get().applyFilters();
      },
      
      setSearch: (search) => {
        set({ search });
        get().applyFilters();
      },
      
      setLogLevel: (logLevel) => {
        set({ logLevel });
        get().applyFilters();
      },
      
      setDateRange: (dateRange) => {
        set({ dateRange });
        get().applyFilters();
      },
      
      setLogCount: (logCount) => set({ logCount }),
      
      setCurrentPage: (currentPage) => set({ currentPage }),
      
      setIsPaginationEnabled: (isPaginationEnabled) => set({ isPaginationEnabled }),
      
      setActiveTab: (activeTab) => set({ activeTab }),
      
      setChartType: (chartType) => set({ chartType }),
      
      setComparisonTimeRange: (comparisonTimeRange) => set({ comparisonTimeRange }),
      
      setExportFormat: (exportFormat) => set({ exportFormat }),
      
      setIsRealTimeEnabled: (isRealTimeEnabled) => set({ isRealTimeEnabled }),
      
      setSelectedLogForNote: (selectedLogForNote) => set({ selectedLogForNote }),
      
      setNewNote: (newNote) => set({ newNote }),
      
      setNewTag: (newTag) => set({ newTag }),

      // 辅助函数
      refreshLogs: () => {
        const state = get();
        state.applyFilters();
      },

      applyFilters: () => {
        const state = get();
        let filtered = [...state.logs];

        // 应用搜索过滤
        if (state.search) {
          const searchLower = state.search.toLowerCase();
          filtered = filtered.filter(log => 
            log.message.toLowerCase().includes(searchLower)
          );
        }

        // 应用标签过滤
        if (state.filter) {
          const filterLower = state.filter.toLowerCase();
          filtered = filtered.filter(log => 
            log.tags?.some(tag => tag.toLowerCase().includes(filterLower))
          );
        }

        // 应用日志级别过滤
        if (state.logLevel !== "all") {
          filtered = filtered.filter(log => log.level === state.logLevel);
        }

        // 应用日期范围过滤
        if (state.dateRange) {
          filtered = filtered.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= state.dateRange!.from && 
                   logDate <= state.dateRange!.to;
          });
        }

        // 按时间戳排序
        filtered.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        set({ filteredLogs: filtered });
      }
    }),
    {
      name: "log-storage",
      partialize: (state) => ({
        logCount: state.logCount,
        isPaginationEnabled: state.isPaginationEnabled,
        isRealTimeEnabled: state.isRealTimeEnabled,
        activeTab: state.activeTab,
        chartType: state.chartType,
        exportFormat: state.exportFormat,
      }),
    }
  )
);
