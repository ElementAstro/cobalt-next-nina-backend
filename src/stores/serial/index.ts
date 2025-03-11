// index.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SerialState } from "@/types/serial/types";
import { initialState } from "@/types/serial/initialState";
import { createUISlice } from "./slices/uiSlice";
import { createTabsSlice } from "./slices/tabsSlice";
import { createConnectionSlice } from "./slices/connectionSlice";
import { createTerminalSlice } from "./slices/terminalSlice";
import { createSearchSlice } from "./slices/searchSlice";
import { createHistorySlice } from "./slices/historySlice";
import { createVisualizationSlice } from "./slices/visualizationSlice";
import { createMacrosSlice } from "./slices/macrosSlice";
import { createParserSlice } from "./slices/parserSlice";
import { createProfilesSlice } from "./slices/profilesSlice";
import { createSessionSlice } from "./slices/sessionSlice";
import { createSimulationSlice } from "./slices/simulationSlice";

export const useSerialStore = create<SerialState>()(
  persist(
    (set, get, api) => ({
      ...initialState,
      
      // Combine all slices
      ...createUISlice(set, get, api),
      ...createTabsSlice(set, get, api),
      ...createConnectionSlice(set, get, api),
      ...createTerminalSlice(set, get, api),
      ...createSearchSlice(set, get, api),
      ...createHistorySlice(set, get, api),
      ...createVisualizationSlice(set, get, api),
      ...createMacrosSlice(set, get, api),
      ...createParserSlice(set, get, api),
      ...createProfilesSlice(set, get, api),
      ...createSessionSlice(set, get, api),
      ...createSimulationSlice(set, get, api),
    }),
    {
      name: "serial-debug-storage",
      // Initialize activeTabId after hydration
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          (!state.activeTabId ||
            !state.tabs.find((tab) => tab.id === state.activeTabId))
        ) {
          state.activeTabId = state.tabs[0]?.id || "";
        }
      },
      // Don't persist terminal data or filtered data
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        showTimestamps: state.showTimestamps,
        tabs: state.tabs.map((tab) => ({
          id: tab.id,
          name: tab.name,
          port: tab.port,
          baudRate: tab.baudRate,
          // Don't persist terminal data or data points
        })),
        serialMode: state.serialMode,
        viewMode: state.viewMode,
        lineEnding: state.lineEnding,
        connectionMode: state.connectionMode,
        backendUrl: state.backendUrl,
        commandHistory: state.commandHistory,
        macros: state.macros,
        connectionHistory: state.connectionHistory,
        protocolParser: state.protocolParser,
        activeTabId: state.activeTabId,
      }),
    }
  )
);