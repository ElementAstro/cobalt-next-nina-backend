import { create } from "zustand";
import { z } from "zod";
import Cookies from "js-cookie";
import logger from "@/utils/logger";

const ConnectionFormDataSchema = z.object({
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  isSSL: z.boolean(),
  rememberLogin: z.boolean(),
  connectionType: z.enum(["direct", "proxy"]),
  proxySettings: z
    .object({
      host: z.string().min(1),
      port: z.number().int().min(1).max(65535),
      auth: z
        .object({
          username: z.string().min(1),
          password: z.string().min(1),
        })
        .optional(),
    })
    .optional(),
});

interface ConnectionFormData {
  ip: string;
  port: number;
  username: string;
  password: string;
  isSSL: boolean;
  rememberLogin: boolean;
  connectionType: "direct" | "proxy";
  proxySettings?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

interface ConnectionConfigState {
  formData: ConnectionFormData;
  loadFromCookies: () => void;
  saveToCookies: () => void;
  updateFormData: (data: Partial<ConnectionFormData>) => void;
  update: (
    data: Partial<
      Omit<
        ConnectionConfigState,
        "update" | "loadFromCookies" | "saveToCookies" | "updateFormData"
      >
    >
  ) => void;

  // 高级设置
  connectionTimeout: number;
  maxRetries: number;
  debugMode: boolean;

  // 方法
  updateSettings: (
    settings: Partial<{
      connectionTimeout: number;
      maxRetries: number;
      debugMode: boolean;
    }>
  ) => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

const initialState = {
  formData: {
    ip: "",
    port: 5950,
    username: "",
    password: "",
    isSSL: false,
    rememberLogin: false,
    connectionType: "direct" as const,
    proxySettings: undefined,
  },
  connectionTimeout: 30,
  maxRetries: 3,
  debugMode: false,
};

export const useConnectionConfigStore = create<ConnectionConfigState>(
  (set, get) => ({
    ...initialState,

    loadFromCookies: () => {
      const cookieData = Cookies.get("connection_data");
      if (cookieData) {
        try {
          const parsedData = JSON.parse(cookieData);
          const validatedData = ConnectionFormDataSchema.parse(parsedData);
          set((state) => ({
            formData: { ...state.formData, ...validatedData },
          }));
          logger.info("Loaded connection data from cookies:", validatedData);
        } catch (error) {
          logger.error("Failed to parse or validate cookie data:", error);
        }
      }
    },

    saveToCookies: () => {
      const { formData } = get();
      try {
        ConnectionFormDataSchema.parse(formData);
        if (formData.rememberLogin) {
          Cookies.set("connection_data", JSON.stringify(formData), {
            expires: 30, // 30 days
            secure: true,
            sameSite: "strict",
          });
          logger.info("Saved connection data to cookies.");
        } else {
          Cookies.remove("connection_data");
          logger.info("Removed connection data from cookies.");
        }
      } catch (error) {
        logger.error("Invalid connection form data:", error);
      }
    },

    updateFormData: (data) => {
      try {
        const newData = { ...get().formData, ...data };
        ConnectionFormDataSchema.parse(newData);
        set(() => ({ formData: newData }));
        logger.info("Updated form data:", newData);
      } catch (error) {
        logger.error("Invalid form data update:", error);
      }
    },

    update: (data) => set((state) => ({ ...state, ...data })),

    updateSettings: (settings) => {
      set((state) => ({
        ...state,
        ...settings,
      }));
    },

    loadSettings: () => {
      const settings = localStorage.getItem("connection_settings");
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          set((state) => ({
            ...state,
            connectionTimeout:
              parsed.connectionTimeout ?? state.connectionTimeout,
            maxRetries: parsed.maxRetries ?? state.maxRetries,
            debugMode: parsed.debugMode ?? state.debugMode,
          }));
        } catch (error) {
          logger.error("Failed to load settings:", error);
        }
      }
    },

    saveSettings: () => {
      const { connectionTimeout, maxRetries, debugMode } = get();
      localStorage.setItem(
        "connection_settings",
        JSON.stringify({
          connectionTimeout,
          maxRetries,
          debugMode,
        })
      );
    },
  })
);
