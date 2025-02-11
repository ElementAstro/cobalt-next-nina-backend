import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Target,
  TimelineData,
  ExecutionStatus,
  TaskDependencies,
  ExposureTask,
  TaskStatus,
  TargetSettings,
} from "@/types/sequencer";

// 自定义通知类型
export interface MyNotification {
  id: string;
  type: "success" | "error" | string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface AutofocusConfig {
  enabled: boolean;
  interval: number;
  tempDelta: number;
  method: "hfd" | "curvature" | "bahtinov";
  autofocusOnFilterChange: boolean;
  autofocusOnTemperatureChange: boolean;
}

interface ImportData {
  targets: Target[];
  settings: TargetSettings;
  autofocusConfig?: {
    enabled: boolean;
    interval: number;
    tempDelta: number;
    minStars: number;
    maxRetries: number;
    filterOffset: Record<string, number>;
    method: string;
    autofocusOnFilterChange: boolean;
    autofocusOnTemperatureChange: boolean;
    maxHFD: number;
    targetHFD: number;
  };
}

// 1. 状态数据（基本状态）
export interface SequencerStateData {
  settings: TargetSettings;
  targets: Target[];
  timeline: TimelineData[];
  activeTargetId: string | null;
  taskStatuses: Record<string, TaskStatus>;
  isRunning: boolean;
  currentProgress: number;
  errors: string[];
  notifications: MyNotification[];
  executionStatus: ExecutionStatus;
  // 增加以下属性
  autofocusConfig: {
    enabled: boolean;
    interval: number;
    tempDelta: number;
    minStars: number;
    maxRetries: number;
    filterOffset: Record<string, number>;
    method: string;
    autofocusOnFilterChange: boolean;
    autofocusOnTemperatureChange: boolean;
    maxHFD: number;
    targetHFD: number;
  };
  deviceStatus: {
    camera: {
      connected: boolean;
      temperature: number;
      cooling: boolean;
      targetTemp: number;
    };
    mount: {
      connected: boolean;
      tracking: boolean;
      slewing: boolean;
      parked: boolean;
    };
    focuser: {
      connected: boolean;
      position: number;
      moving: boolean;
      temperature: number;
    };
  };
}

// 2. 对焦状态相关
export interface SequencerFocusState {
  lastFocusTime: Date | null;
  focusHistory: Array<{
    timestamp: Date;
    position: number;
    temperature: number;
    hfd: number;
  }>;
  focusQualityMetrics: {
    minStars: number;
    targetHFD: number;
    maxHFD: number;
    focusScoreHistory: Array<{
      timestamp: Date;
      score: number;
      stars: number;
      hfd: number;
    }>;
  };
}

// 3. 环境安全及曝光优化设置
export interface SequencerSafetyState {
  weatherSafetyLimits: {
    maxCloudCover: number;
    maxHumidity: number;
    maxWindSpeed: number;
    minTemperature: number;
  };
  exposureOptimization: {
    enabled: boolean;
    targetADU: number;
    maxGain: number;
    minExposure: number;
    maxExposure: number;
    history: Array<{
      timestamp: Date;
      exposure: number;
      gain: number;
      adu: number;
      sky: number;
    }>;
  };
}

// 4. 任务依赖和验证信息
export interface SequencerTaskState {
  taskDependencies: Record<string, TaskDependencies>;
  taskValidation: Record<
    string,
    {
      attempts: number;
      successes: number;
      failures: number;
      startTime: Date;
    }
  >;
}

// 5. 方法动作定义
export interface SequencerActions {
  setSetting: (field: keyof TargetSettings, value: string) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  addTarget: (target: Target) => void;
  updateTarget: (targetId: string, target: Target) => void;
  removeTarget: (targetId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  startSequence: () => Promise<void>;
  stopSequence: () => void;
  pauseSequence: () => void;
  resumeSequence: () => void;
  addError: (error: string) => void;
  clearErrors: () => void;
  addNotification: (notification: MyNotification) => void;
  clearNotification: (id: string) => void;
  updateExecutionStatus: (status: Partial<ExecutionStatus>) => void;
  exportData: (format: "json" | "csv") => Promise<void>;
  importData: (data: ImportData) => Promise<void>;
  addTaskDependency: (taskId: string, deps: TaskDependencies) => void;
  removeTaskDependency: (taskId: string) => void;
  checkTaskDependencies: (taskId: string) => Promise<boolean>;
  validateTask: (taskId: string) => Promise<boolean>;
  setAutofocusConfig: (config: Partial<AutofocusConfig>) => void;
  rollbackTask: (taskId: string) => Promise<void>;
  executeTask: (task: ExposureTask) => Promise<void>;
}

export type SequencerState = SequencerStateData &
  SequencerFocusState &
  SequencerSafetyState &
  SequencerTaskState &
  SequencerActions;

// 定义初始设置
const DEFAULT_SETTINGS: TargetSettings = {
  delayStart: "0",
  sequenceMode: "one-after-another",
  startTime: "15:39",
  endTime: "15:39",
  duration: "01s",
  retryCount: 0,
  timeout: 0,
  coolCamera: false,
  unparkMount: false,
  meridianFlip: false,
  warmCamera: false,
  parkMount: false,
};

// 定义 getCurrentTimestamp 辅助函数
const getCurrentTimestamp = (): number => Date.now();

// 创建 store
export const useSequencerStore = create<SequencerState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      targets: [],
      timeline: [],
      activeTargetId: null,
      taskStatuses: {},
      isRunning: false,
      currentProgress: 0,
      errors: [],
      notifications: [],

