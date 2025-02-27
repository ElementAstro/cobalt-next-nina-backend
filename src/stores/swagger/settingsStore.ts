import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";
type LayoutMode = "default" | "vertical" | "horizontal" | "compact";
type HighlightColor = "blue" | "green" | "purple" | "red" | "orange";

interface SettingsState {
  theme: ThemeMode;
  layout: LayoutMode;
  fontSize: number;
  enableAnimations: boolean;
  highlightColor: HighlightColor;
  codeWrap: boolean;
  showDeprecated: boolean;
  autoExpand: boolean;

  setTheme: (theme: ThemeMode) => void;
  setLayout: (layout: LayoutMode) => void;
  setFontSize: (size: number) => void;
  setEnableAnimations: (enable: boolean) => void;
  setHighlightColor: (color: HighlightColor) => void;
  setCodeWrap: (wrap: boolean) => void;
  setShowDeprecated: (show: boolean) => void;
  setAutoExpand: (expand: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      layout: "default",
      fontSize: 14,
      enableAnimations: true,
      highlightColor: "blue",
      codeWrap: true,
      showDeprecated: true,
      autoExpand: false,

      setTheme: (theme) => set({ theme }),
      setLayout: (layout) => set({ layout }),
      setFontSize: (fontSize) => set({ fontSize }),
      setEnableAnimations: (enableAnimations) => set({ enableAnimations }),
      setHighlightColor: (highlightColor) => set({ highlightColor }),
      setCodeWrap: (codeWrap) => set({ codeWrap }),
      setShowDeprecated: (showDeprecated) => set({ showDeprecated }),
      setAutoExpand: (autoExpand) => set({ autoExpand }),
    }),
    {
      name: "swagger-settings",
    }
  )
);
