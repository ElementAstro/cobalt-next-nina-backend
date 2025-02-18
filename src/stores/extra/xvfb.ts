import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type XvfbConfig = {
  display: string;
  resolution: string;
  colorDepth: string; 
  screen: string;
  customResolution: string;
  refreshRate: number;
  memory: number;
  security: {
    xauth: boolean;
    tcp: boolean; 
    localhostOnly: boolean;
  };
  logging: {
    verbose: boolean;
    logFile: string;
    maxLogSize: number;
  };
};

interface XvfbLog {
  timestamp: number;
  message: string;
  type: "info" | "error" | "warning";
}

export interface XvfbInstance {
  id: string;
  display: string;
  config: XvfbConfig;
  status: string;
}

interface XvfbPersist {
  version: number;
  instances: XvfbInstance[];
  config: XvfbConfig;
  savedPresets: { [key: string]: XvfbConfig };
  autoLoad: boolean;
  lastUsedPreset: string | null;
}

interface XvfbStore extends XvfbPersist {
  instances: XvfbInstance[];
  config: XvfbConfig;
  isRunning: boolean;
  logs: XvfbLog[];
  savedPresets: { [key: string]: XvfbConfig };
  lastError: string | null;
  status: "idle" | "starting" | "running" | "stopping" | "error";
  setConfig: (config: Partial<XvfbConfig>) => void;
  toggleRunning: () => void;
  applyConfig: (config: XvfbConfig) => void;
  loadConfig: (name: string) => void;
  saveConfig: (name: string) => void;
  addLog: (message: string, type: XvfbLog["type"]) => void;
  clearLogs: () => void;
  setStatus: (status: XvfbStore["status"]) => void;
  setError: (error: string | null) => void;
  deletePreset: (name: string) => void;
  validateConfig: () => boolean;
  restartServer: () => void;
  setAutoLoad: (autoLoad: boolean) => void;
  setLastUsedPreset: (name: string | null) => void;
  initialize: () => Promise<void>;
  exportConfig: () => string;
  importConfig: (config: string) => void;
}

const initialState: XvfbPersist = {
  version: 1,
  instances: [],
  config: {
    display: ":99",
    resolution: "1024x768",
    colorDepth: "24",
    screen: "0",
    customResolution: "",
    refreshRate: 60,
    memory: 128,
    security: {
      xauth: true,
      tcp: false,
      localhostOnly: true,
    },
    logging: {
      verbose: false,
      logFile: "/var/log/xvfb.log",
      maxLogSize: 10,
    },
  },
  savedPresets: {},
  autoLoad: true,
  lastUsedPreset: null,
};

interface PersistedState {
  version: number;
  config: XvfbConfig;
  savedPresets: { [key: string]: XvfbConfig };
  autoLoad: boolean;
  lastUsedPreset: string | null;
}