      autofocusConfig: {
        enabled: false,
        interval: 30,
        tempDelta: 2,
        minStars: 20,
        maxRetries: 3,
        filterOffset: {},
        method: "hfd",
        autofocusOnFilterChange: true,
        autofocusOnTemperatureChange: true,
        maxHFD: 4.0,
        targetHFD: 2.5,
      },
      weatherData: null,
      executionStatus: {
        state: "idle",
        progress: 0,
        errors: [],
        warnings: [],
      },

      lastFocusTime: null,
      focusHistory: [],

      deviceStatus: {
        camera: {
          connected: false,
          temperature: 20,
          cooling: false,
          targetTemp: -10,
        },
        mount: {
          connected: false,
          tracking: false,
          slewing: false,
          parked: true,
        },
        focuser: {
          connected: false,
          position: 0,
          moving: false,
          temperature: 20,
        },
      },

      weatherSafetyLimits: {
        maxCloudCover: 80,
        maxHumidity: 85,
        maxWindSpeed: 30,
        minTemperature: -10,
      },

      focusQualityMetrics: {
        minStars: 20,
        targetHFD: 2.5,
        maxHFD: 4.0,
        focusScoreHistory: [],
      },

      exposureOptimization: {
        enabled: true,
        targetADU: 30000,
        maxGain: 100,
        minExposure: 1,
        maxExposure: 300,
        history: [],
      },

      taskDependencies: {},
      taskValidation: {},

      setSetting: (field, value) => {
        set((state) => ({
          settings: { ...state.settings, [field]: value },
        }));
      },

      saveSettings: async () => {
        try {
          const settings = get().settings;
          await fetch("/api/settings", {
            method: "POST",
            body: JSON.stringify(settings),
          });
          set((state) => ({
            notifications: [
              ...state.notifications,
              {
                id: getCurrentTimestamp().toString(),
                type: "success",
                message: "设置已保存",
                timestamp: new Date(),
                read: false,
              },
            ],
          }));
        } catch {
          set((state) => ({
            errors: [...state.errors, "保存设置失败"],
          }));
        }
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      addTarget: (target) => {
        set((state) => ({
          targets: [...state.targets, target],
          activeTargetId: target.id,
        }));
      },

      updateTarget: (targetId, target) => {
        set((state) => ({
          targets: state.targets.map((t) => (t.id === targetId ? target : t)),
        }));
      },

      removeTarget: (targetId) => {
        set((state) => ({
          targets: state.targets.filter((t) => t.id !== targetId),
          activeTargetId:
            state.activeTargetId === targetId
              ? state.targets[0]?.id || null
              : state.activeTargetId,
        }));
      },

      updateTaskStatus: (taskId, status) => {
        set((state) => ({
          taskStatuses: {
            ...state.taskStatuses,
            [taskId]: status,
          },
        }));
      },

      startSequence: async () => {
        const state = get();
        try {
          set({ isRunning: true });
          for (const target of state.targets) {
            for (const task of target.tasks) {
              if (!(await state.checkTaskDependencies(task.id))) {
                throw new Error(`Task dependencies not met: ${task.id}`);
              }
              if (!(await state.validateTask(task.id))) {
                throw new Error(`Task validation failed: ${task.id}`);
              }
              try {
                await state.executeTask(task);
              } catch (error) {
                await state.rollbackTask(task.id);
                throw error;
              }
            }
          }
        } catch (error) {
          set((state) => ({
            errors: [...state.errors, (error as Error).message],
          }));
        } finally {
          set({ isRunning: false });
        }
      },

      stopSequence: async () => {
        set({ isRunning: false, currentProgress: 0 });
      },

      pauseSequence: async () => {
        set({ isRunning: false });
      },

      resumeSequence: () => {
        set((state) => ({
          taskStatuses: Object.fromEntries(
            Object.entries(state.taskStatuses).map(([id, status]) => [
              id,
              {
                ...status,
                status: status.status === "paused" ? "running" : status.status,
              },
            ])
          ),
        }));
      },

      addError: (error) => {
        set((state) => ({
          errors: [...state.errors, error],
        }));
      },

      clearErrors: () => {
        set({ errors: [] });
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));
      },

      clearNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      setAutofocusConfig: (
        config: Partial<SequencerStateData["autofocusConfig"]>
      ) => {
        set((state) => ({
          autofocusConfig: {
            ...state.autofocusConfig,
            ...config,
          },
        }));
      },

