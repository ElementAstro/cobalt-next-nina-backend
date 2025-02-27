import { create } from "zustand";
import axios, { AxiosError } from "axios";

export interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
  };
}

export interface Response {
  description: string;
  content?: Record<string, unknown>;
}

export interface PathOperation {
  summary?: string;
  tags?: string[];
  parameters?: Parameter[];
  responses?: Record<string, Response>;
}

export interface PathOperations {
  get?: PathOperation;
  post?: PathOperation;
  put?: PathOperation;
  delete?: PathOperation;
  patch?: PathOperation;
  options?: PathOperation;
  head?: PathOperation;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathOperations>;
  components?: Record<string, unknown>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

interface SwaggerState {
  spec: OpenAPISpec | null;
  isLoading: boolean;
  error: string | null;
  selectedEndpoint: string | null;
  fetchSpec: (url: string) => Promise<void>;
  setSelectedEndpoint: (endpoint: string | null) => void;
}

export const useSwaggerStore = create<SwaggerState>((set) => ({
  spec: null,
  isLoading: false,
  error: null,
  selectedEndpoint: null,

  fetchSpec: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<OpenAPISpec>(url);
      set({ spec: response.data, isLoading: false });
    } catch (err) {
      const error = err as Error | AxiosError;
      set({ error: error.message, isLoading: false });
    }
  },

  setSelectedEndpoint: (endpoint: string | null) => {
    set({ selectedEndpoint: endpoint });
  },
}));
