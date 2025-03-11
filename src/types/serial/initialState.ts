// initialState.ts
import { createNewTab } from "./helpers";
import { nanoid } from "nanoid";
import { SerialState } from "./types";

const initialTabs = [createNewTab("Serial Monitor")];
const firstTabId = initialTabs[0].id;

type ActionKeys =
  | "setTheme"
  | "toggleTheme"
  | "setAccentColor"
  | "setShowTimestamps"
  | "toggleTimestamps"
  | "toggleFullscreen"
  | "setSidebarOpen"
  | "toggleSidebar"
  | "addTab"
  | "removeTab"
  | "renameTab"
  | "switchTab"
  | "setIsConnected"
  | "setIsMonitoring"
  | "setSerialMode"
  | "setViewMode"
  | "setPort"
  | "setBaudRate"
  | "setLineEnding"
  | "setConnectionMode"
  | "setBackendUrl"
  | "connectToSerial"
  | "disconnectFromSerial"
  | "scanPorts"
  | "setIsSimulationMode"
  | "setSimulationScenario"
  | "addTerminalData"
  | "clearTerminalData"
  | "sendData"
  | "getTerminalData"
  | "setSearchTerm"
  | "addToCommandHistory"
  | "navigateCommandHistory"
  | "addDataPoint"
  | "clearDataPoints"
  | "toggleVisualization"
  | "addMacro"
  | "removeMacro"
  | "updateMacro"
  | "executeMacro"
  | "setProtocolParser"
  | "addParsedMessage"
  | "clearParsedMessages"
  | "loadDeviceProfile"
  | "saveSession"
  | "loadSession"
  | "exportSettings"
  | "importSettings"
  | "sessions"
  | "activeSessionId";

// 使用具体的 ActionKeys 类型代替之前的 ReturnType<typeof createActions>
export const initialState: Omit<SerialState, ActionKeys> = {
  // UI state
  theme: "dark",
  accentColor: "purple",
  showTimestamps: false,
  isFullscreen: false,
  sidebarOpen: false,

  // Tab management
  tabs: initialTabs,
  activeTabId: firstTabId,

  // Connection settings
  isConnected: false,
  isMonitoring: false,
  serialMode: "serial",
  viewMode: "text",
  lineEnding: "none",
  connectionMode: "webserial",
  backendUrl: "/api/serial",

  // Simulation settings
  isSimulationMode: false,
  simulationScenario: "default",

  // Search
  searchTerm: "",
  filteredTerminalData: [],

  // Command history
  commandHistory: [],
  currentHistoryIndex: -1,

  // Visualization
  showVisualization: false,

  // Macros
  macros: [
    { id: nanoid(), name: "Request Status", command: "status" },
    { id: nanoid(), name: "Request Version", command: "version" },
    { id: nanoid(), name: "Reset Device", command: "reset" },
    { id: nanoid(), name: "Sensor Reading", command: "sensor" },
  ],

  // Connection history
  connectionHistory: [],

  // Protocol parser
  protocolParser: null,

  // Serial interface
  serialInterface: null,
};
