import { create } from "zustand";
import guiderApi, {
  GuiderData,
  GuideStepsHistoryData,
} from "@/services/api/guider";
import logger from "@/utils/logger";

interface GuiderState {
  guiderInfo: GuiderData | null;
  guideStepsHistory: GuideStepsHistoryData | null;
  isConnected: boolean;
  isGuiding: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  startGuiding: (calibrate?: boolean) => Promise<void>;
  stopGuiding: () => Promise<void>;
  clearCalibration: () => Promise<void>;
  getGuiderInfo: () => Promise<void>;
  getGuideStepsHistory: () => Promise<void>;
}

export const useGuiderStore = create<GuiderState>((set) => ({
  guiderInfo: null,
  guideStepsHistory: null,
  isConnected: false,
  isGuiding: false,
  isLoading: false,
  error: null,
  connect: async (skipRescan = false) => {
    set({ isLoading: true, error: null });
    try {
      await guiderApi.connect(skipRescan);
      const info = await guiderApi.getGuiderInfo();
      set({ guiderInfo: info, isConnected: true });
      logger.info("Guider connected successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to connect to guider";
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
      await guiderApi.disconnect();
      set({ guiderInfo: null, isConnected: false });
      logger.info("Guider disconnected successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to disconnect from guider";
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
  startGuiding: async (calibrate = false) => {
    set({ isLoading: true, error: null });
    try {
      await guiderApi.startGuiding(calibrate);
      set({ isGuiding: true });
      logger.info("Guiding started successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to start guiding";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({
        error: errorMessage,
        isGuiding: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  stopGuiding: async () => {
    set({ isLoading: true, error: null });
    try {
      await guiderApi.stopGuiding();
      set({ isGuiding: false });
      logger.info("Guiding stopped successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to stop guiding";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({
        error: errorMessage,
        isGuiding: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  clearCalibration: async () => {
    set({ isLoading: true, error: null });
    try {
      await guiderApi.clearCalibration();
      logger.info("Calibration cleared successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to clear calibration";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  getGuiderInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await guiderApi.getGuiderInfo();
      set({ guiderInfo: info, isConnected: true });
      logger.info("Guider info fetched successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to get guider info";
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
  getGuideStepsHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await guiderApi.getGuideStepsHistory();
      set({ guideStepsHistory: history });
      logger.info("Guide steps history fetched successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to get guide steps history";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
}));
