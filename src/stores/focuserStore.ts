import { create } from "zustand";
import focuserApi, { FocuserData } from "@/services/api/focuser";
import logger from "@/utils/logger";

interface FocuserState {
  focuserInfo: FocuserData | null;
  isConnected: boolean;
  isMoving: boolean;
  error: string | null;
  moveHistory: number[];
  connect: (skipRescan?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  move: (position: number) => Promise<void>;
  halt: () => Promise<void>;
  setTempComp: (tempComp: boolean) => Promise<void>;
  getFocuserInfo: () => Promise<void>;
  clearMoveHistory: () => void;
}

export const useFocuserStore = create<FocuserState>((set) => ({
  focuserInfo: null,
  isConnected: false,
  isMoving: false,
  error: null,
  moveHistory: [],
  connect: async (skipRescan = false) => {
    try {
      await focuserApi.connect(skipRescan);
      set({ isConnected: true, error: null });
      await useFocuserStore.getState().getFocuserInfo();
      logger.info("Focuser connected successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          isConnected: false,
          error: error.message || "Failed to connect",
        });
        logger.error(`Failed to connect focuser: ${error.message}`);
      } else {
        set({
          isConnected: false,
          error: "An unknown error occurred",
        });
        logger.error("An unknown error occurred while connecting focuser.");
      }
    }
  },
  disconnect: async () => {
    try {
      await focuserApi.disconnect();
      set({ isConnected: false, error: null, focuserInfo: null });
      logger.info("Focuser disconnected successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          isConnected: false,
          error: error.message || "Failed to disconnect",
        });
        logger.error(`Failed to disconnect focuser: ${error.message}`);
      } else {
        set({
          isConnected: false,
          error: "An unknown error occurred",
        });
        logger.error("An unknown error occurred while disconnecting focuser.");
      }
    }
  },
  move: async (position: number) => {
    try {
      await focuserApi.move(position);
      set((state) => ({
        error: null,
        isMoving: true,
        moveHistory: [position, ...state.moveHistory].slice(0, 10), // 保留最近10条记录
      }));
      await useFocuserStore.getState().getFocuserInfo();
      logger.info(`Focuser moved to position: ${position}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to move focuser",
          isMoving: false,
        });
        logger.error(
          `Failed to move focuser to position ${position}: ${error.message}`
        );
      } else {
        set({
          error: "An unknown error occurred",
          isMoving: false,
        });
        logger.error(
          `An unknown error occurred while moving focuser to position ${position}.`
        );
      }
    }
  },
  halt: async () => {
    try {
      await focuserApi.halt();
      set({ error: null, isMoving: false });
      await useFocuserStore.getState().getFocuserInfo();
      logger.info("Focuser halted successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to halt focuser",
          isMoving: false,
        });
        logger.error(`Failed to halt focuser: ${error.message}`);
      } else {
        set({
          error: "An unknown error occurred",
          isMoving: false,
        });
        logger.error("An unknown error occurred while halting focuser.");
      }
    }
  },
  setTempComp: async (tempComp: boolean) => {
    try {
      await focuserApi.setTempComp(tempComp);
      set({ error: null });
      await useFocuserStore.getState().getFocuserInfo();
      logger.info(`Focuser temperature compensation set to: ${tempComp}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          error: error.message || "Failed to set temperature compensation",
        });
        logger.error(
          `Failed to set temperature compensation to ${tempComp}: ${error.message}`
        );
      } else {
        set({
          error: "An unknown error occurred",
        });
        logger.error(
          `An unknown error occurred while setting temperature compensation to ${tempComp}.`
        );
      }
    }
  },
  getFocuserInfo: async () => {
    try {
      const info = await focuserApi.getFocuserInfo();
      set({
        focuserInfo: info,
        isConnected: info.Connected,
        isMoving: info.IsMoving,
        error: null,
      });
      logger.info("Focuser info fetched successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({
          focuserInfo: null,
          isConnected: false,
          error: error.message || "Failed to get focuser info",
        });
        logger.error(`Failed to get focuser info: ${error.message}`);
      } else {
        set({
          focuserInfo: null,
          isConnected: false,
          error: "An unknown error occurred",
        });
        logger.error("An unknown error occurred while getting focuser info.");
      }
    }
  },
  clearMoveHistory: () => {
    set({ moveHistory: [] });
  },
}));
