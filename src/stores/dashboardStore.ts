import { create } from "zustand";
import { useCameraStore } from "./cameraStore";

// Zustand store
export interface ExposureSettings {
  shutterSpeed: string;
  iso: string;
  aperture: string;
  focusPoint: string;
  filterType: string;
  exposureTime: number;
  exposureMode: string;
  gain: number;
  offset: number;
  binning: string;
}

export interface State {
  exposureTime: number;
  burstMode: boolean;
  burstCount: number;
  intervalMode: boolean;
  intervalTime: number;
  exposureMode: string;
  whiteBalance: string;
  iso: number;
  aperture: number;
  focusPoint: number;
  filterType: string;
  gain: number;
  offset: number;
  binning: string;
  resetSettings: (settings: ExposureSettings) => void;
  setExposureTime: (value: number) => void;
  toggleBurstMode: (value: boolean) => void;
  setBurstCount: (value: number) => void;
  toggleIntervalMode: (value: boolean) => void;
  setIntervalTime: (value: number) => void;
  setExposureMode: (value: string) => void;
  setWhiteBalance: (value: string) => void;
  setISO: (value: number) => void;
  setAperture: (value: number) => void;
  setFocusPoint: (value: number) => void;
  setFilterType: (value: string) => void;
  setGain: (value: number) => void;
  setOffset: (value: number) => void;
  setBinning: (value: string) => void;
}

export const useExposureStore = create<State>((set) => ({
  exposureTime: 60,
  burstMode: false,
  burstCount: 3,
  intervalMode: false,
  intervalTime: 60,
  exposureMode: "Manual",
  whiteBalance: "Auto",
  iso: 100,
  aperture: 2.8,
  focusPoint: 50,
  filterType: "None",
  gain: 0,
  offset: 0,
  binning: "1x1",
  resetSettings: (settings: ExposureSettings) =>
    set({
      exposureTime: settings.exposureTime,
      burstMode: false,
      burstCount: 3,
      intervalMode: false,
      intervalTime: 60,
      exposureMode: settings.exposureMode || "Manual",
      iso: parseInt(settings.iso) || 100,
      aperture: parseFloat(settings.aperture) || 2.8,
      focusPoint: parseInt(settings.focusPoint) || 50,
      filterType: settings.filterType || "None",
      gain: settings.gain || 0,
      offset: settings.offset || 0,
      binning: settings.binning || "1x1",
    }),
  setExposureTime: async (value) => {
    const camera = useCameraStore.getState();
    if (camera.isConnected) {
      const clampedValue = Math.min(
        Math.max(value, camera.exposureMin),
        camera.exposureMax
      );
      await camera.setExposure(clampedValue);
      set({ exposureTime: clampedValue });
    }
  },
  toggleBurstMode: (value) => set({ burstMode: value }),
  setBurstCount: (value) => set({ burstCount: value }),
  toggleIntervalMode: (value) => set({ intervalMode: value }),
  setIntervalTime: (value) => set({ intervalTime: value }),
  setExposureMode: (value) => set({ exposureMode: value }),
  setWhiteBalance: (value) => set({ whiteBalance: value }),
  setISO: (value) => set({ iso: value }),
  setAperture: (value) => set({ aperture: value }),
  setFocusPoint: (value) => set({ focusPoint: value }),
  setFilterType: (value) => set({ filterType: value }),
  setGain: async (value) => {
    const camera = useCameraStore.getState();
    if (camera.isConnected) {
      const clampedValue = Math.min(
        Math.max(value, camera.gainMin),
        camera.gainMax
      );
      await camera.setGain(clampedValue);
      set({ gain: clampedValue });
    }
  },
  setOffset: async (value) => {
    const camera = useCameraStore.getState();
    if (camera.isConnected) {
      const clampedValue = Math.min(
        Math.max(value, camera.offsetMin),
        camera.offsetMax
      );
      await camera.setOffset(clampedValue);
      set({ offset: clampedValue });
    }
  },
  setBinning: async (value) => {
    const camera = useCameraStore.getState();
    if (camera.isConnected) {
      await camera.setBinning(value);
      set({ binning: value });
    }
  },
}));

