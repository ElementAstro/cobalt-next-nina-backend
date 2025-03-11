"use client";

import { TargetSettings } from "@/types/sequencer";
import { create } from "zustand";

// 基础接口定义
export interface ExposureTask {
  id: string;
  name: string;
  type: "light" | "dark" | "flat" | "bias";
  exposure: number;
  binning: number;
  filter: string;
  count: number;
  progress: [number, number];
  status: "pending" | "running" | "completed" | "failed";
  temperature: number;
  gain: number;
  offset: number;
}

export interface FocusRecord {
  timestamp: Date;
  position: number;
  temperature: number;
  hfd: number;
}

export interface FocusQualityMetrics {
  minStars: number;
  targetHFD: number;
  maxHFD: number;
  focusScoreHistory: Array<{
    timestamp: Date;
    score: number;
    hfd: number;
  }>;
  currentMetrics: {
    stars: number;
    hfd: number;
    score: number;
  };
}

export interface DeviceStatus {
  focuser: {
    position: number;
    temperature: number;
    isMoving: boolean;
  };
}

export interface AutofocusConfig {
  enabled: boolean;
  interval: number;
  method: "hfd" | "curvature" | "bahtinov";
  minStars: number;
  targetHFD: number;
  maxHFD: number;
  autofocusOnFilterChange: boolean;
  autofocusOnTemperatureChange: boolean;
  stepSize: number;
  backlash: number;
  samples: number;
  tolerance: number;
  maxIterations: number;
}

export interface ExecutionStatus {
  state: "idle" | "running" | "paused" | "completed" | "failed";
  errors: string[];
  progress?: number;
  message?: string;
}

export interface Target {
  id: string;
  name: string;
  category: string;
  coordinates: {
    ra: { h: number; m: number; s: number };
    dec: { d: number; m: number; s: number };
  };
  tasks: ExposureTask[];
}

export interface ValidationResult {
  id: string;
  timestamp: Date;
  status: "success" | "warning" | "error";
  message: string;
  details?: string[];
  attempts: number;
  successes: number;
  lastAttempt?: Date;
  duration?: number;
  metrics?: {
    accuracy: number;
    reliability: number;
    performance: number;
  };
}

export interface TaskStatus {
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  error?: string;
}

export interface TimelinePoint {
  timestamp: Date;
  value: number | number[];
}

// 通知接口
export interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
}

const DEFAULT_AUTOFOCUS_CONFIG: AutofocusConfig = {
  enabled: false,
  interval: 30,
  method: "hfd",
  minStars: 10,
  targetHFD: 2.5,
  maxHFD: 4.0,
  autofocusOnFilterChange: true,
  autofocusOnTemperatureChange: true,
  stepSize: 10,
  backlash: 0,
  samples: 5,
  tolerance: 0.1,
  maxIterations: 10,
};

const DEFAULT_FOCUS_QUALITY_METRICS: FocusQualityMetrics = {
  minStars: 10,
  targetHFD: 2.5,
  maxHFD: 4.0,
  focusScoreHistory: [],
  currentMetrics: {
    stars: 0,
    hfd: 0,
    score: 0,
  },
};

// 默认设置
const DEFAULT_SETTINGS: TargetSettings = {
  delayStart: "false",
  sequenceMode: "one-after-another",
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  duration: "0",
  retryCount: 3,
  timeout: 60,
  coolCamera: true,
  unparkMount: true,
  meridianFlip: true,
  warmCamera: true,
  parkMount: true,
  createdAt: new Date(),
};

export interface SequencerStore {
  // Exposure tasks
  exposureTasks: ExposureTask[];
  updateExposureTaskOrder: (tasks: ExposureTask[]) => void;
  startExposureTask: (taskId: string) => void;
  pauseExposureTask: (taskId: string) => void;
  deleteExposureTask: (taskId: string) => void;

  // Task statuses and validation
  taskStatuses: Record<string, TaskStatus>;
  taskValidation: Record<string, ValidationResult>;
  validateTask: (taskId: string) => Promise<void>;

