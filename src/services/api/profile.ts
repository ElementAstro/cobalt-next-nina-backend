import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";

export interface ConfigData {
  [key: string]: unknown;
}

export class ConfigApi {
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

  async getConfig(): Promise<ConfigData> {
    try {
      const response = await api.request<ApiResponse<ConfigData>>({
        method: "GET",
        url: `${this.baseUrl}/config`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get config");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setConfig(config: ConfigData): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "POST",
        url: `${this.baseUrl}/config`,
        data: config,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set config");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  // 使用 unknown 代替 any
  async getConfigItem(key: string): Promise<unknown> {
    try {
      const response = await api.request<ApiResponse<unknown>>({
        method: "GET",
        url: `${this.baseUrl}/config/${key}`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || `Failed to get config item: ${key}`);
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  // 使用 unknown 代替 any
  async setConfigItem(key: string, value: unknown): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "POST",
        url: `${this.baseUrl}/config/${key}`,
        data: { value },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || `Failed to set config item: ${key}`);
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const configApi = new ConfigApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default configApi;
