import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";

export interface HistorySlice {
  addToCommandHistory: (command: string) => void;
  navigateCommandHistory: (direction: "up" | "down") => string;
}

export const createHistorySlice: StateCreator<
  SerialState,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  addToCommandHistory: (command) =>
    set((state) => ({
      commandHistory: [
        command,
        ...state.commandHistory.filter((cmd) => cmd !== command),
      ].slice(0, 50),
      currentHistoryIndex: -1,
    })),

  navigateCommandHistory: (direction) => {
    const state = get();
    const { commandHistory, currentHistoryIndex } = state;

    if (commandHistory.length === 0) return "";

    let newIndex = currentHistoryIndex;

    if (direction === "up") {
      newIndex =
        currentHistoryIndex < commandHistory.length - 1
          ? currentHistoryIndex + 1
          : currentHistoryIndex;
    } else {
      newIndex = currentHistoryIndex > 0 ? currentHistoryIndex - 1 : -1;
    }

    set({ currentHistoryIndex: newIndex });

    return newIndex >= 0 ? commandHistory[newIndex] : "";
  },
});
