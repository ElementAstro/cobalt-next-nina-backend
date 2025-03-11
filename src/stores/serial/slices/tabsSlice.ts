import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";
import { createNewTab } from "@/types/serial/helpers";

export interface TabsSlice {
  addTab: () => void;
  removeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  switchTab: (id: string) => void;
}

export const createTabsSlice: StateCreator<SerialState, [], [], TabsSlice> = (
  set
) => ({
  addTab: () =>
    set((state) => {
      const newTab = createNewTab();
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }),

  removeTab: (id) =>
    set((state) => {
      // Don't remove the last tab
      if (state.tabs.length <= 1) return state;

      const newTabs = state.tabs.filter((tab) => tab.id !== id);
      let newActiveId = state.activeTabId;

      // If we're removing the active tab, switch to another one
      if (id === state.activeTabId) {
        const index = state.tabs.findIndex((tab) => tab.id === id);
        const newIndex = index === 0 ? 0 : index - 1;
        newActiveId = newTabs[newIndex].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveId,
      };
    }),

  renameTab: (id, name) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
    })),

  switchTab: (id) => set({ activeTabId: id }),
});
