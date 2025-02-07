export interface ApiResponse<T> {
  Response: T;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}
