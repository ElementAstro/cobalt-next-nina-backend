import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";
import { TelescopeData } from "../models/telescope";

interface TelescopeInfoResponse {
  Response: TelescopeData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export class TelescopeApi {
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

  async getTelescopeInfo(): Promise<TelescopeData> {
    try {
      const response = await api.request<TelescopeInfoResponse>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/info`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get telescope info");
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
        url: `${this.baseUrl}/equipment/telescope/connect`,
        params: { skipRescan },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to connect to telescope");
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
        url: `${this.baseUrl}/equipment/telescope/disconnect`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to disconnect telescope");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async slewToCoordinates(
    rightAscension: number,
    declination: number
  ): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/slew-to-coordinates`,
        params: { rightAscension, declination },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to slew to coordinates");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async syncToCoordinates(
    rightAscension: number,
    declination: number
  ): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/sync-to-coordinates`,
        params: { rightAscension, declination },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to sync to coordinates");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async park(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/park`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to park telescope");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async findHome(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/find-home`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to find home");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setTracking(tracking: boolean): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/equipment/telescope/set-tracking`,
        params: { tracking },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set tracking");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const telescopeApi = new TelescopeApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default telescopeApi;
