import { create } from "zustand";
import logger from "@/utils/logger";
import { CameraData, BinningMode } from "@/services/models/camera";
import cameraApi from "@/services/api/camera";

export interface TempDataPoint {
  time: string;
  temperature: number;
}

interface CameraState {
  isConnected: boolean;
  isRecording: boolean;
  displayName: string;
  deviceId: string;
  name: string;
  temperature: number;
  targetTemperature: number;
  coolerOn: boolean;
  coolerPower: number;
  canSetTemperature: boolean;
  atTargetTemp: boolean;
  exposure: number;
  exposureMax: number;
  exposureMin: number;
  gain: number;
  gainMin: number;
  gainMax: number;
  defaultGain: number;
  canSetGain: boolean;
  gains: (number | null)[];
  binning: { x: number; y: number };
  binningModes: BinningMode[];
  offset: number;
  offsetMin: number;
  offsetMax: number;
  defaultOffset: number;
  canSetOffset: boolean;
  readoutMode: number;
  readoutModes: string[];
  readoutModeForNormalImages: number;
  readoutModeForSnapImages: number;
  usbLimit: number;
  canSetUSBLimit: boolean;
  usbLimitMin: number;
  usbLimitMax: number;
  temperatureHistory: TempDataPoint[];

  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  setExposure: (value: number) => Promise<void>;
  setGain: (value: number) => Promise<void>;
  setOffset: (value: number) => Promise<void>;
  setBinning: (binning: string) => Promise<void>;
  setCooler: (enabled: boolean) => Promise<void>;
  setTemperature: (value: number, minutes: number) => Promise<void>;
  warmUp: (minutes: number) => Promise<void>;
  abortExposure: () => Promise<void>;
  setUSBLimit: (value: number) => Promise<void>;
  setReadoutMode: (mode: number) => Promise<void>;
  capture: (params: CaptureParams) => Promise<void>;
  fetchStatus: () => Promise<void>;
}

interface CaptureParams {
  solve?: boolean;
  duration?: number;
  gain?: number;
  getResult?: boolean;
  resize?: boolean;
  quality?: number;
  size?: string;
  scale?: number;
  stream?: boolean;
  omitImage?: boolean;
  waitForResult?: boolean;
}

