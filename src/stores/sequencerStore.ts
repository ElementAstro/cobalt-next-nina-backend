import { create } from "zustand";
import sequencerApi from "@/services/api/sequencer";
import logger from "@/utils/logger";

export interface SequenceEvent {
  Event: string;
  Time: string;
}

interface SequencerState {
  sequenceJson: unknown[] | null;
  availableSequences: SequenceEvent[] | null;
  isLoading: boolean;
  error: string | null;
  getSequenceJson: () => Promise<void>;
  startSequence: (skipValidation?: boolean) => Promise<void>;
  stopSequence: () => Promise<void>;
  resetSequence: () => Promise<void>;
  listAvailableSequences: () => Promise<void>;
  setTarget: (
    name: string,
    ra: number,
    dec: number,
    rotation: number,
    index: number
  ) => Promise<void>;
}

export const useSequencerStore = create<SequencerState>((set) => ({
  sequenceJson: null,
  availableSequences: null,
  isLoading: false,
  error: null,
  getSequenceJson: async () => {
    set({ isLoading: true, error: null });
    try {
      const sequenceJson = await sequencerApi.getSequenceJson();
      set({ sequenceJson: sequenceJson });
      logger.info("Successfully fetched sequence JSON.");
    } catch (error: unknown) {
      let errorMessage = "Failed to get sequence JSON";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  startSequence: async (skipValidation = false) => {
    set({ isLoading: true, error: null });
    try {
      await sequencerApi.startSequence(skipValidation);
      set({ error: null });
      logger.info("Sequence started successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to start sequence";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  stopSequence: async () => {
    set({ isLoading: true, error: null });
    try {
      await sequencerApi.stopSequence();
      set({ error: null });
      logger.info("Sequence stopped successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to stop sequence";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  resetSequence: async () => {
    set({ isLoading: true, error: null });
    try {
      await sequencerApi.resetSequence();
      set({ error: null });
      logger.info("Sequence reset successfully.");
    } catch (error: unknown) {
      let errorMessage = "Failed to reset sequence";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  listAvailableSequences: async () => {
    set({ isLoading: true, error: null });
    try {
      const availableSequences = await sequencerApi.listAvailableSequences();
      set({ availableSequences: availableSequences });
      logger.info("Successfully listed available sequences.");
    } catch (error: unknown) {
      let errorMessage = "Failed to list available sequences";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      logger.error(errorMessage, error);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },
  setTarget: async (
    name: string,
    ra: number,
    dec: number,
    rotation: number,
    index: number
  ) => {
    set({ isLoading: true, error: null });
    try {
      await sequencerApi.setTarget(name, ra, dec, rotation, index);
      set({ error: null });
      logger.info(
        `Target set successfully: Name=${name}, RA=${ra}, Dec=${dec}, Rotation=${rotation}, Index=${index}`
      );
    } catch (error: unknown) {
      let errorMessage = "Failed to set target";
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
