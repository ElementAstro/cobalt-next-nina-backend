import api, { ApiError, ApiErrorType } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { AxiosError } from "axios";
import { ApiConfig, RetryConfig } from "../models/base";

interface FWInfoResponse {
  Response: FWInfo;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

interface FilterInfoResponse {
  Response: FilterInfo;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface FWInfo {
  Connected: boolean;
  Name: string;
  DisplayName: string;
  Description: string;
  DriverInfo: string;
  DriverVersion: string;
  DeviceId: string;
  IsMoving: boolean;
  SupportedActions: string[];
  SelectedFilter: SelectedFilter | null;
  AvailableFilters: AvailableFilter[];
}

export interface SelectedFilter {
  Name: string;
  Id: number;
}

export interface AvailableFilter {
  Name: string;
  Id: number;
}

export interface FilterInfo {
  Name: string;
  FocusOffset: number;
  Position: number;
  AutoFocusExposureTime: number;
  AutoFocusFilter: boolean;
  FlatWizardFilterSettings: FlatWizardFilterSettings;
  AutoFocusBinning: AutoFocusBinning;
  AutoFocusGain: number;
  AutoFocusOffset: number;
}

export interface FlatWizardFilterSettings {
  FlatWizardMode: number;
  HistogramMeanTarget: number;
  HistogramTolerance: number;
  MaxFlatExposureTime: number;
  MinFlatExposureTime: number;
  MaxAbsoluteFlatDeviceBrightness: number;
  MinAbsoluteFlatDeviceBrightness: number;
  Gain: number;
  Offset: number;
  Binning: Binning;
}

export interface AutoFocusBinning {
  Name: string;
  X: number;
  Y: number;
}

export interface Binning {
  Name: string;
  X: number;
  Y: number;
}

export class FilterWheelApi {
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
            error.type === ApiErrorType.NetworkError ||
            error.type === ApiErrorType.ServerError
          );
        } else if (error instanceof AxiosError) {
          return error.code === "ECONNABORTED" || !error.response;
        }
        return false;
      },
    };
  }

  async getFilterWheelInfo(): Promise<FWInfo> {
    try {
      const response = await api.request<FWInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/filterwheel/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get filterwheel info");
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
        url: `${this.baseUrl}/equipment/filterwheel/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to filterwheel");
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
        url: `${this.baseUrl}/equipment/filterwheel/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect filterwheel");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async changeFilter(filterId: number): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/filterwheel/change-filter`,
        params: { filterId },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to change filter");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async getFilterInfo(filterId: number): Promise<FilterInfo> {
    try {
      const response = await api.request<FilterInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/filterwheel/filter-info`,
        params: { filterId },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get filter info");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const filterWheelApi = new FilterWheelApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default filterWheelApi;
