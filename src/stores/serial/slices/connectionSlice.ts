// slices/connectionSlice.ts
import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";
import {
  createSerialInterface,
  SerialConnection,
  BackendSerialAPI,
} from "@/lib/serial/serial-api";
import { SerialOptions } from "@/types/serial";
import { createProtocolParser } from "@/lib/serial/protocol-parsers";

export interface ConnectionSlice {
  setIsConnected: (isConnected: boolean) => void;
  setIsMonitoring: (isMonitoring: boolean) => void;
  setSerialMode: (mode: SerialState["serialMode"]) => void;
  setViewMode: (mode: SerialState["viewMode"]) => void;
  setPort: (port: string) => void;
  setBaudRate: (baudRate: string) => void;
  setLineEnding: (lineEnding: SerialState["lineEnding"]) => void; // 修复属性名
  setConnectionMode: (mode: SerialState["connectionMode"]) => void;
  setBackendUrl: (url: string) => void;
  connectToSerial: () => Promise<boolean>;
  disconnectFromSerial: () => Promise<void>;
  scanPorts: () => Promise<string[]>;
}

export const createConnectionSlice: StateCreator<
  SerialState,
  [],
  [],
  ConnectionSlice
> = (set, get) => ({
  setIsConnected: (isConnected) => set({ isConnected }),

  setIsMonitoring: (isMonitoring) => set({ isMonitoring }),

  setSerialMode: (serialMode) => set({ serialMode }),

  setViewMode: (viewMode) => set({ viewMode }),

  setPort: (port) =>
    set((state) => {
      // Update the current tab's port
      const tabs = state.tabs.map((tab) =>
        tab.id === state.activeTabId ? { ...tab, port } : tab
      );

      return { tabs };
    }),

  setBaudRate: (baudRate) =>
    set((state) => {
      // Update the current tab's baudRate
      const tabs = state.tabs.map((tab) =>
        tab.id === state.activeTabId ? { ...tab, baudRate } : tab
      );

      return { tabs };
    }),

  setLineEnding: (lineEnding) => set({ lineEnding }),

  setConnectionMode: (connectionMode) => set({ connectionMode }),

  setBackendUrl: (backendUrl) => set({ backendUrl }),

  connectToSerial: async () => {
    const state = get();
    const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);

    if (!activeTab) return false;

    // If in simulation mode, just pretend to connect
    if (state.connectionMode === "simulation") {
      set({ isSimulationMode: true, isConnected: true });
      get().addTerminalData("--- Simulation Mode Activated ---", "info");
      get().addTerminalData("Type 'help' to see available commands", "info");
      return true;
    }

    // Create serial interface if not already created
    let serialInterface = state.serialInterface;

    if (!serialInterface) {
      serialInterface = createSerialInterface(
        state.connectionMode === "backend",
        state.backendUrl
      );

      // Set up data handler
      serialInterface.onData((data) => {
        get().addTerminalData(data, "received");

        // Parse data if a protocol parser is set
        if (state.protocolParser) {
          try {
            const parser = createProtocolParser(state.protocolParser);
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);
            const parsedData = parser.parse(dataArray);

            get().addParsedMessage({
              timestamp: Date.now(),
              valid: parsedData.valid !== false,
              data: parsedData,
            });
          } catch (error) {
            console.error("Error parsing data:", error);
          }
        }
      });

      // Set up disconnect handler
      serialInterface.onDisconnect(() => {
        set({ isConnected: false, isMonitoring: false });
        get().addTerminalData("--- Disconnected ---", "warning");
      });

      set({ serialInterface });
    }

    // Connect to the port
    try {
      let success = false;
      const connectionOptions: SerialOptions = {
        baudRate: activeTab.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      };

      if (state.connectionMode === "webserial") {
        // For WebSerial, we need to request a port first
        const serialConn = serialInterface as SerialConnection;
        const port = await serialConn.requestPort();
        if (!port) {
          get().addTerminalData("Failed to select a port", "error");
          return false;
        }

        // Then connect with the selected port
        success = await serialConn.connect(connectionOptions);
      } else if (state.connectionMode === "backend") {
        // For backend, we use the port from the active tab
        const backendConn = serialInterface as BackendSerialAPI;
        success = await backendConn.connect(activeTab.port, connectionOptions);
      }

      if (success) {
        set({ isConnected: true });
        get().addTerminalData(
          `--- Connected to ${activeTab.port} @ ${activeTab.baudRate}bps ---`,
          "success"
        );
        return true;
      } else {
        get().addTerminalData(
          `Failed to connect to ${activeTab.port}`,
          "error"
        );
        return false;
      }
    } catch (error) {
      console.error("Error connecting to serial port:", error);
      get().addTerminalData(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
      return false;
    }
  },

  disconnectFromSerial: async () => {
    const state = get();

    // If in simulation mode, just pretend to disconnect
    if (state.connectionMode === "simulation") {
      set({
        isSimulationMode: false,
        isConnected: false,
        isMonitoring: false,
      });
      get().addTerminalData("--- Simulation Mode Deactivated ---", "info");
      return;
    }

    // Disconnect from the port
    if (state.serialInterface) {
      try {
        await state.serialInterface.disconnect();
        set({ isConnected: false, isMonitoring: false });
        get().addTerminalData("--- Disconnected ---", "info");
      } catch (error) {
        console.error("Error disconnecting from serial port:", error);
        get().addTerminalData(
          `Error: ${error instanceof Error ? error.message : String(error)}`,
          "error"
        );
      }
    }
  },

  scanPorts: async () => {
    const state = get();

    // If in simulation mode, return mock ports
    if (state.connectionMode === "simulation") {
      return [
        "/dev/ttyS0",
        "/dev/ttyUSB0",
        "/dev/ttyACM0",
        "COM1",
        "COM2",
        "COM3",
      ];
    }

    // Create serial interface if not already created
    let serialInterface = state.serialInterface;

    if (!serialInterface) {
      serialInterface = createSerialInterface(
        state.connectionMode === "backend",
        state.backendUrl
      );
      set({ serialInterface });
    }

    try {
      if (state.connectionMode === "webserial") {
        // Define a proper interface for the SerialPort
        interface SerialPortInfo {
          usbVendorId?: number;
          usbProductId?: number;
        }

        interface WebSerialPort {
          getInfo(): SerialPortInfo;
        }

        const serialConn = serialInterface as SerialConnection;
        const ports = await serialConn.getPorts();
        // 确保 ports 数组被正确处理为字符串数组
        return ports.map((port) => {
          const webPort = port as unknown as WebSerialPort;
          const info = webPort.getInfo();
          return info.usbVendorId
            ? `USB ${info.usbVendorId.toString(16)}:${
                info.usbProductId?.toString(16) || "0000"
              }`
            : "Serial Port";
        });
      } else if (state.connectionMode === "backend") {
        const backendConn = serialInterface as BackendSerialAPI;
        return await backendConn.getPorts();
      }

      return [];
    } catch (error) {
      console.error("Error scanning ports:", error);
      get().addTerminalData(
        `Error scanning ports: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
      return [];
    }
  },
});
