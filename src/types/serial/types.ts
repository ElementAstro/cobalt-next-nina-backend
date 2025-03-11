// types.ts
import type {
  SerialConnection,
  BackendSerialAPI,
} from "@/lib/serial/serial-api";
import type { ProtocolParserOptions, DeviceProfile } from "@/types/serial";

export type SerialMode = "serial" | "other";
export type ViewMode = "text" | "hex" | "mixed";
export type LineEndingMode = "none" | "nl" | "cr" | "crnl";
export type ThemeMode = "dark" | "light" | "system";
export type AccentColor =
  | "purple"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "pink";
export type ConnectionMode = "webserial" | "backend" | "simulation";

export interface DataPoint {
  timestamp: number;
  value: number;
  type: string;
}

export interface ParsedMessage {
  timestamp: number;
  valid: boolean;
  data: unknown;
}

export interface TerminalItem {
  id: string;
  text: string;
  timestamp: number;
  type?: string;
}

export interface ImportedTab {
  name?: string;
  port?: string;
  baudRate?: string;
}

export interface ImportedMacro {
  id?: string;
  name: string;
  command: string;
  shortcut?: string;
}

export interface SerialTab {
  id: string;
  name: string;
  port: string;
  baudRate: string;
  terminalData: TerminalItem[];
  dataPoints: DataPoint[];
  parsedMessages?: ParsedMessage[];
}

export interface Macro {
  id: string;
  name: string;
  command: string;
  shortcut?: string;
}

export interface ConnectionHistoryItem {
  port: string;
  baudRate: string;
  timestamp: number;
}

export interface SerialState {
  // UI state
  theme: ThemeMode;
  accentColor: AccentColor;
  showTimestamps: boolean;
  isFullscreen: boolean;
  sidebarOpen: boolean;

  // Tab management
  tabs: SerialTab[];
  activeTabId: string;

  // Connection settings
  isConnected: boolean;
  isMonitoring: boolean;
  serialMode: SerialMode;
  viewMode: ViewMode;
  lineEnding: LineEndingMode;
  connectionMode: ConnectionMode;
  backendUrl: string;

  // Simulation settings
  isSimulationMode: boolean;
  simulationScenario: string;

  // Search
  searchTerm: string;
  filteredTerminalData: TerminalItem[];

  // Command history
  commandHistory: string[];
  currentHistoryIndex: number;

  // Visualization
  showVisualization: boolean;

  // Macros
  macros: Macro[];

  // Connection history
  connectionHistory: ConnectionHistoryItem[];

  // Protocol parser
  protocolParser: ProtocolParserOptions | null;

  // Serial interface
  serialInterface: SerialConnection | BackendSerialAPI | null;

  // UI Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
  setShowTimestamps: (show: boolean) => void;
  toggleTimestamps: () => void;
  toggleFullscreen: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Tab Actions
  addTab: () => void;
  removeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  switchTab: (id: string) => void;

  // Connection Actions
  setIsConnected: (isConnected: boolean) => void;
  setIsMonitoring: (isMonitoring: boolean) => void;
  setSerialMode: (mode: SerialMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setPort: (port: string) => void;
  setBaudRate: (baudRate: string) => void;
  setLineEnding: (lineEnding: LineEndingMode) => void;
  setConnectionMode: (mode: ConnectionMode) => void;
  setBackendUrl: (url: string) => void;

  // Connection Management
  connectToSerial: () => Promise<boolean>;
  disconnectFromSerial: () => Promise<void>;
  scanPorts: () => Promise<string[]>;

  // Simulation Actions
  setIsSimulationMode: (isSimulationMode: boolean) => void;
  setSimulationScenario: (scenario: string) => void;

  // Terminal Actions
  addTerminalData: (data: string, type?: string) => void;
  clearTerminalData: () => void;
  sendData: (data: string) => void;
  getTerminalData: () => TerminalItem[];

  // Search Actions
  setSearchTerm: (term: string) => void;

  // Command History Actions
  addToCommandHistory: (command: string) => void;
  navigateCommandHistory: (direction: "up" | "down") => string;

  // Visualization Actions
  addDataPoint: (type: string, value: number) => void;
  clearDataPoints: () => void;
  toggleVisualization: () => void;

  // Macro Actions
  addMacro: (name: string, command: string, shortcut?: string) => void;
  removeMacro: (id: string) => void;
  updateMacro: (
    id: string,
    name: string,
    command: string,
    shortcut?: string
  ) => void;
  executeMacro: (id: string) => void;

  // Protocol Parser Actions
  setProtocolParser: (options: ProtocolParserOptions | null) => void;
  addParsedMessage: (message: ParsedMessage) => void;
  clearParsedMessages: () => void;

  // Device Profile Actions
  loadDeviceProfile: (profile: DeviceProfile) => void;

  // Session Actions
  saveSession: () => void;
  loadSession: (sessionId: string) => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
  sessions: {
    id: string;
    name: string;
    timestamp: number;
    settings: Partial<SerialState>;
    }[];
    activeSessionId: string | null;
}
