import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";

export interface VisualizationSlice {
  addDataPoint: (type: string, value: number) => void;
  clearDataPoints: () => void;
  toggleVisualization: () => void;
}

export const createVisualizationSlice: StateCreator<
  SerialState,
  [],
  [],
  VisualizationSlice
> = (set) => ({
  addDataPoint: (type, value) => {
    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with the updated dataPoints for the active tab
      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        dataPoints: [
          ...updatedTabs[activeTabIndex].dataPoints,
          { timestamp: Date.now(), value, type },
        ].slice(-100), // Keep only recent 100 data points
      };

      return { tabs: updatedTabs };
    });
  },

  clearDataPoints: () =>
    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with cleared dataPoints for the active tab
      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        dataPoints: [],
      };

      return { tabs: updatedTabs };
    }),

  toggleVisualization: () =>
    set((state) => ({
      showVisualization: !state.showVisualization,
    })),
});
