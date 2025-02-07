import { create } from "zustand";
import telescopeApi from "@/services/api/telescope";
import { TelescopeData } from "@/services/models/telescope";
import logger from "@/utils/logger";

interface TelescopeState {
  telescopeInfo: TelescopeData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  slewToCoordinates: (
    rightAscension: number,
    declination: number
  ) => Promise<void>;
  syncToCoordinates: (
    rightAscension: number,
    declination: number
  ) => Promise<void>;
  park: () => Promise<void>;
  findHome: () => Promise<void>;
  setTracking: (tracking: boolean) => Promise<void>;
  getTelescopeInfo: () => Promise<void>;
}

export const useTelescopeStore = create<TelescopeState>((set) => ({
  telescopeInfo: null,
  isConnected: false,
  isLoading: false,
  error: null,
  connect: async (skipRescan = false) => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.connect(skipRescan);
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info, isConnected: true });
      logger.info("Telescope connected successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to connect to telescope";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({
        error: errorMessage,
        isConnected: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.disconnect();
      set({ telescopeInfo: null, isConnected: false });
      logger.info("Telescope disconnected successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to disconnect from telescope";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({
        error: errorMessage,
        isConnected: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  slewToCoordinates: async (rightAscension: number, declination: number) => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.slewToCoordinates(rightAscension, declination);
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info });
      logger.info(
        `Slew to coordinates: RA=${rightAscension}, Dec=${declination}`
      );
    } catch (error: unknown) {
      let errorMessage = "Failed to slew to coordinates";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  syncToCoordinates: async (rightAscension: number, declination: number) => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.syncToCoordinates(rightAscension, declination);
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info });
      logger.info(
        `Sync to coordinates: RA=${rightAscension}, Dec=${declination}`
      );
    } catch (error: unknown) {
      let errorMessage = "Failed to sync to coordinates";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  park: async () => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.park();
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info });
      logger.info("Telescope parked successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to park telescope";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  findHome: async () => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.findHome();
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info });
      logger.info("Telescope found home successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to find home";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  setTracking: async (tracking: boolean) => {
    set({ isLoading: true, error: null });
    try {
      await telescopeApi.setTracking(tracking);
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info });
      logger.info(`Telescope tracking set to: ${tracking}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to set tracking";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  getTelescopeInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await telescopeApi.getTelescopeInfo();
      set({ telescopeInfo: info, isConnected: true });
      logger.info("Telescope info fetched successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to get telescope info";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({
        error: errorMessage,
        isConnected: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
