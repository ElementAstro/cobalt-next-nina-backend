import { StateCreator } from "zustand";
import { SerialState, ParsedMessage } from "@/types/serial/types";

export interface ParserSlice {
  setProtocolParser: (options: SerialState["protocolParser"]) => void;
  addParsedMessage: (message: ParsedMessage) => void;
  clearParsedMessages: () => void;
}

export const createParserSlice: StateCreator<
  SerialState,
  [],
  [],
  ParserSlice
> = (set) => ({
  setProtocolParser: (protocolParser) => set({ protocolParser }),

  addParsedMessage: (message) =>
    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with the updated parsedMessages for the active tab
      const updatedTabs = [...state.tabs];
      const currentMessages = updatedTabs[activeTabIndex].parsedMessages || [];

      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        parsedMessages: [...currentMessages, message].slice(-100), // Keep only recent 100 messages
      };

      return { tabs: updatedTabs };
    }),

  clearParsedMessages: () =>
    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with cleared parsedMessages for the active tab
      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        parsedMessages: [],
      };

      return { tabs: updatedTabs };
    }),
});
