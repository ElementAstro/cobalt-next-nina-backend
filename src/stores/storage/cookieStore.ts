import { create } from "zustand";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";
import log from "@/utils/logger";
import { toast } from "@/hooks/use-toast";

export interface CookieData {
  name: string;
  value: string;
  selected?: boolean;
  expires?: Date | number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
  maxAge?: number;
}

interface CookieState {
  cookies: CookieData[];
  loadCookies: () => void;
  addCookie: (cookie: CookieData) => void;
  updateCookie: (cookie: CookieData) => void;
  deleteCookie: (name: string) => void;
  selectAll: (selected: boolean) => void;
  toggleSelect: (name: string, selected: boolean) => void;
  deleteSelected: () => void;
  encryptCookie: (data: string, key: string) => string;
  decryptCookie: (data: string, key: string) => string | null;
}

export const useCookieStore = create<CookieState>((set, get) => ({
  cookies: [],

  loadCookies: () => {
    log.info("Loading cookies from browser");
    const cookieList = Object.entries(Cookies.get()).map(([name, value]) => ({
      name,
      value: String(value),
      selected: false,
    }));
    set({ cookies: cookieList });
    log.info("Cookies loaded successfully");
  },

  addCookie: (cookie) => {
    try {
      log.info(`Adding cookie: ${cookie.name}`);
      Cookies.set(cookie.name, cookie.value, {
        path: cookie.path || "/",
        sameSite: cookie.sameSite || "strict",
        expires: cookie.expires,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
      });
      get().loadCookies();
      log.info(`Cookie added successfully: ${cookie.name}`);
    } catch (error) {
      log.error(`Error adding cookie: ${cookie.name}`, error);
      throw new Error("Failed to add cookie");
    }
  },

  updateCookie: (cookie) => {
    log.info(`Updating cookie: ${cookie.name}`);
    Cookies.set(cookie.name, cookie.value, {
      path: "/",
      sameSite: "strict",
    });
    get().loadCookies();
    log.info(`Cookie updated successfully: ${cookie.name}`);
  },

  deleteCookie: (name) => {
    log.info(`Deleting cookie: ${name}`);
    Cookies.remove(name, { path: "/" });
    get().loadCookies();
    log.info(`Cookie deleted successfully: ${name}`);
  },

  selectAll: (selected) => {
    log.info(`Selecting all cookies: ${selected}`);
    set({
      cookies: get().cookies.map((cookie) => ({ ...cookie, selected })),
    });
    log.info("All cookies selected successfully");
  },

  toggleSelect: (name, selected) => {
    log.info(`Toggling selection for cookie: ${name}`);
    set({
      cookies: get().cookies.map((cookie) =>
        cookie.name === name ? { ...cookie, selected } : cookie
      ),
    });
    log.info(`Cookie selection toggled successfully: ${name}`);
  },

  deleteSelected: () => {
    log.info("Deleting selected cookies");
    get()
      .cookies.filter((cookie) => cookie.selected)
      .forEach((cookie) => {
        Cookies.remove(cookie.name, { path: "/" });
      });
    get().loadCookies();
    log.info("Selected cookies deleted successfully");
  },

  encryptCookie: (data, key) => {
    log.info("Encrypting cookie data");
    if (!key || key.length < 8) {
      log.error("Encryption key must be at least 8 characters");
      throw new Error("Encryption key must be at least 8 characters");
    }
    try {
      const encryptedData = CryptoJS.AES.encrypt(data, key).toString();
      log.info("Cookie data encrypted successfully");
      return encryptedData;
    } catch (error) {
      log.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  },

  decryptCookie: (data, key) => {
    log.info("Decrypting cookie data");
    if (!key || key.length < 8) {
      log.error("Decryption key must be at least 8 characters");
      throw new Error("Decryption key must be at least 8 characters");
    }
    try {
      const bytes = CryptoJS.AES.decrypt(data, key);
      const result = bytes.toString(CryptoJS.enc.Utf8);
      if (!result) {
        log.error("Decryption failed - invalid key or data");
        throw new Error("Decryption failed - invalid key or data");
      }
      log.info("Cookie data decrypted successfully");
      return result;
    } catch (error) {
      log.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  },
}));

export interface CookieOption {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
}

export interface CookieConsentProps {
  privacyPolicyUrl?: string;
  cookieOptions?: CookieOption[];
  onAccept?: (acceptedOptions: string[]) => void;
  onDecline?: () => void;
  position?: "bottom" | "top";
}

export const defaultCookieOptions: CookieOption[] = [
  {
    id: "necessary",
    name: "必要",
    description: "网站功能所必需的Cookie",
    isRequired: true,
  },
  {
    id: "analytics",
    name: "分析",
    description: "帮助我们理解如何改善网站",
    isRequired: false,
  },
  {
    id: "marketing",
    name: "营销",
    description: "用于向您展示相关广告",
    isRequired: false,
  },
];

// Zustand store
export const useCookieConsentStore = create<{
  isVisible: boolean;
  acceptedOptions: string[];
  showDetails: boolean;
  setIsVisible: (visible: boolean) => void;
  setAcceptedOptions: (
    options: string[] | ((prev: string[]) => string[])
  ) => void;
  toggleOption: (optionId: string) => void;
  setShowDetails: (show: boolean) => void;
}>((set) => ({
  isVisible: false,
  acceptedOptions: [],
  showDetails: false,
  setIsVisible: (visible) => set({ isVisible: visible }),
  setAcceptedOptions: (options) =>
    set((state) => ({
      acceptedOptions:
        typeof options === "function"
          ? options(state.acceptedOptions)
          : options,
    })),
  toggleOption: (optionId) => {
    set((state) => {
      const newOptions = state.acceptedOptions.includes(optionId)
        ? state.acceptedOptions.filter((id) => id !== optionId)
        : [...state.acceptedOptions, optionId];

      toast({
        title: "设置已更新",
        description: `已${
          newOptions.includes(optionId) ? "启用" : "禁用"
        }该 Cookie 类别`,
        duration: 2000,
      });

      return {
        acceptedOptions: newOptions,
      };
    });
  },
  setShowDetails: (show) => set({ showDetails: show }),
}));
