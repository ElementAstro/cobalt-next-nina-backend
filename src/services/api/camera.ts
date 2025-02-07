import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import type { CameraData } from "../models/camera";
import { AxiosError } from "axios";
import { ApiConfig, RetryConfig } from "../models/base";

interface CameraSearchResponse {
  Response: CameraItem[];
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

interface CameraItem {
  DisplayName: string;
  DeviceId: string;
  Name: string;
}

interface CameraInfoResponse {
  Response: CameraData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface CaptureResponse {
  imageUrl: string;
  // Add other specific properties if needed
}

export class CameraApi {
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

  async getCameraInfo(): Promise<CameraData> {
    try {
      const response = await api.request<CameraInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get camera info");
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
        url: `${this.baseUrl}/equipment/camera/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to camera");
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
        url: `${this.baseUrl}/equipment/camera/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect camera");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setReadoutMode(mode: number): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/set-readout`,
        params: { mode },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set readout mode");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async cool(
    temperature: number,
    minutes: number,
    cancel?: boolean
  ): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/cool`,
        params: { temperature, minutes, cancel },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to cool camera");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async warm(minutes: number, cancel?: boolean): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/warm`,
        params: { minutes, cancel },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to warm camera");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async abortExposure(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/abort-exposure`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to abort exposure");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setDewHeater(power: boolean): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/dew-heater`,
        params: { power },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set dew heater");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setBinning(binning: string): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/set-binning`,
        params: { binning },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set binning");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async capture(params: {
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
  }): Promise<CaptureResponse> {
    try {
      const response = await api.request<ApiResponse<CaptureResponse>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/capture`,
        params,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to capture image");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async search(): Promise<CameraItem[]> {
    try {
      const response = await api.request<CameraSearchResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/camera/search`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to search cameras");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const cameraApi = new CameraApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default cameraApi;
