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

export const useViewerStore = create<CameraState>((set) => ({
  zoom: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  rotation: 0,
  whiteBalance: "Auto",
  focusPoint: { x: 50, y: 50 },
  images: [],
  setImages: (images) => set({ images }),
  setZoom: (zoom) => set({ zoom }),
  setBrightness: (brightness) => set({ brightness }),
  setContrast: (contrast) => set({ contrast }),
  setSaturation: (saturation) => set({ saturation }),
  setRotation: (rotation) => set({ rotation }),
  setWhiteBalance: (whiteBalance) => set({ whiteBalance }),
  setFocusPoint: (focusPoint) => set({ focusPoint }),
  resetSettings: (settings) => set((state) => ({ ...state, ...settings })),
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