export const useXvfbStore = create<XvfbStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      isRunning: false,
      logs: [],
      lastError: null,
      status: "idle",
      setConfig: (newConfig) =>
        set((state) => ({ config: { ...state.config, ...newConfig } })),
      toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),
      applyConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
        get().addLog("Configuration updated", "info");
      },
      loadConfig: (name) => {
        const preset = get().savedPresets[name];
        if (preset) {
          set({
            config: preset,
            lastUsedPreset: name,
          });
          get().addLog(`已加载配置 "${name}"`, "info");
        } else {
          get().setError(`找不到预设 "${name}"`);
        }
      },
      saveConfig: (name) => {
        if (!name.trim()) {
          get().setError("预设名称不能为空");
          return;
        }
        set((state) => ({
          savedPresets: {
            ...state.savedPresets,
            [name]: state.config,
          },
          lastUsedPreset: name,
        }));
        get().addLog(`配置已保存为 "${name}"`, "info");
      },
      addLog: (message, type) =>
        set((state) => ({
          logs: [...state.logs, { timestamp: Date.now(), message, type }].slice(
            -100
          ),
        })),
      clearLogs: () => set({ logs: [] }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ lastError: error }),
      deletePreset: (name) =>
        set((state) => ({
          savedPresets: Object.fromEntries(
            Object.entries(state.savedPresets).filter(([key]) => key !== name)
          ),
        })),
      validateConfig: () => {
        const { config } = get();
        const errors: string[] = [];

        if (!/^:\d+$/.test(config.display)) {
          errors.push("Display must be in format :99");
        }

        if (config.resolution === "custom") {
          if (!/^\d+x\d+$/.test(config.customResolution || "")) {
            errors.push("Custom resolution must be in WIDTHxHEIGHT format");
          }
        } else if (
          !["1024x768", "1280x1024", "1920x1080"].includes(config.resolution)
        ) {
          errors.push("Invalid resolution selection");
        }

        if (!["8", "16", "24", "32"].includes(config.colorDepth)) {
          errors.push("Invalid color depth");
        }

        if (!/^\d+$/.test(config.screen)) {
          errors.push("Screen must be a number");
        }

        if (config.refreshRate < 30 || config.refreshRate > 240) {
          errors.push("Refresh rate must be between 30 and 240 Hz");
        }

        if (config.memory && (config.memory < 64 || config.memory > 1024)) {
          errors.push("Memory must be between 64 and 1024 MB");
        }

        if (config.logging) {
          if (
            config.logging.maxLogSize &&
            (config.logging.maxLogSize < 1 || config.logging.maxLogSize > 1000)
          ) {
            errors.push("Max log size must be between 1 and 1000 MB");
          }
        }

        if (errors.length > 0) {
          get().setError(errors.join("\n"));
          return false;
        }

        get().setError(null);
        return true;
      },
      restartServer: () => {
        const store = get();
        if (store.validateConfig()) {
          store.setStatus("stopping");
          store.addLog("Stopping Xvfb server...", "info");

          setTimeout(() => {
            store.setStatus("starting");
            store.addLog(
              "Starting Xvfb server with new configuration...",
              "info"
            );

            setTimeout(() => {
              store.setStatus("running");
              store.addLog("Xvfb server started successfully", "info");
            }, 1000);
          }, 1000);
        }
      },
      setAutoLoad: (autoLoad) => set({ autoLoad }),
      setLastUsedPreset: (name) => set({ lastUsedPreset: name }),
      initialize: async () => {
        const store = get();
        if (store.autoLoad && store.lastUsedPreset) {
          try {
            store.loadConfig(store.lastUsedPreset);
            store.addLog(
              `Automatically loaded preset "${store.lastUsedPreset}"`,
              "info"
            );
          } catch (error) {
            store.setError(`Failed to auto-load preset: ${error}`);
          }
        }
      },
      exportConfig: () => {
        const { config, savedPresets } = get();
        return JSON.stringify(
          {
            version: initialState.version,
            config,
            savedPresets,
          },
          null,
          2
        );
      },
      importConfig: (configStr) => {
        try {
          const imported = JSON.parse(configStr);
          if (imported.version !== initialState.version) {
            throw new Error("版本不匹配");
          }
          set((state) => ({
            config: { ...state.config, ...imported.config },
            savedPresets: { ...imported.savedPresets },
          }));
          get().addLog("成功导入配置", "info");
        } catch (error) {
          get().setError(`导入配置失败: ${error}`);
        }
      },
    }),
    {
      name: "xvfb-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        version: state.version,
        config: state.config,
        savedPresets: state.savedPresets,
        autoLoad: state.autoLoad,
        lastUsedPreset: state.lastUsedPreset,
      }),
      merge: (persistedState: unknown, currentState: XvfbStore) => ({
        ...currentState,
        ...(persistedState as PersistedState),
        version: initialState.version,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  useXvfbStore.getState().initialize();
}
