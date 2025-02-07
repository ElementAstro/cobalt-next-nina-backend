import { AxiosError } from "axios";
import { ApiError } from "../axios";

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export interface RetryConfig {
  retries: number;
  delay: number;
  shouldRetry: (error: ApiError | AxiosError) => boolean;
}
