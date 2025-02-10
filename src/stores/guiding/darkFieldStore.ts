import { create } from "zustand";
import { toast } from "@/hooks/use-toast";
import { DarkFieldState } from "@/types/guiding/darkfield";
import { RealDarkFieldAPI } from "@/services/api/darkfield";
import { MockDarkFieldAPI } from "@/services/models/darkfield";

export interface DarkFieldStore extends DarkFieldState {
  resetSettings: () => void;
  startCreation: () => Promise<void>;
  cancelCreation: () => void;
  setMinExposure: (value: number) => void;
  setMaxExposure: (value: number) => void;
  setFramesPerExposure: (value: number) => void;
  setLibraryType: (value: "modify" | "create") => void;
  setIsoValue: (value: number) => void;
  setBinningMode: (value: string) => void;
  setCoolingEnabled: (value: boolean) => void;
  setTargetTemperature: (value: number) => void;
  setIsMockMode: (value: boolean) => void;
  setDarkFrameCount: (value: number) => void;
  setGainValue: (value: number) => void;
  setOffsetValue: (value: number) => void;
  fetchStatistics: () => Promise<void>;
  fetchHistory: (days: number) => Promise<void>;
  exportReport: () => Promise<void>;
  pauseCreation: () => Promise<void>;
  resumeCreation: () => Promise<void>;
  validateSettings: () => Promise<void>;
  getDiskSpace: () => Promise<void>;
}

const defaultState: DarkFieldState = {
  minExposure: 0.5,
  maxExposure: 3.0,
  framesPerExposure: 10,
  libraryType: "create",
  isoValue: 800,
  binningMode: "1x1",
  coolingEnabled: true,
  targetTemperature: -10,
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: "",
  progress: {
    currentFrame: 0,
    totalFrames: 0,
    currentExposure: 0,
    estimatedTimeLeft: 0,
    currentTemperature: 0,
    stage: "preparing",
    warnings: [],
    performance: {
      frameRate: 0,
      processingTime: 0,
      savingTime: 0,
    },
  },
  isPaused: false,
  validationErrors: [],
  validationWarnings: [],
  diskSpace: {
    total: 0,
    used: 0,
    available: 0,
  },
  isMockMode: false,
  darkFrameCount: 50,
  gainValue: 0,
  offsetValue: 0,
  statistics: {
    totalFrames: 0,
    averageExposure: 0,
    lastCreated: "",
    librarySize: 0,
    totalTime: 0,
    avgTemperature: 0,
    successRate: 0,
    compression: 0,
  },
  history: [],
  performance: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskActivity: 0,
    networkSpeed: 0,
  },
  calibration: {
    isCalibrated: false,
    lastCalibration: "",
    calibrationData: {},
  },
  systemStatus: {
    isCameraConnected: false,
    isTemperatureStable: false,
    isFocusLocked: false,
    batteryLevel: 0,
  },
};

