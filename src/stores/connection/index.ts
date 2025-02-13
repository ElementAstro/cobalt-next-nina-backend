import { create } from "zustand";
import WebSocketClient from "@/utils/websocket-client";
import MessageBus, { LogLevel } from "@/utils/message-bus";
import logger from "@/utils/logger";
import { useConnectionConfigStore } from "./configStore";
import { useRegistrationStore } from "./registrationStore";
import { useConnectionStatusStore } from "./statusStore";
import { useDeviceDataStore } from "./deviceStore";
import { useUIStore } from "./uiStore";

export interface ConnectionState {
  // Message Bus Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  setConnectionMode: (mode: 'telescope' | 'camera' | 'mount') => void;
  updateDeviceStatus: (status: { telescopeConnected?: boolean; cameraConnected?: boolean; mountConnected?: boolean }) => void;
  addNotification: (notification: { type: 'info' | 'warning' | 'error' | 'success'; message: string }) => void;
  removeNotification: (id: string) => void;
  updateSystemInfo: (info: { cpuUsage?: number; memoryUsage?: number; diskSpace?: number; uptime?: number }) => void;

  // 状态
  connectionMode: 'telescope' | 'camera' | 'mount';
  deviceStatus: {
    telescopeConnected: boolean;
    cameraConnected: boolean;
    mountConnected: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>;
  systemInfo: {
    cpuUsage: number;
    memoryUsage: number;
    diskSpace: number;
    uptime: number;
  };
}

export const useConnectionStore = create<ConnectionState>((set, get) => {
  const config = useConnectionConfigStore.getState();

  // Initialize WebSocket and MessageBus
  const wsClient = new WebSocketClient({
    url: "ws://localhost:8080",
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    debug: true,
    proxy: config.formData.connectionType === "proxy" ? {
      host: config.formData.proxySettings?.host || "",
      port: config.formData.proxySettings?.port || 8080,
      auth: config.formData.proxySettings?.auth,
    } : undefined,
  });

  const messageBus = new MessageBus(wsClient, {
    logLevel: LogLevel.INFO,
    maxRetries: 3,
    retryDelay: 1000,
  });

  // Middleware for logging
  messageBus.use((message, topic, next) => {
    logger.info(`Message received on topic ${topic}:`, message);
    next();
  });

  // Subscribe to connection status
  messageBus.subscribe("connection/status", (message) => {
    try {
      logger.info("Connection status update received:", message);
      useConnectionStatusStore.getState().setConnected(true);
    } catch (error) {
      logger.error("Error validating connection status:", error);
      useConnectionStatusStore.getState().setConnected(false);
    }
  });

  // Subscribe to connection errors
  messageBus.subscribe("connection/error", (error) => {
    logger.error("Connection error:", error);
    useConnectionStatusStore.getState().setConnected(false);
  });

  // 监听设备数据更新
  messageBus.subscribe("device/data", (data) => {
    useDeviceDataStore.getState().update(data);
    logger.info("Device data updated:", data);
  });

  // 处理注册状态
  messageBus.subscribe("registration/status", (regStatus) => {
    useRegistrationStore.getState().update(regStatus);
    logger.info("Registration status updated:", regStatus);
  });

  // 更新 UI 状态
  messageBus.subscribe("ui/state", (uiState) => {
    useUIStore.getState().update(uiState);
    logger.info("UI state updated:", uiState);
  });

  // Cleanup on unload
  const cleanup = () => {
    logger.info("Cleaning up WebSocket and MessageBus subscriptions");
    messageBus.getTopics().forEach((topic) => {
      messageBus.clearTopic(topic);
    });
    wsClient.close();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", cleanup);
  }

  return {
    connectionMode: 'telescope',
    deviceStatus: {
      telescopeConnected: false,
      cameraConnected: false,
      mountConnected: false,
    },
    notifications: [],
    systemInfo: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskSpace: 0,
      uptime: 0,
    },

    connect: async () => {
      const currentConfig = useConnectionConfigStore.getState();
      const currentStatus = useConnectionStatusStore.getState();
      
      useConnectionStatusStore.getState().setLoading(true);
      useConnectionStatusStore.getState().setLastAttemptTimestamp(new Date());

      try {
        if (!useRegistrationStore.getState().isRegistered) {
          throw new Error("Device not registered");
        }

        if (currentStatus.isConnected) {
          useUIStore.getState().updateState({ reconnectDialog: false });
        }

        const connectionConfig = {
          ...currentConfig.formData,
          wsConfig: {
            url: `ws${currentConfig.formData.isSSL ? "s" : ""}://${currentConfig.formData.ip}:${currentConfig.formData.port}`,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            debug: true,
            proxy: currentConfig.formData.connectionType === "proxy" ? {
              host: currentConfig.formData.proxySettings?.host || "",
              port: currentConfig.formData.proxySettings?.port || 8080,
              auth: currentConfig.formData.proxySettings?.auth,
            } : undefined,
          },
        };

        messageBus.publish("connection/connect", connectionConfig);
        useConnectionStatusStore.getState().setLoading(true);
        logger.info("Published connection/connect message:", connectionConfig);

        useDeviceDataStore.getState().setInitializing(true);

        if (!currentStatus.isConnected && currentStatus.autoReconnect) {
          useConnectionStatusStore.getState().setReconnecting(true);
          useUIStore.getState().updateState({ reconnectProgress: true });

          while (
            currentStatus.reconnectAttempts < currentStatus.maxRetries &&
            !currentStatus.isConnected &&
            currentStatus.autoReconnect
          ) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            useConnectionStatusStore.getState().incrementReconnectAttempts();
          }

          useConnectionStatusStore.getState().setReconnecting(false);
          useUIStore.getState().updateState({ reconnectProgress: false });
        }

      } catch (error: unknown) {
        if (error instanceof Error) {
          useConnectionStatusStore.getState().addError({
            code: "UNKNOWN",
            message: error.message,
            timestamp: new Date(),
          });
        }
        useConnectionStatusStore.getState().setConnected(false);
        useUIStore.getState().updateState({ errorDialog: true });
      } finally {
        useConnectionStatusStore.getState().setLoading(false);
        useDeviceDataStore.getState().setInitializing(false);
      }
    },

    disconnect: () => {
      try {
        messageBus.publish("connection/disconnect", {});
        useConnectionStatusStore.getState().setConnected(false);
        logger.info("Published connection/disconnect message.");
      } catch (error) {
        logger.error("Error during disconnect:", error);
      }
    },

    setConnectionMode: (mode) => set({ connectionMode: mode }),
    updateDeviceStatus: (status) => set({ deviceStatus: { ...get().deviceStatus, ...status } }),
    addNotification: (notification) => set((state) => ({
      notifications: [...state.notifications, {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...notification
      }]
    })),
    removeNotification: (id) => set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
    updateSystemInfo: (info) => set((state) => ({
      systemInfo: { ...state.systemInfo, ...info }
    })),
  };
});