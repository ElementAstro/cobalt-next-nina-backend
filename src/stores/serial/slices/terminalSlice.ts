import { StateCreator } from "zustand";
import { SerialState, TerminalItem } from "@/types/serial/types";
import { nanoid } from "nanoid";

export interface TerminalSlice {
  addTerminalData: (data: string, type?: string) => void;
  clearTerminalData: () => void;
  sendData: (data: string) => void;
  getTerminalData: () => TerminalItem[];
}

export const createTerminalSlice: StateCreator<
  SerialState,
  [],
  [],
  TerminalSlice
> = (set, get) => ({
  addTerminalData: (data, type) => {
    const timestamp = Date.now();
    const id = `${timestamp}-${nanoid(6)}`;
    const newItem = { id, text: data, timestamp, type };

    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with the updated terminalData for the active tab
      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        terminalData: [...updatedTabs[activeTabIndex].terminalData, newItem],
      };

      // Parse data for potential visualization data points
      if (!data.startsWith("---") && !data.startsWith(">")) {
        const tempMatch = data.match(/Temp(?:erature)?=(\d+)/i);
        const humidityMatch = data.match(/Humidity=(\d+)/i);
        const pressureMatch = data.match(/Pressure=(\d+)/i);

        if (tempMatch)
          get().addDataPoint("temperature", Number.parseInt(tempMatch[1], 10));
        if (humidityMatch)
          get().addDataPoint("humidity", Number.parseInt(humidityMatch[1], 10));
        if (pressureMatch)
          get().addDataPoint("pressure", Number.parseInt(pressureMatch[1], 10));
      }

      // Update filtered data if search is active
      const filteredTerminalData = state.searchTerm
        ? updatedTabs[activeTabIndex].terminalData.filter((item) =>
            item.text.toLowerCase().includes(state.searchTerm.toLowerCase())
          )
        : updatedTabs[activeTabIndex].terminalData;

      return {
        tabs: updatedTabs,
        filteredTerminalData,
      };
    });
  },

  clearTerminalData: () =>
    set((state) => {
      // Find the active tab
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      // Create a new tabs array with cleared terminalData for the active tab
      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        terminalData: [],
      };

      return {
        tabs: updatedTabs,
        filteredTerminalData: [],
      };
    }),

  sendData: async (data) => {
    const state = get();

    // Add to command history
    if (data.trim()) {
      get().addToCommandHistory(data);
    }

    // Add to connection history if connecting to a new port
    if (data.toLowerCase().includes("connect") || state.isMonitoring) {
      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
      if (activeTab) {
        const newEntry = {
          port: activeTab.port,
          baudRate: activeTab.baudRate,
          timestamp: Date.now(),
        };

        // Only add if it's a new entry
        const exists = state.connectionHistory.some(
          (entry) =>
            entry.port === newEntry.port && entry.baudRate === newEntry.baudRate
        );

        if (!exists) {
          set((state) => ({
            connectionHistory: [newEntry, ...state.connectionHistory].slice(
              0,
              10
            ),
          }));
        }
      }
    }

    // If in simulation mode, handle locally
    if (state.isSimulationMode) {
      // Echo the data back
      get().addTerminalData(`> ${data}`, "command");

      // Simulate a response based on the command
      setTimeout(() => {
        let response = "Unknown command";

        if (data.toLowerCase().includes("help")) {
          response =
            "Available commands: help, status, version, reset, sensor, connect, disconnect";
        } else if (data.toLowerCase().includes("status")) {
          response = "System status: OK\nTemperature: 25°C\nHumidity: 45%";
        } else if (data.toLowerCase().includes("version")) {
          response = "Firmware version: v1.2.3\nHardware version: v2.0";
        } else if (data.toLowerCase().includes("reset")) {
          response = "System reset initiated...\nRebooting...\nSystem online.";
        } else if (data.toLowerCase().includes("sensor")) {
          const temp = Math.round(20 + Math.random() * 10);
          const humidity = Math.round(40 + Math.random() * 20);
          const pressure = Math.round(990 + Math.random() * 30);
          response = `Sensor readings:\nTemp=${temp}°C\nHumidity=${humidity}%\nPressure=${pressure}hPa`;

          // Add data points for visualization
          get().addDataPoint("temperature", temp);
          get().addDataPoint("humidity", humidity);
          get().addDataPoint("pressure", pressure);
        } else if (data.toLowerCase().includes("connect")) {
          response = "Connected successfully.";
        } else if (data.toLowerCase().includes("disconnect")) {
          response = "Disconnected successfully.";
        }

        get().addTerminalData(response, "response");
      }, 500);

      return;
    }

    // Send data to the serial port
    if (state.serialInterface && state.isConnected) {
      try {
        const success = await state.serialInterface.write(
          data,
          state.lineEnding
        );

        if (!success) {
          get().addTerminalData("Failed to send data", "error");
        } else {
          get().addTerminalData(`> ${data}`, "command");
        }
      } catch (error) {
        console.error("Error sending data:", error);
        get().addTerminalData(
          `Error sending data: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "error"
        );
      }
    } else {
      // Not connected, show a message
      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
      if (activeTab) {
        get().addTerminalData(
          `> ${data} (would be sent to ${activeTab.port})`,
          "command"
        );
      }
    }
  },

  getTerminalData: () => {
    const activeTab = get().tabs.find((tab) => tab.id === get().activeTabId);
    return activeTab ? activeTab.terminalData : [];
  },
});