export const useDarkFieldStore = create<DarkFieldStore>((set, get) => {
  const api =
    process.env.NEXT_PUBLIC_MOCK_API === "true"
      ? new MockDarkFieldAPI()
      : new RealDarkFieldAPI();
  let progressTimer: NodeJS.Timeout | null = null;

  return {
    ...defaultState,

    resetSettings: () => {
      set((state) => ({
        ...state,
        isLoading: true,
        isSuccess: false,
        isError: false,
        progress: {
          currentFrame: 0,
          totalFrames: state.darkFrameCount * state.framesPerExposure,
          currentExposure: state.minExposure,
          estimatedTimeLeft: 0,
          currentTemperature: 0,
          stage: "preparing",
          warnings: [],
          performance: {
            frameRate: 0,
            processingTime: 0,
            savingTime: 0,
          },
        },
      }));
      toast({
        title: "设置已重置",
        description: "所有设置已恢复为默认值",
      });
    },

    startCreation: async () => {
      if (progressTimer) {
        toast({
          title: "创建已在进行中",
          description: "请稍后再试",
          variant: "destructive",
        });
        return;
      }
      set((state) => ({
        ...state,
        isLoading: true,
        isSuccess: false,
        isError: false,
        progress: {
          currentFrame: 0,
          totalFrames: state.darkFrameCount * state.framesPerExposure,
          currentExposure: state.minExposure,
          estimatedTimeLeft: 0,
          currentTemperature: state.targetTemperature,
          stage: "preparing",
          warnings: [],
          performance: {
            frameRate: 0,
            processingTime: 0,
            savingTime: 0,
          },
        },
      }));

      try {
        const {
          minExposure,
          maxExposure,
          framesPerExposure,
          libraryType,
          isoValue,
          binningMode,
          targetTemperature,
          gainValue,
          offsetValue,
        } = get();

        await api.createDarkField({
          minExposure,
          maxExposure,
          framesPerExposure,
          libraryType,
          isoValue,
          binningMode,
          targetTemperature,
          gainValue,
          offsetValue,
        });

        const totalTime = maxExposure * framesPerExposure * 1000; // 假设 maxExposure 单位为秒
        let currentTime = 0;
        const updateInterval = 1000;
        progressTimer = setInterval(() => {
          currentTime += updateInterval;
          const progress = currentTime / totalTime;

          if (progress >= 1) {
            if (progressTimer) {
              clearInterval(progressTimer);
              progressTimer = null;
            }
            set((state) => ({
              ...state,
              isLoading: false,
              isSuccess: true,
              progress: {
                currentFrame: state.darkFrameCount * state.framesPerExposure,
                totalFrames: state.darkFrameCount * state.framesPerExposure,
                currentExposure: maxExposure,
                estimatedTimeLeft: 0,
                currentTemperature: targetTemperature,
                stage: "completed",
                warnings: [],
                performance: {
                  frameRate: 0,
                  processingTime: 0,
                  savingTime: 0,
                },
              },
            }));
            toast({
              title: "创建成功",
              description: "暗场库创建完成",
            });
            return;
          }

          set((state) => ({
            ...state,
            progress: {
              currentFrame: Math.floor(
                progress * state.darkFrameCount * state.framesPerExposure
              ),
              totalFrames: state.darkFrameCount * state.framesPerExposure,
              currentExposure:
                minExposure + (maxExposure - minExposure) * progress,
              estimatedTimeLeft: Math.max(0, (totalTime - currentTime) / 1000),
              currentTemperature: targetTemperature,
              stage: "capturing",
              warnings: progress > 0.8 ? ["即将完成"] : [],
              performance: {
                frameRate: 0,
                processingTime: 0,
                savingTime: 0,
              },
            },
          }));
        }, updateInterval);
      } catch (error) {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }
        set((state) => ({
          ...state,
          isLoading: false,
          isError: true,
          errorMessage: error instanceof Error ? error.message : "创建失败",
          progress: {
            ...state.progress,
            stage: "error",
            warnings: [error instanceof Error ? error.message : "未知错误"],
          },
        }));
        toast({
          title: "创建失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    cancelCreation: () => {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
        set((state) => ({
          ...state,
          isLoading: false,
          isError: true,
          errorMessage: "创建已取消",
          progress: {
            ...state.progress,
            stage: "cancelled",
            warnings: ["创建已取消"],
          },
        }));
        toast({
          title: "创建已取消",
          description: "暗场库创建已被取消",
          variant: "destructive",
        });
      } else {
        toast({
          title: "没有正在进行的创建任务",
          description: "当前没有暗场库创建任务可以取消",
          variant: "default",
        });
      }
    },

    setMinExposure: (value) =>
      set((state) => ({ ...state, minExposure: value })),
    setMaxExposure: (value) =>
      set((state) => ({ ...state, maxExposure: value })),
    setFramesPerExposure: (value) =>
      set((state) => ({ ...state, framesPerExposure: value })),
    setLibraryType: (value) =>
      set((state) => ({ ...state, libraryType: value })),
    setIsoValue: (value) => set((state) => ({ ...state, isoValue: value })),
    setBinningMode: (value) =>
      set((state) => ({ ...state, binningMode: value })),
    setCoolingEnabled: (value) =>
      set((state) => ({ ...state, coolingEnabled: value })),
    setTargetTemperature: (value) =>
      set((state) => ({ ...state, targetTemperature: value })),
    setIsMockMode: (value) => set((state) => ({ ...state, isMockMode: value })),
    setDarkFrameCount: (value) =>
      set((state) => ({ ...state, darkFrameCount: value })),
    setGainValue: (value) => set((state) => ({ ...state, gainValue: value })),
    setOffsetValue: (value) =>
      set((state) => ({ ...state, offsetValue: value })),

    fetchStatistics: async () => {
      try {
        const response = await api.getStatistics();
        set((state) => ({ ...state, statistics: response }));
      } catch (error) {
        toast({
          title: "获取统计数据失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    fetchHistory: async (days: number) => {
      try {
        const response = await api.getHistory(days);
        set((state) => ({ ...state, history: response }));
      } catch (error) {
        toast({
          title: "获取历史数据失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    exportReport: async () => {
      try {
        const blob = await api.exportReport();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `darkfield-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({
          title: "导出成功",
          description: "报告已成功导出",
        });
      } catch (error) {
        toast({
          title: "导出失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    pauseCreation: async () => {
      try {
        await api.pauseCreation();
        set((state) => ({ ...state, isPaused: true }));
      } catch (error) {
        toast({
          title: "暂停失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    resumeCreation: async () => {
      try {
        await api.resumeCreation();
        set((state) => ({ ...state, isPaused: false }));
      } catch (error) {
        toast({
          title: "恢复失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    validateSettings: async () => {
      const state = get();
      try {
        const result = await api.validateSettings({
          minExposure: state.minExposure,
          maxExposure: state.maxExposure,
          // 其他设置项...
        });
        set((state) => ({
          ...state,
          validationErrors: result.errors,
          validationWarnings: result.warnings,
        }));
      } catch (error) {
        toast({
          title: "验证失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },

    getDiskSpace: async () => {
      try {
        const space = await api.getDiskSpace();
        set((state) => ({ ...state, diskSpace: space }));
      } catch (error) {
        toast({
          title: "获取磁盘空间失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },
  };
});
