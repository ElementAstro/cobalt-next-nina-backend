import { create } from "zustand";

interface DeviceDataState {
  telescopeData: {
    focalLength: number;
    aperture: number;
    model: string;
    status: "idle" | "exposing" | "focusing" | "error";
  };
  cameraData: {
    model: string;
    sensorSize: [number, number];
    pixelSize: number;
    temperature: number;
    coolingPower: number;
    maxExposure: number;
    isCooling: boolean;
  };
  mountData: {
    model: string;
    ra: number;
    dec: number;
    altitude: number;
    azimuth: number;
    pierSide: "east" | "west";
    isTracking: boolean;
    isParked: boolean;
    isSlewing: boolean;
  };
  updateTelescopeData: (
    data: Partial<DeviceDataState["telescopeData"]>
  ) => void;
  updateCameraData: (data: Partial<DeviceDataState["cameraData"]>) => void;
  updateMountData: (data: Partial<DeviceDataState["mountData"]>) => void;
  setInitializing: (initializing: boolean) => void;
  initializing: boolean;
  update: (
    data: Partial<
      Omit<
        DeviceDataState,
        | "update"
        | "updateTelescopeData"
        | "updateCameraData"
        | "updateMountData"
        | "setInitializing"
      >
    >
  ) => void;
}

export const useDeviceDataStore = create<DeviceDataState>((set) => ({
  telescopeData: {
    focalLength: 0,
    aperture: 0,
    model: "",
    status: "idle",
  },
  cameraData: {
    model: "",
    sensorSize: [0, 0],
    pixelSize: 0,
    temperature: 20,
    coolingPower: 0,
    maxExposure: 3600,
    isCooling: false,
  },
  mountData: {
    model: "",
    ra: 0,
    dec: 0,
    altitude: 0,
    azimuth: 0,
    pierSide: "east",
    isTracking: false,
    isParked: true,
    isSlewing: false,
  },
  updateTelescopeData: (data) =>
    set((state) => ({
      telescopeData: { ...state.telescopeData, ...data },
    })),
  updateCameraData: (data) =>
    set((state) => ({
      cameraData: { ...state.cameraData, ...data },
    })),
  updateMountData: (data) =>
    set((state) => ({
      mountData: { ...state.mountData, ...data },
    })),
  initializing: false,
  setInitializing: (initializing) => set({ initializing }),
  update: (data) => set((state) => ({ ...state, ...data })),
}));
