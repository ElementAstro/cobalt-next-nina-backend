import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { AxiosError } from "axios";
import { ApiConfig, RetryConfig } from "../models/base";

export class ApplicationApi {
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

  async switchTab(
    tab:
      | "equipment"
      | "skyatlas"
      | "framing"
      | "flatwizard"
      | "sequencer"
      | "imaging"
      | "options"
  ): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/application/switch-tab`,
        params: { tab },
        timeout: this.config.timeout,
        retryConfig: {
          retries: this.getRetryConfig().retries,
          delay: this.getRetryConfig().delay,
          shouldRetry: this.getRetryConfig().shouldRetry,
        },
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to switch tab");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async screenshot(params: {
    resize?: boolean;
    quality?: number;
    size?: string;
    scale?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/application/screenshot`,
        params,
        timeout: this.config.timeout,
        retryConfig: {
          retries: this.getRetryConfig().retries,
          delay: this.getRetryConfig().delay,
          shouldRetry: this.getRetryConfig().shouldRetry,
        },
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to take screenshot");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const applicationApi = new ApplicationApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default applicationApi;
