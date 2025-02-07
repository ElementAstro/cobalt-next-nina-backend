import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";

interface FocuserInfoResponse {
  Response: FocuserData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface FocuserData {
  Absolute: boolean;
  MaxIncrement: number;
  MaxStep: number;
  StepSize: number;
  TempCompAvailable: boolean;
  TempComp: boolean;
  Temperature: number;
  Position: number;
  IsMoving: boolean;
  Connected: boolean;
}

export class FocuserApi {
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

  async getFocuserInfo(): Promise<FocuserData> {
    try {
      const response = await api.request<FocuserInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/focuser/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get focuser info");
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
        url: `${this.baseUrl}/equipment/focuser/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to focuser");
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
        url: `${this.baseUrl}/equipment/focuser/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect focuser");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async move(position: number): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/focuser/move`,
        params: { position },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to move focuser");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async halt(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/focuser/halt`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to halt focuser");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setTempComp(tempComp: boolean): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/focuser/set-temp-comp`,
        params: { tempComp },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(
          response.Error || "Failed to set temperature compensation"
        );
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const focuserApi = new FocuserApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default focuserApi;
