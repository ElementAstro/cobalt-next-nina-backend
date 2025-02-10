import { create } from "zustand";
import { toast } from "@/hooks/use-toast";
import {
  CalibrationPreset,
  CalibrationSettings,
} from "@/types/guiding/calibration";

export interface CalibrationStore {
  data: {
    raStars: number;
    decStars: number;
    cameraAngle: number;
    orthogonalError: number;
    raSpeed: string;
    decSpeed: string;
    predictedRaSpeed: string;
    predictedDecSpeed: string;
    combined: number;
    raDirection: string;
    createdAt: string;
  };
  settings: CalibrationSettings;
  isLandscape: boolean;
  showAnimation: boolean;
  lineLength: number;
  showGrid: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
  zoomLevel: number;
  exposure: number;
  gain: number;
  presets: {
    planetary: CalibrationPreset;
    deepsky: CalibrationPreset;
    [key: string]: CalibrationPreset;
  };
  currentPreset: string | null;
  applyPreset: (presetName: string) => void;
  saveAsPreset: (name: string, preset: Partial<CalibrationPreset>) => void;
  updateData: (data: Partial<CalibrationStore["data"]>) => void;
  updateSettings: (data: Partial<CalibrationSettings>) => void;
  handleRecalibrate: () => void;
  setIsLandscape: (value: boolean) => void;
  setShowAnimation: (value: boolean) => void;
  setLineLength: (value: number) => void;
  setShowGrid: (value: boolean) => void;
  setAutoRotate: (value: boolean) => void;
  setRotationSpeed: (value: number) => void;
  setZoomLevel: (value: number) => void;
  setExposure: (value: number) => void;
  setGain: (value: number) => void;
}

export const useCalibrationStore = create<CalibrationStore>((set, get) => ({
  data: {
    raStars: 7,
    decStars: 6,
    cameraAngle: -167.2,
    orthogonalError: 2.8,
    raSpeed: "13.409 角秒/秒\n10.264 像素/秒",
    decSpeed: "14.405 角秒/秒\n11.027 像素/秒",
    predictedRaSpeed: "无",
    predictedDecSpeed: "无",
    combined: 1,
    raDirection: "无",
    createdAt: "2024/11/2 21:11:20",
  },
  settings: {
    modifiedAt: "2024/11/2 21:11:20",
    focalLength: "300 毫米",
    resolution: "1.31 角秒/像素",
    raDirection: "无",
    combined: "合并: 1",
    raGuideSpeed: "无",
    decGuideSpeed: "无",
    decValue: "21.4 (est)",
    rotationAngle: "无",
  },
  isLandscape: false,
  showAnimation: false,
  lineLength: 100,
  showGrid: true,
  autoRotate: false,
  rotationSpeed: 0,
  zoomLevel: 1,
  exposure: 1000,
  gain: 0,
  presets: {
    planetary: {
      name: "行星摄影",
      description: "适用于月球、行星等明亮天体的校准设置",
      exposure: 0.5,
      gain: 50,
      lineLength: 80,
      rotationSpeed: 2,
      zoomLevel: 1.5,
      showGrid: true,
      autoRotate: true,
      showAnimation: true,
    },
    deepsky: {
      name: "深空摄影",
      description: "适用于星云、星团等暗弱天体的校准设置",
      exposure: 3.0,
      gain: 80,
      lineLength: 120,
      rotationSpeed: 1,
      zoomLevel: 1.0,
      showGrid: true,
      autoRotate: false,
      showAnimation: true,
    },
  },
  currentPreset: null,
  applyPreset: (presetName: string) => {
    const store = get();
    const preset = store.presets[presetName];
    if (!preset) return;
    set({
      exposure: preset.exposure,
      gain: preset.gain,
      lineLength: preset.lineLength,
      rotationSpeed: preset.rotationSpeed,
      zoomLevel: preset.zoomLevel,
      showGrid: preset.showGrid,
      autoRotate: preset.autoRotate,
      showAnimation: preset.showAnimation,
      currentPreset: presetName,
    });
  },
  saveAsPreset: (name: string, preset: Partial<CalibrationPreset>) => {
    const currentState = get();
    const newPreset: CalibrationPreset = {
      name,
      description: preset.description || "",
      exposure: preset.exposure ?? currentState.exposure,
      gain: preset.gain ?? currentState.gain,
      lineLength: preset.lineLength ?? currentState.lineLength,
      rotationSpeed: preset.rotationSpeed ?? currentState.rotationSpeed,
      zoomLevel: preset.zoomLevel ?? currentState.zoomLevel,
      showGrid: preset.showGrid ?? currentState.showGrid,
      autoRotate: preset.autoRotate ?? currentState.autoRotate,
      showAnimation: preset.showAnimation ?? currentState.showAnimation,
    };
    set((state) => ({
      presets: {
        ...state.presets,
        [name]: newPreset,
      },
    }));
  },
  updateData: (data) => {
    set((state) => ({
      data: {
        ...state.data,
        ...data,
      },
    }));
  },
  updateSettings: (data) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...data,
      },
    }));
  },
  handleRecalibrate: () => {
    toast({
      title: "重新校准中...",
      description: "系统正在进行重新校准",
    });
  },
  setIsLandscape: (value: boolean) =>
    set(() => ({
      isLandscape: value,
    })),
  setShowAnimation: (value: boolean) =>
    set(() => ({
      showAnimation: value,
    })),
  setLineLength: (value: number) =>
    set(() => ({
      lineLength: value,
    })),
  setShowGrid: (value: boolean) =>
    set(() => ({
      showGrid: value,
    })),
  setAutoRotate: (value: boolean) =>
    set(() => ({
      autoRotate: value,
    })),
  setRotationSpeed: (value: number) =>
    set(() => ({
      rotationSpeed: value,
    })),
  setZoomLevel: (value: number) =>
    set(() => ({
      zoomLevel: value,
    })),
  setExposure: (value: number) =>
    set(() => ({
      exposure: value,
    })),
  setGain: (value: number) =>
    set(() => ({
      gain: value,
    })),
}));

export default useCalibrationStore;