// 添加相机状态同步函数
export const syncWithCamera = () => {
  const camera = useCameraStore.getState();
  if (camera.isConnected) {
    useExposureStore.setState({
      exposureTime: camera.exposure,
      gain: camera.gain,
      offset: camera.offset,
      binning: `${camera.binning.x}x${camera.binning.y}`,
    });
  }
};

// 监听相机连接状态
useCameraStore.subscribe((state) => {
  if (state.isConnected) {
    syncWithCamera();
  }
});

export interface ViewerState {
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  histogramEnabled: boolean;
  aspectRatio: string;
  gridType: string;
  colorTemperature: number;
  tint: number;
  setExposure: (value: number) => void;
  setHighlights: (value: number) => void;
  setShadows: (value: number) => void;
  setSharpness: (value: number) => void;
  setHistogramEnabled: (enabled: boolean) => void;
  setAspectRatio: (ratio: string) => void;
  setGridType: (type: string) => void;
  setColorTemperature: (value: number) => void;
  setTint: (value: number) => void;
  resetAll: () => void;
}

export interface ViewerSettings {
  zoom: number;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  whiteBalance: string;
  focusPoint: { x: number; y: number };
}

interface CameraState extends ViewerSettings {
  setZoom: (zoom: number) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setSaturation: (saturation: number) => void;
  setRotation: (rotation: number) => void;
  setWhiteBalance: (whiteBalance: string) => void;
  setFocusPoint: (focusPoint: { x: number; y: number }) => void;
  resetSettings: (settings: Partial<ViewerSettings>) => void;
  images: string[];
  setImages: (images: string[]) => void;
}

export const useViewerStore = create<CameraState & ViewerState>((set) => ({
  zoom: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  whiteBalance: "Auto",
  focusPoint: { x: 50, y: 50 },
  images: [],
  setImages: (images: string[]) => set({ images }),
  setZoom: (zoom: number) => set({ zoom }),
  setBrightness: (brightness: number) => set({ brightness }),
  setContrast: (contrast: number) => set({ contrast }),
  setSaturation: (saturation: number) => set({ saturation }),
  setRotation: (rotation: number) => set({ rotation }),
  setWhiteBalance: (whiteBalance: string) => set({ whiteBalance }),
  setFocusPoint: (focusPoint: { x: number; y: number }) => set({ focusPoint }),
  resetSettings: (settings: Partial<ViewerSettings>) =>
    set((state: CameraState & ViewerState) => ({ ...state, ...settings })),
  exposure: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  histogramEnabled: false,
  aspectRatio: "free",
  gridType: "thirds",
  colorTemperature: 6500, // 默认为日光色温
  tint: 0,
  setExposure: (value: number) => set({ exposure: value }),
  setHighlights: (value: number) => set({ highlights: value }),
  setShadows: (value: number) => set({ shadows: value }),
  setSharpness: (value: number) => set({ sharpness: value }),
  setHistogramEnabled: (enabled: boolean) => set({ histogramEnabled: enabled }),
  setAspectRatio: (ratio: string) => set({ aspectRatio: ratio }),
  setGridType: (type: string) => set({ gridType: type }),
  setColorTemperature: (value: number) => set({ colorTemperature: value }),
  setTint: (value: number) => set({ tint: value }),
  resetAll: () =>
    set({
      zoom: 1,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      exposure: 0,
      highlights: 0,
      shadows: 0,
      sharpness: 0,
      focusPoint: { x: 50, y: 50 },
      colorTemperature: 6500,
      tint: 0,
    }),
}));

export interface Location {
  latitude: number;
  longitude: number;
}

interface DashboardState {
  location: Location | null;
  setLocation: (location: Location) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  location: null,
  setLocation: (location) => set({ location }),
}));
