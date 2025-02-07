import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";

interface FramingSolveResponse {
  RA: number;
  DEC: number;
  Rotation: number;
  PixelScale: number;
}

export class FramingApi {
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

  async solveFrame(
    imageData: string,
    options?: {
      scaleHint?: number;
      raHint?: number;
      decHint?: number;
      rotationHint?: number;
    }
  ): Promise<FramingSolveResponse> {
    try {
      const response = await api.request<ApiResponse<FramingSolveResponse>>({
        method: "POST",
        url: `${this.baseUrl}/framing/solve`,
        data: {
          ImageData: imageData,
          ScaleHint: options?.scaleHint,
          RaHint: options?.raHint,
          DecHint: options?.decHint,
          RotationHint: options?.rotationHint,
        },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to solve frame");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async getSolveStatus(solveId: string): Promise<{ status: string }> {
    try {
      const response = await api.request<ApiResponse<{ status: string }>>({
        method: "GET",
        url: `${this.baseUrl}/framing/solve-status/${solveId}`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get solve status");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async cancelSolve(solveId: string): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "POST",
        url: `${this.baseUrl}/framing/cancel-solve/${solveId}`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to cancel solve");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const framingApi = new FramingApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default framingApi;
