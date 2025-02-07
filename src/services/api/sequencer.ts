import api, { ApiError } from "@/services/axios";
import { ApiResponse } from "@/services/models/response";
import { ApiConfig, RetryConfig } from "../models/base";

interface SequenceBaseJsonResponse {
  Response: SequenceBaseJson[];
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

type SequenceBaseJson =
  | {
      Conditions: string[];
      Items: string[];
      Triggers: string[];
      Status: string;
      Name: string;
    }
  | {
      GlobalTriggers: string[];
    };

export class SequencerApi {
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

  async getSequenceJson(): Promise<SequenceBaseJson[]> {
    try {
      const response = await api.request<SequenceBaseJsonResponse>({
        method: "GET",
        url: `${this.baseUrl}/sequence/json`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to get sequence JSON");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async startSequence(skipValidation: boolean = false): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/sequence/start`,
        params: { skipValidation },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to start sequence");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async stopSequence(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/sequence/stop`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to stop sequence");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async resetSequence(): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/sequence/reset`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to reset sequence");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async listAvailableSequences(): Promise<
    {
      Event: string;
      Time: string;
    }[]
  > {
    try {
      const response = await api.request<
        ApiResponse<
          {
            Event: string;
            Time: string;
          }[]
        >
      >({
        method: "GET",
        url: `${this.baseUrl}/sequence/list-available`,
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to list available sequences");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }

  async setTarget(
    name: string,
    ra: number,
    dec: number,
    rotation: number,
    index: number
  ): Promise<string> {
    try {
      const response = await api.request<ApiResponse<string>>({
        method: "GET",
        url: `${this.baseUrl}/sequence/set-target`,
        params: { name, ra, dec, rotation, index },
        timeout: this.config.timeout,
        retryConfig: this.getRetryConfig(),
      });

      if (!response.Success) {
        throw new Error(response.Error || "Failed to set target");
      }

      return response.Response;
    } catch (error) {
      throw error;
    }
  }
}

export const sequencerApi = new SequencerApi({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:1888",
  timeout: 10000,
  retries: 3,
});

export default sequencerApi;
