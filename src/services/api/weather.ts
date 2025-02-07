import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { AxiosError } from "axios";
import { ApiConfig, RetryConfig } from "../models/base";

export interface WeatherInfoResponse {
  Response: WeatherData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface WeatherData {
  AveragePeriod: number;
  CloudCover: number;
  DewPoint: number;
  Humidity: number;
  Pressure: number;
  RainRate: string;
  SkyBrightness: string;
  SkyQuality: string;
  SkyTemperature: string;
  StarFWHM: string;
  Temperature: number;
  WindDirection: number;
  WindGust: string;
  WindSpeed: number;
  SupportedActions: string[];
  Connected: boolean;
  Name: string;
  DisplayName: string;
  Description: string;
  DriverInfo: string;
  DriverVersion: string;
  DeviceId: string;
}

export class WeatherApi {
  private baseUrl: string;
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.config = {
      timeout: config.timeout ?? 10000,
      retries: config.retries ?? 3,
      baseUrl: config.baseUrl,
    };
  }

  private getRetryConfig(): RetryConfig {
    return {
      retries: this.config.retries,
      delay: 1000,
      shouldRetry: (error: ApiError | AxiosError) => {
        if (error instanceof ApiError) {
          return (
            error.type === "NETWORK_ERROR" || error.type === "SERVER_ERROR"
          );
        } else {
          return false;
        }
      },
    };
  }

  async getWeatherInfo(): Promise<WeatherData> {
    try {
      const response = await api.request<WeatherInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/weather/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get weather info");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async connect(skipRescan: boolean = false): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/weather/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to weather");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async disconnect(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/weather/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect weather");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const weatherApi = new WeatherApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default weatherApi;
