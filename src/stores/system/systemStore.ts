import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DiskDevice {
  name: string;
  mountPoint: string;
  size: number;
  used: number;
  free: number;
}

interface NetworkInterface {
  name: string;
  address: string;
  mac: string;
  type: string;
  speed: number;
}

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: string;
}

interface Service {
  name: string;
  status: "running" | "stopped";
  pid?: number;
  description: string;
}

interface SystemInfo {
  cpu: {
    model: string;
    usage: number;
    cores: number;
    temperature: number;
    clockSpeed: number;
  };
  memory: { total: number; used: number; free: number };
  disk: { total: number; used: number; free: number; devices: DiskDevice[] };
  os: { type: string; platform: string; uptime: number; hostname: string };
  network: {
    interfaces: NetworkInterface[];
    bytesReceived: number;
    bytesSent: number;
  };
  gpu: { model: string; temperature: number; usage: number };
  processes: { list: Process[]; total: number };
  services: { list: Service[]; running: number };
}

interface HistoricalData {
  cpu: number[];
  memory: number[];
  network: { download: number[]; upload: number[] };
}

interface Settings {
  theme: "light" | "dark" | "system";
  refreshInterval: number;
  layoutConfig: {
    columns: number;
    visibleWidgets: string[];
  };
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  animationSpeed: "slow" | "normal" | "fast";
  unitDisplay: "binary" | "decimal";
}

interface SystemState {
  systemInfo: SystemInfo;
  historicalData: HistoricalData;
  settings: Settings;
  loading: boolean;
  error: string | null;
  isLoading: boolean; // 添加的接口属性
  fetchSystemInfo: () => Promise<void>;
  refreshSystemInfo: () => Promise<void>; // 添加的接口方法
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: "system",
  refreshInterval: 5000,
  layoutConfig: {
    columns: 2,
    visibleWidgets: [
      "cpu",
      "memory",
      "disk",
      "os",
      "network",
      "gpu",
      "processes",
    ],
  },
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  animationSpeed: "normal",
  unitDisplay: "binary",
};

const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      systemInfo: {
        cpu: { model: "", usage: 0, cores: 0, temperature: 0, clockSpeed: 0 },
        memory: { total: 0, used: 0, free: 0 },
        disk: { total: 0, used: 0, free: 0, devices: [] },
        os: { type: "", platform: "", uptime: 0, hostname: "" },
        network: { interfaces: [], bytesReceived: 0, bytesSent: 0 },
        gpu: { model: "", temperature: 0, usage: 0 },
        processes: { list: [], total: 0 },
        services: { list: [], running: 0 },
      },
      historicalData: {
        cpu: [],
        memory: [],
        network: { download: [], upload: [] },
      },
      settings: defaultSettings,
      loading: false,
      error: null,
      isLoading: false, // 初始化新增的属性

      fetchSystemInfo: async () => {
        set({ loading: true, isLoading: true, error: null });
        try {
          const response = await fetch("/api/system-info");
          const data = await response.json();

          set((state: SystemState) => ({
            systemInfo: data,
            historicalData: {
              cpu: [...state.historicalData.cpu.slice(-19), data.cpu.usage],
              memory: [
                ...state.historicalData.memory.slice(-19),
                Math.round((data.memory.used / data.memory.total) * 100),
              ],
              network: {
                download: [
                  ...state.historicalData.network.download.slice(-19),
                  data.network.bytesReceived,
                ],
                upload: [
                  ...state.historicalData.network.upload.slice(-19),
                  data.network.bytesSent,
                ],
              },
            },
            loading: false,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          set({ error: errorMessage, loading: false, isLoading: false });
        }
      },

      // 添加 refreshSystemInfo 方法
      refreshSystemInfo: async () => {
        set({ loading: true, isLoading: true, error: null });
        try {
          const response = await fetch("/api/system-info");
          const data = await response.json();

          set((state: SystemState) => ({
            systemInfo: data,
            historicalData: {
              cpu: [...state.historicalData.cpu.slice(-19), data.cpu.usage],
              memory: [
                ...state.historicalData.memory.slice(-19),
                Math.round((data.memory.used / data.memory.total) * 100),
              ],
              network: {
                download: [
                  ...state.historicalData.network.download.slice(-19),
                  data.network.bytesReceived,
                ],
                upload: [
                  ...state.historicalData.network.upload.slice(-19),
                  data.network.bytesSent,
                ],
              },
            },
            loading: false,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          set({ error: errorMessage, loading: false, isLoading: false });
        }
      },

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state: SystemState) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: "system-monitor-storage",
      partialize: (state: SystemState) => ({ settings: state.settings }),
    }
  )
);

export default useSystemStore;
