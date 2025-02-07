import { create } from "zustand";
import filterWheelApi, { FWInfo, FilterInfo } from "@/services/api/filterwheel";
import logger from "@/utils/logger";

interface FilterWheelState {
  filterWheelInfo: FWInfo | null;
  filterInfo: FilterInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  changeFilter: (filterId: number) => Promise<void>;
  getFilterInfo: (filterId: number) => Promise<void>;
  getFilterWheelInfo: () => Promise<void>;
}

export const useFilterWheelStore = create<FilterWheelState>((set) => ({
  filterWheelInfo: null,
  filterInfo: null,
  isConnected: false,
  isLoading: false,
  error: null,
  connect: async (skipRescan = false) => {
    set({ isLoading: true, error: null });
    try {
      await filterWheelApi.connect(skipRescan);
      const info = await filterWheelApi.getFilterWheelInfo();
      set({ filterWheelInfo: info, isConnected: true });
      logger.info("Filter wheel connected successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to connect to filter wheel",
          isConnected: false,
        });
        logger.error(`Failed to connect filter wheel: ${error.message}`);
      } else {
        set({
          error: "An unknown error occurred",
          isConnected: false,
        });
        logger.error(
          "An unknown error occurred while connecting filter wheel."
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await filterWheelApi.disconnect();
      set({ filterWheelInfo: null, isConnected: false });
      logger.info("Filter wheel disconnected successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to disconnect from filter wheel",
          isConnected: true,
        });
        logger.error(`Failed to disconnect filter wheel: ${error.message}`);
      } else {
        set({
          error: "An unknown error occurred",
          isConnected: false,
        });
        logger.error(
          "An unknown error occurred while disconnecting filter wheel."
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
  changeFilter: async (filterId: number) => {
    set({ isLoading: true, error: null });
    try {
      await filterWheelApi.changeFilter(filterId);
      const info = await filterWheelApi.getFilterWheelInfo();
      set({ filterWheelInfo: info });
      logger.info(`Filter changed to ID: ${filterId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message || "Failed to change filter" });
        logger.error(
          `Failed to change filter to ID ${filterId}: ${error.message}`
        );
      } else {
        set({ error: "An unknown error occurred" });
        logger.error(
          `An unknown error occurred while changing filter to ID ${filterId}.`
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
  getFilterInfo: async (filterId: number) => {
    set({ isLoading: true, error: null });
    try {
      const filterInfo = await filterWheelApi.getFilterInfo(filterId);
      set({ filterInfo: filterInfo });
      logger.info(`Filter info fetched for ID: ${filterId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message || "Failed to get filter info" });
        logger.error(
          `Failed to get filter info for ID ${filterId}: ${error.message}`
        );
      } else {
        set({ error: "An unknown error occurred" });
        logger.error(
          `An unknown error occurred while getting filter info for ID ${filterId}.`
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
  getFilterWheelInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await filterWheelApi.getFilterWheelInfo();
      set({ filterWheelInfo: info, isConnected: true });
      logger.info("Filter wheel info fetched successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to get filter wheel info",
          isConnected: false,
        });
        logger.error(`Failed to get filter wheel info: ${error.message}`);
      } else {
        set({
          error: "An unknown error occurred",
          isConnected: false,
        });
        logger.error(
          "An unknown error occurred while getting filter wheel info."
        );
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
