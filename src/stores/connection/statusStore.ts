import { create } from "zustand";

interface NetworkInterface {
  name: string;
  address: string;
  family: string;
  internal: boolean;
}

interface ConnectionStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  latency: number;
  lastUpdated: Date;
}

interface ConnectionError {
  code: string;
  message: string;
  timestamp: Date;
}

interface ConnectionStatusState {
  isConnected: boolean;
  isLoading: boolean;
  connectionStrength: number;
  connectionHistory: string[];
  networkInterfaces: NetworkInterface[];
  connectionStats: ConnectionStats;
  errorHistory: ConnectionError[];
  lastAttemptTimestamp: Date | null;
  reconnectAttempts: number;
  isReconnecting: boolean;
  autoReconnect: boolean;
  maxRetries: number;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setConnectionStrength: (strength: number) => void;
  addConnectionHistory: (entry: string) => void;
  removeConnectionHistory: (index: number) => void;
  clearConnectionHistory: () => void;
  setNetworkInterfaces: (interfaces: NetworkInterface[]) => void;
  updateConnectionStats: (stats: Partial<ConnectionStats>) => void;
  addError: (error: ConnectionError) => void;
  clearErrorHistory: () => void;
  setReconnecting: (isReconnecting: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setAutoReconnect: (enabled: boolean) => void;
  setLastAttemptTimestamp: (timestamp: Date | null) => void;
  update: (
    data: Partial<
      Omit<
        ConnectionStatusState,
        | "update"
        | keyof Pick<
            ConnectionStatusState,
            | "setConnected"
            | "setLoading"
            | "setConnectionStrength"
            | "addConnectionHistory"
            | "removeConnectionHistory"
            | "clearConnectionHistory"
            | "setNetworkInterfaces"
            | "updateConnectionStats"
            | "addError"
            | "clearErrorHistory"
            | "setReconnecting"
            | "incrementReconnectAttempts"
            | "resetReconnectAttempts"
            | "setAutoReconnect"
            | "setLastAttemptTimestamp"
          >
      >
    >
  ) => void;
}

export const useConnectionStatusStore = create<ConnectionStatusState>(
  (set) => ({
    isConnected: false,
    isLoading: false,
    connectionStrength: 0,
    connectionHistory: [],
    networkInterfaces: [],
    connectionStats: {
      bytesReceived: 0,
      bytesSent: 0,
      packetsReceived: 0,
      packetsSent: 0,
      latency: 0,
      lastUpdated: new Date(),
    },
    errorHistory: [],
    lastAttemptTimestamp: null,
    reconnectAttempts: 0,
    isReconnecting: false,
    autoReconnect: true,
    maxRetries: 3,

    setConnected: (connected) => set({ isConnected: connected }),
    setLoading: (loading) => set({ isLoading: loading }),
    setConnectionStrength: (strength) => set({ connectionStrength: strength }),
    addConnectionHistory: (entry) =>
      set((state) => ({
        connectionHistory: [...state.connectionHistory, entry],
      })),
    removeConnectionHistory: (index) =>
      set((state) => ({
        connectionHistory: state.connectionHistory.filter(
          (_, i) => i !== index
        ),
      })),
    clearConnectionHistory: () => set({ connectionHistory: [] }),
    setNetworkInterfaces: (interfaces) =>
      set({ networkInterfaces: interfaces }),
    updateConnectionStats: (stats) =>
      set((state) => ({
        connectionStats: {
          ...state.connectionStats,
          ...stats,
          lastUpdated: new Date(),
        },
      })),
    addError: (error) =>
      set((state) => ({
        errorHistory: [...state.errorHistory, error],
      })),
    clearErrorHistory: () => set({ errorHistory: [] }),
    setReconnecting: (isReconnecting) => set({ isReconnecting }),
    incrementReconnectAttempts: () =>
      set((state) => ({
        reconnectAttempts: state.reconnectAttempts + 1,
      })),
    resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
    setAutoReconnect: (enabled) => set({ autoReconnect: enabled }),
    setLastAttemptTimestamp: (timestamp) =>
      set({ lastAttemptTimestamp: timestamp }),
    update: (data) => set((state) => ({ ...state, ...data })),
  })
);