export const useCameraStore = create<CameraState>((set) => ({
  isConnected: false,
  isRecording: false,
  displayName: "",
  deviceId: "",
  name: "",
  temperature: 0,
  targetTemperature: 0,
  coolerOn: false,
  coolerPower: 0,
  canSetTemperature: false,
  atTargetTemp: false,
  exposure: 0,
  exposureMax: 3600,
  exposureMin: 0.001,
  gain: 0,
  gainMin: 0,
  gainMax: 100,
  defaultGain: 0,
  canSetGain: false,
  gains: [],
  binning: { x: 1, y: 1 },
  binningModes: [],
  offset: 0,
  offsetMin: 0,
  offsetMax: 255,
  defaultOffset: 0,
  canSetOffset: false,
  readoutMode: 0,
  readoutModes: [],
  readoutModeForNormalImages: 0,
  readoutModeForSnapImages: 0,
  usbLimit: 0,
  canSetUSBLimit: false,
  usbLimitMin: 0,
  usbLimitMax: 100,
  temperatureHistory: [],

  connect: async (skipRescan = false) => {
    try {
      await cameraApi.connect(skipRescan);
      const status = await cameraApi.getCameraInfo();
      set((state) => ({
        ...state,
        isConnected: true,
        ...mapCameraDataToState(status),
      }));
      logger.info("Camera connected successfully.");
    } catch (error) {
      logger.error("Failed to connect camera:", error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await cameraApi.disconnect();
      set({ isConnected: false });
      logger.info("Camera disconnected successfully.");
    } catch (error) {
      logger.error("Failed to disconnect camera:", error);
      throw error;
    }
  },

  // Since there are no dedicated API endpoints for setting exposure, gain, or offset,
  // we update the local state directly.
  setExposure: async (value: number) => {
    try {
      // Optionally, insert an API call if available in the future.
      set((state) => ({ ...state, exposure: value }));
      logger.info(`Exposure set to: ${value}`);
    } catch (error) {
      logger.error("Failed to set exposure:", error);
      throw error;
    }
  },
  setOffset: async (value: number) => {
    try {
      set((state) => ({ ...state, offset: value }));
      logger.info(`Offset set to: ${value}`);
    } catch (error) {
      logger.error("Failed to set offset:", error);
      throw error;
    }
  },
  setGain: async (value: number) => {
    try {
      set((state) => ({ ...state, gain: value }));
      logger.info(`Gain set to: ${value}`);
    } catch (error) {
      logger.error("Failed to set gain:", error);
      throw error;
    }
  },
  setBinning: async (binning: string) => {
    try {
      await cameraApi.setBinning(binning);
      set((state) => ({
        ...state,
        binning: { x: parseInt(binning), y: parseInt(binning) },
      }));
      logger.info(`Binning set to: ${binning}`);
    } catch (error) {
      logger.error("Failed to set binning:", error);
      throw error;
    }
  },
  setCooler: async (enabled: boolean) => {
    try {
      // Using dew heater endpoint as a proxy for cooler state change.
      await cameraApi.setDewHeater(enabled);
      set((state) => ({ ...state, coolerOn: enabled }));
      logger.info(`Cooler set to: ${enabled}`);
    } catch (error) {
      logger.error("Failed to set cooler:", error);
      throw error;
    }
  },
  setTemperature: async (value: number, minutes: number) => {
    try {
      await cameraApi.cool(value, minutes);
      set((state) => ({ ...state, targetTemperature: value }));
      logger.info(`Temperature set to: ${value} for ${minutes} minutes`);
    } catch (error) {
      logger.error("Failed to set temperature:", error);
      throw error;
    }
  },
  warmUp: async (minutes: number) => {
    try {
      await cameraApi.warm(minutes);
      // Optionally, update state by fetching latest status.
      logger.info(`Warming up for ${minutes} minutes`);
    } catch (error) {
      logger.error("Failed to warm up:", error);
      throw error;
    }
  },
  abortExposure: async () => {
    try {
      await cameraApi.abortExposure();
      logger.info("Exposure aborted.");
    } catch (error) {
      logger.error("Failed to abort exposure:", error);
      throw error;
    }
  },
  setUSBLimit: async (value: number) => {
    try {
      // If an API endpoint becomes available, call it here.
      set((state) => ({ ...state, usbLimit: value }));
      logger.info(`USB limit set to: ${value}`);
    } catch (error) {
      logger.error("Failed to set USB limit:", error);
      throw error;
    }
  },
  setReadoutMode: async (mode: number) => {
    try {
      await cameraApi.setReadoutMode(mode);
      set((state) => ({ ...state, readoutMode: mode }));
      logger.info(`Readout mode set to: ${mode}`);
    } catch (error) {
      logger.error("Failed to set readout mode:", error);
      throw error;
    }
  },
  capture: async (params: CaptureParams) => {
    try {
      await cameraApi.capture(params);
      logger.info("Capture started.");
    } catch (error) {
      logger.error("Failed to capture:", error);
      throw error;
    }
  },
  fetchStatus: async () => {
    try {
      const status = await cameraApi.getCameraInfo();
      set((state) => ({
        ...state,
        ...mapCameraDataToState(status),
      }));
      logger.info("Camera status fetched successfully.");
    } catch (error) {
      logger.error("Failed to fetch camera status:", error);
      throw error;
    }
  },
}));

function mapCameraDataToState(data: CameraData) {
  return {
    displayName: data.DisplayName,
    deviceId: data.DeviceId,
    name: data.Name,
    temperature: data.Temperature,
    targetTemperature: data.TargetTemp,
    coolerOn: data.CoolerOn,
    coolerPower: data.CoolerPower,
    canSetTemperature: data.CanSetTemperature,
    atTargetTemp: data.AtTargetTemp,
    gain: data.Gain,
    gainMin: data.GainMin,
    gainMax: data.GainMax,
    defaultGain: data.DefaultGain,
    canSetGain: data.CanSetGain,
    gains: data.Gains,
    binning: { x: data.BinX, y: data.BinY },
    binningModes: data.BinningModes,
    offset: data.Offset,
    offsetMin: data.OffsetMin,
    offsetMax: data.OffsetMax,
    defaultOffset: data.DefaultOffset,
    canSetOffset: data.CanSetOffset,
    readoutMode: data.ReadoutMode,
    readoutModes: data.ReadoutModes,
    readoutModeForNormalImages: data.ReadoutModeForNormalImages,
    readoutModeForSnapImages: data.ReadoutModeForSnapImages,
    usbLimit: data.USBLimit,
    canSetUSBLimit: data.CanSetUSBLimit,
    usbLimitMin: data.USBLimitMin,
    usbLimitMax: data.USBLimitMax,
  };
}
