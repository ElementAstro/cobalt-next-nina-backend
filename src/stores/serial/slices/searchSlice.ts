import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";

export interface SearchSlice {
  setSearchTerm: (term: string) => void;
}

export const createSearchSlice: StateCreator<
  SerialState,
  [],
  [],
  SearchSlice
> = (set) => ({
  setSearchTerm: (searchTerm) => {
    set((state) => {
      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
      if (!activeTab) return { searchTerm };

      return {
        searchTerm,
        filteredTerminalData: searchTerm
          ? activeTab.terminalData.filter((item) =>
              item.text.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : activeTab.terminalData,
      };
    });
  },
});
