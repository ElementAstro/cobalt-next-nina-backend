import { create } from "zustand";
import logger from "@/utils/logger";
import { WeatherData } from "@/services/api/weather";
import weatherApi from "@/services/api/weather";

interface WeatherState {
  isConnected: boolean;
  averagePeriod: number;
  cloudCover: number;
  dewPoint: number;
  humidity: number;
  pressure: number;
  rainRate: string;
  skyBrightness: string;
  skyQuality: string;
  skyTemperature: string;
  starFWHM: string;
  temperature: number;
  windDirection: number;
  windGust: string;
  windSpeed: number;
  supportedActions: string[];
  name: string;
  displayName: string;
  description: string;
  driverInfo: string;
  driverVersion: string;
  deviceId: string;

  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  fetchStatus: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  isConnected: false,
  averagePeriod: 0,
  cloudCover: 0,
  dewPoint: 0,
  humidity: 0,
  pressure: 0,
  rainRate: "",
  skyBrightness: "",
  skyQuality: "",
  skyTemperature: "",
  starFWHM: "",
  temperature: 0,
  windDirection: 0,
  windGust: "",
  windSpeed: 0,
  supportedActions: [],
  name: "",
  displayName: "",
  description: "",
  driverInfo: "",
  driverVersion: "",
  deviceId: "",

  connect: async (skipRescan = false) => {
    try {
      await weatherApi.connect(skipRescan);
      const status = await weatherApi.getWeatherInfo();
      set((state) => ({
        ...state,
        isConnected: true,
        ...mapWeatherDataToState(status),
      }));
      logger.info("Weather connected successfully.");
    } catch (error) {
      logger.error("Failed to connect weather:", error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await weatherApi.disconnect();
      set({ isConnected: false });
      logger.info("Weather disconnected successfully.");
    } catch (error) {
      logger.error("Failed to disconnect weather:", error);
      throw error;
    }
  },

  fetchStatus: async () => {
    try {
      const status = await weatherApi.getWeatherInfo();
      set((state) => ({
        ...state,
        ...mapWeatherDataToState(status),
      }));
      logger.info("Weather status fetched successfully.");
    } catch (error) {
      logger.error("Failed to fetch weather status:", error);
      throw error;
    }
  },
}));

function mapWeatherDataToState(data: WeatherData) {
  return {
    averagePeriod: data.AveragePeriod,
    cloudCover: data.CloudCover,
    dewPoint: data.DewPoint,
    humidity: data.Humidity,
    pressure: data.Pressure,
    rainRate: data.RainRate,
    skyBrightness: data.SkyBrightness,
    skyQuality: data.SkyQuality,
    skyTemperature: data.SkyTemperature,
    starFWHM: data.StarFWHM,
    temperature: data.Temperature,
    windDirection: data.WindDirection,
    windGust: data.WindGust,
    windSpeed: data.WindSpeed,
    supportedActions: data.SupportedActions,
    name: data.Name,
    displayName: data.DisplayName,
    description: data.Description,
    driverInfo: data.DriverInfo,
    driverVersion: data.DriverVersion,
    deviceId: data.DeviceId,
  };
}
