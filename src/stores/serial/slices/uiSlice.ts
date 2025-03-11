// slices/uiSlice.ts
import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";

export interface UISlice {
  setTheme: (theme: SerialState["theme"]) => void;
  toggleTheme: () => void;
  setAccentColor: (color: SerialState["accentColor"]) => void;
  setShowTimestamps: (show: boolean) => void;
  toggleTimestamps: () => void;
  toggleFullscreen: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const createUISlice: StateCreator<SerialState, [], [], UISlice> = (
  set
) => ({
  setTheme: (theme) => set({ theme }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),

  setAccentColor: (accentColor) => set({ accentColor }),

  setShowTimestamps: (showTimestamps) => set({ showTimestamps }),

  toggleTimestamps: () =>
    set((state) => ({
      showTimestamps: !state.showTimestamps,
    })),

  toggleFullscreen: () =>
    set((state) => ({
      isFullscreen: !state.isFullscreen,
    })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
});
