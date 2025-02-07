import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";

interface GuiderInfoResponse {
  Response: GuiderData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface GuiderData {
  Connected: boolean;
  Name: string;
  DisplayName: string;
  Description: string;
  DriverInfo: string;
  DriverVersion: string;
  DeviceId: string;
  CanClearCalibration: boolean;
  CanSetShiftRate: boolean;
  CanGetLockPosition: boolean;
  SupportedActions: string[];
  RMSError: {
    RA: {
      Pixel: number;
      Arcseconds: number;
    };
    Dec: {
      Pixel: number;
      Arcseconds: number;
    };
    Total: {
      Pixel: number;
      Arcseconds: number;
    };
    PeakRA: {
      Pixel: number;
      Arcseconds: number;
    };
    PeakDec: {
      Pixel: number;
      Arcseconds: number;
    };
  };
  PixelScale: number;
  LastGuideStep: {
    RADistanceRaw: number;
    DECDistanceRaw: number;
    RADuration: number;
    DECDuration: number;
  };
  State: "Looping" | "LostLock" | "Guiding" | "Stopped" | "Calibrating";
}

interface GuideStepsHistoryResponse {
  Response: GuideStepsHistoryData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface GuideStepsHistoryData {
  RMS: {
    RA: number;
    Dec: number;
    Total: number;
    RAText: string;
    DecText: string;
    TotalText: string;
    PeakRAText: string;
    PeakDecText: string;
    Scale: number;
    PeakRA: number;
    PeakDec: number;
    DataPoints: number;
  };
  Interval: number;
  MaxY: number;
  MinY: number;
  MaxDurationY: number;
  MinDurationY: number;
  GuideSteps: GuideStep[];
  HistorySize: number;
  PixelScale: number;
  Scale: number;
}

interface GuideStep {
  Id: number;
  IdOffsetLeft: number;
  IdOffsetRight: number;
  RADistanceRaw: number;
  RADistanceRawDisplay: number;
  RADuration: number;
  DECDistanceRaw: number;
  DECDistanceRawDisplay: number;
  DECDuration: number;
  Dither: string;
}

export class GuiderApi {
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
      shouldRetry: (error) => {
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

  async getGuiderInfo(): Promise<GuiderData> {
    try {
      const response = await api.request<GuiderInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/guider/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get guider info");
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
        url: `${this.baseUrl}/equipment/guider/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to guider");
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
        url: `${this.baseUrl}/equipment/guider/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect guider");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async startGuiding(calibrate?: boolean): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/guider/start`,
        params: { calibrate },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to start guiding");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async stopGuiding(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/guider/stop`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to stop guiding");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async clearCalibration(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/guider/clear-calibration`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to clear calibration");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async getGuideStepsHistory(): Promise<GuideStepsHistoryData> {
    try {
      const response = await api.request<GuideStepsHistoryResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/guider/graph`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get guide steps history");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const guiderApi = new GuiderApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default guiderApi;