      updateExecutionStatus: (status: Partial<ExecutionStatus>) =>
        set((state) => ({
          executionStatus: { ...state.executionStatus, ...status },
        })),

      runAutofocus: async () => {
        const state = get();
        try {
          state.updateExecutionStatus({ state: "running" });
          state.updateExecutionStatus({ state: "completed" });
        } catch (error) {
          state.updateExecutionStatus({
            state: "error",
            errors: [(error as Error).message],
          });
        }
      },

      exportData: async (format: "json" | "csv") => {
        const state = get();
        const data = {
          targets: state.targets,
          settings: state.settings,
          autofocusConfig: state.autofocusConfig,
        };
        if (format === "json") {
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sequencer_data.json";
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // TODO: 实现 CSV 导出
        }
      },

      importData: async (data: ImportData) => {
        // TODO: 验证导入的数据
        set((state) => ({
          ...state,
          targets: data.targets,
          settings: data.settings,
          autofocusConfig: data.autofocusConfig ?? state.autofocusConfig,
        }));
      },

      addTaskDependency: (taskId, deps) =>
        set((state) => ({
          taskDependencies: {
            ...state.taskDependencies,
            [taskId]: deps,
          },
        })),

      removeTaskDependency: (taskId) =>
        set((state) => ({
          taskDependencies: Object.fromEntries(
            Object.entries(state.taskDependencies).filter(
              ([key]) => key !== taskId
            )
          ),
        })),

      checkTaskDependencies: async (taskId) => {
        const state = get();
        const deps = state.taskDependencies[taskId];
        if (!deps) return true;
        const requiredTasks = deps.requiredTasks.every(
          (depId) => state.taskStatuses[depId]?.status === "completed"
        );
        const noBlocking = deps.blockingTasks.every(
          (depId) => state.taskStatuses[depId]?.status !== "running"
        );
        return requiredTasks && noBlocking;
      },

      validateTask: async (taskId) => {
        const state = get();
        const task = state.targets
          .flatMap((t) => t.tasks)
          .find((t) => t.id === taskId);
        if (!task) return false;
        const validation = state.taskValidation[taskId] || {
          attempts: 0,
          successes: 0,
          failures: 0,
          startTime: new Date(),
        };
        const group = state.targets
          .flatMap((t) => t.tasks)
          .find((t) => t.id === taskId);
        if (group?.validation) {
          if (validation.attempts >= group.validation.maxRetries) return false;
          if (validation.successes < group.validation.minSuccess) return false;
          const elapsed =
            (new Date().getTime() - validation.startTime.getTime()) / 1000;
          if (elapsed > group.validation.timeLimit) return false;
        }
        return true;
      },

      rollbackTask: async (taskId) => {
        const state = get();
        const task = state.targets
          .flatMap((t) => t.tasks)
          .find((t) => t.id === taskId);
        if (!task?.rollback?.enabled) return;
        for (const rollbackTask of task.rollback.tasks) {
          await state.executeTask(rollbackTask);
        }
      },

      executeTask: async (task: ExposureTask) => {
        const state = get();
        try {
          state.updateTaskStatus(task.id, {
            status: "running",
            startTime: new Date(),
            progress: 0,
          });
          await new Promise((resolve) =>
            setTimeout(resolve, task.duration * 1000)
          );
          state.updateTaskStatus(task.id, {
            status: "completed",
            endTime: new Date(),
            progress: 100,
          });
        } catch (error) {
          state.updateTaskStatus(task.id, {
            status: "failed",
            error: (error as Error).message,
            endTime: new Date(),
            progress: 100,
          });
          throw error;
        }
      },
    }),
    {
      name: "sequencer-storage",
      partialize: (state) => ({
        settings: state.settings,
        targets: state.targets,
        taskDependencies: state.taskDependencies,
      }),
    }
  )
);

// 导出常用的选择器
export const useTargets = () => useSequencerStore((state) => state.targets);
export const useActiveTarget = () => {
  const activeTargetId = useSequencerStore((state) => state.activeTargetId);
  const targets = useSequencerStore((state) => state.targets);
  return targets.find((t) => t.id === activeTargetId);
};
export const useTaskStatuses = () =>
  useSequencerStore((state) => state.taskStatuses);
export const useErrors = () => useSequencerStore((state) => state.errors);
export const useNotifications = () =>
  useSequencerStore((state) => state.notifications);
export const useExecutionStatus = () =>
  useSequencerStore((state) => state.executionStatus);
export const useWeatherSafetyLimits = () =>
  useSequencerStore((state) => state.weatherSafetyLimits);
export const useFocusQualityMetrics = () =>
  useSequencerStore((state) => state.focusQualityMetrics);
export const useExposureOptimization = () =>
  useSequencerStore((state) => state.exposureOptimization);
export const useAutofocusConfig = () => {
  return useSequencerStore((state) => state.autofocusConfig);
};