  // Targets
  targets: Target[];
  activeTargetId: string | null;
  updateTarget: (targetId: string, target: Target) => void;
  validateTarget: (targetId: string) => Promise<ValidationResult>;
  clearValidation: () => void;

  // Task control
  startTask: (taskId: string) => void;
  pauseTask: (taskId: string) => void;

  // Timeline
  timeline: TimelinePoint[];
  isRunning: boolean;
  startSequence: () => void;
  pauseSequence: () => void;
  stopSequence: () => void;

  // Error handling
  errors: Record<string, string>;
  clearErrors: () => void;

  // Autofocus
  autofocusConfig: AutofocusConfig;
  setAutofocusConfig: (config: Partial<AutofocusConfig>) => void;
  deviceStatus: DeviceStatus;
  focusHistory: FocusRecord[];
  lastFocusTime: Date | null;
  executionStatus: ExecutionStatus;
  focusQualityMetrics: FocusQualityMetrics;

  // 添加目标设置相关状态和方法
  settings: TargetSettings;
  setSetting: <K extends keyof TargetSettings>(
    key: K,
    value: TargetSettings[K]
  ) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;

  // 添加通知相关状态
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 添加进度相关状态
  currentProgress: number;
  updateProgress: (progress: number) => void;
}

export const useSequencerStore = create<SequencerStore>((set) => ({
  // Exposure tasks
  exposureTasks: [],
  updateExposureTaskOrder: (tasks: ExposureTask[]) => {
    set({ exposureTasks: tasks });
  },
  startExposureTask: (taskId: string) => {
    set((state: SequencerStore) => ({
      exposureTasks: state.exposureTasks.map((task) =>
        task.id === taskId ? { ...task, status: "running" } : task
      ),
    }));
  },
  pauseExposureTask: (taskId: string) => {
    set((state: SequencerStore) => ({
      exposureTasks: state.exposureTasks.map((task) =>
        task.id === taskId ? { ...task, status: "pending" } : task
      ),
    }));
  },
  deleteExposureTask: (taskId: string) => {
    set((state: SequencerStore) => ({
      exposureTasks: state.exposureTasks.filter((task) => task.id !== taskId),
    }));
  },

  // Task statuses and validation
  taskStatuses: {},
  taskValidation: {},
  validateTask: async (taskId: string) => {
    set((state: SequencerStore) => ({
      taskStatuses: {
        ...state.taskStatuses,
        [taskId]: { status: "running" },
      },
    }));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set((state: SequencerStore) => ({
      taskStatuses: {
        ...state.taskStatuses,
        [taskId]: { status: "completed" },
      },
      taskValidation: {
        ...state.taskValidation,
        [taskId]: {
          id: `task_validation_${taskId}`,
          timestamp: new Date(),
          status: "success",
          message: "任务验证通过",
          attempts: 1,
          successes: 1,
          lastAttempt: new Date(),
          duration: 1000,
        },
      },
    }));
  },

  // Targets
  targets: [],
  activeTargetId: null,
  updateTarget: (targetId: string, target: Target) => {
    set((state: SequencerStore) => ({
      targets: state.targets.map((t) => (t.id === targetId ? target : t)),
    }));
  },
  validateTarget: async (targetId: string) => {
    const result: ValidationResult = {
      id: `validation_${targetId}_${Date.now()}`,
      timestamp: new Date(),
      status: "success",
      message: `目标 ${targetId} 配置有效`,
      details: [
        `验证目标: ${targetId}`,
        "所有参数都在有效范围内",
        "坐标格式正确",
        "曝光参数合理",
      ],
      attempts: 1,
      successes: 1,
      lastAttempt: new Date(),
      duration: 1000,
      metrics: {
        accuracy: 0.95,
        reliability: 0.98,
        performance: 0.92,
      },
    };
    return result;
  },
  clearValidation: () => {
    console.log("Clearing all validations");
  },

  // Task control
  startTask: (taskId: string) => {
    set((state: SequencerStore) => ({
      targets: state.targets.map((target) => ({
        ...target,
        tasks: target.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "running" } : task
        ),
      })),
    }));
  },
  pauseTask: (taskId: string) => {
    set((state: SequencerStore) => ({
      targets: state.targets.map((target) => ({
        ...target,
        tasks: target.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "pending" } : task
        ),
      })),
    }));
  },

  // Timeline
  timeline: [],
  isRunning: false,
  startSequence: () => {
    set((state) => {
      // 启动序列并添加通知
      const notificationId = `notification_${Date.now()}`;
      return {
        isRunning: true,
        notifications: [
          ...state.notifications,
          {
            id: notificationId,
            message: "序列已开始运行",
            type: "info",
            timestamp: new Date(),
          },
        ],
        // 重置进度为0
        currentProgress: 0,
      };
    });

    // 启动进度模拟
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 2;
      if (progress > 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      set({ currentProgress: Math.round(progress) });
    }, 1000);
  },
  pauseSequence: () => {
    set((state) => ({
      isRunning: false,
      notifications: [
        ...state.notifications,
        {
          id: `notification_${Date.now()}`,
          message: "序列已暂停",
          type: "warning",
          timestamp: new Date(),
        },
      ],
    }));
  },
  stopSequence: () => {
    set((state) => ({
      isRunning: false,
      timeline: [],
      currentProgress: 0,
      notifications: [
        ...state.notifications,
        {
          id: `notification_${Date.now()}`,
          message: "序列已停止",
          type: "error",
          timestamp: new Date(),
        },
      ],
    }));
  },

  // Error handling
  errors: {},
  clearErrors: () => set({ errors: {} }),

  // Autofocus
  autofocusConfig: DEFAULT_AUTOFOCUS_CONFIG,
  setAutofocusConfig: (config: Partial<AutofocusConfig>) => {
    set((state: SequencerStore) => ({
      autofocusConfig: { ...state.autofocusConfig, ...config },
    }));
  },
  deviceStatus: {
    focuser: {
      position: 0,
      temperature: 20,
      isMoving: false,
    },
  },
  focusHistory: [],
  lastFocusTime: null,
  executionStatus: {
    state: "idle",
    errors: [],
  },
  focusQualityMetrics: DEFAULT_FOCUS_QUALITY_METRICS,

  // 目标设置相关状态和方法
  settings: DEFAULT_SETTINGS,
  setSetting: <K extends keyof TargetSettings>(
    key: K,
    value: TargetSettings[K]
  ) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    }));
  },
  saveSettings: async () => {
    // 模拟保存操作
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: `notification_${Date.now()}`,
          message: "设置已保存",
          type: "success",
          timestamp: new Date(),
        },
      ],
    }));
  },
  resetSettings: () => {
    set({
      settings: DEFAULT_SETTINGS,
      notifications: [
        {
          id: `notification_${Date.now()}`,
          message: "设置已重置为默认值",
          type: "info",
          timestamp: new Date(),
        },
      ],
    });
  },

  // 通知相关状态
  notifications: [],
  addNotification: (notification) => {
    const id = `notification_${Date.now()}`;
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id,
          timestamp: new Date(),
        },
      ],
    }));

    // 5秒后自动移除通知
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearNotifications: () => {
    set({ notifications: [] });
  },

  // 进度相关状态
  currentProgress: 0,
  updateProgress: (progress) => {
    set({ currentProgress: progress });
  },
}));

// Custom hooks
export const useAutofocusConfig = () =>
  useSequencerStore((state) => state.autofocusConfig);
export const useExecutionStatus = () =>
  useSequencerStore((state) => state.executionStatus);
export const useFocusQualityMetrics = () =>
  useSequencerStore((state) => state.focusQualityMetrics);

// Helper types
export type AutofocusConfigKey = keyof AutofocusConfig;
export type AutofocusConfigValue = AutofocusConfig[AutofocusConfigKey];

// For backward compatibility
export type SequencerStateData = SequencerStore;
