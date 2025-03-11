import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";
import { nanoid } from "nanoid";
import { ImportedMacro, ImportedTab, SerialTab } from "@/types/serial/types";

export interface Session {
  id: string;
  name: string;
  timestamp: number;
  settings: Partial<SerialState>;
}

interface SerialStateWithSessions extends SerialState {
  sessions: Session[];
  activeSessionId: string | null;
}

export interface SessionSlice {
  sessions: Session[];
  activeSessionId: string | null;
  saveSession: (name?: string) => string;
  loadSession: (sessionId: string) => boolean;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

export const createSessionSlice: StateCreator<
  SerialStateWithSessions,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  sessions: [],
  activeSessionId: null,

  saveSession: (name = "未命名会话") => {
    const state = get();
    const sessionId = nanoid();
    const newSession: Session = {
      id: sessionId,
      name,
      timestamp: Date.now(),
      settings: {
        theme: state.theme,
        accentColor: state.accentColor,
        showTimestamps: state.showTimestamps,
        serialMode: state.serialMode,
        viewMode: state.viewMode,
        lineEnding: state.lineEnding,
        connectionMode: state.connectionMode,
        backendUrl: state.backendUrl,
        macros: state.macros,
        protocolParser: state.protocolParser,
        tabs: state.tabs.map((tab: SerialTab) => ({
          id: tab.id,
          name: tab.name,
          port: tab.port,
          baudRate: tab.baudRate,
          terminalData: [],
          dataPoints: [],
        })) as SerialTab[],
        activeTabId: state.activeTabId,
      },
    };

    // 添加到会话列表
    set((state) => {
      // 返回一个部分状态更新
      return {
        sessions: [...state.sessions, newSession],
        activeSessionId: sessionId,
      } as Partial<SerialStateWithSessions>;
    });

    // 同时保存到 localStorage
    try {
      const existingSessions = JSON.parse(
        localStorage.getItem("serial-monitor-sessions") || "[]"
      );
      localStorage.setItem(
        "serial-monitor-sessions",
        JSON.stringify([...existingSessions, newSession])
      );
    } catch (error) {
      console.error("Error saving session to localStorage:", error);
    }

    return sessionId;
  },

  // 加载指定会话
  loadSession: (sessionId: string) => {
    const state = get();
    const session = state.sessions.find((s: Session) => s.id === sessionId);

    if (!session) {
      // 尝试从 localStorage 加载
      try {
        const savedSessions = JSON.parse(
          localStorage.getItem("serial-monitor-sessions") || "[]"
        ) as Session[];

        const savedSession = savedSessions.find(
          (s: Session) => s.id === sessionId
        );
        if (savedSession) {
          // 先添加到会话列表
          set(
            (state) =>
              ({
                sessions: [...state.sessions, savedSession],
              } as Partial<SerialStateWithSessions>)
          );

          // 然后应用设置
          set(
            (state) =>
              ({
                ...state,
                ...(savedSession.settings as Partial<SerialStateWithSessions>),
                // 保持当前连接状态，不覆盖
                isConnected: state.isConnected,
                isMonitoring: state.isMonitoring,
                serialInterface: state.serialInterface,
                activeSessionId: sessionId,
              } as Partial<SerialStateWithSessions>)
          );
          return true;
        }
      } catch (error) {
        console.error("Error loading session from localStorage:", error);
      }
      return false;
    }

    // 应用会话设置
    set(
      (state) =>
        ({
          ...state,
          ...(session.settings as Partial<SerialStateWithSessions>),
          // 保持当前连接状态，不覆盖
          isConnected: state.isConnected,
          isMonitoring: state.isMonitoring,
          serialInterface: state.serialInterface,
          activeSessionId: sessionId,
        } as Partial<SerialStateWithSessions>)
    );

    return true;
  },

  // 删除会话
  deleteSession: (sessionId: string) => {
    set((state) => {
      const newSessions = state.sessions.filter(
        (s: Session) => s.id !== sessionId
      );

      // 也从 localStorage 中删除
      try {
        const savedSessions = JSON.parse(
          localStorage.getItem("serial-monitor-sessions") || "[]"
        ) as Session[];

        localStorage.setItem(
          "serial-monitor-sessions",
          JSON.stringify(
            savedSessions.filter((s: Session) => s.id !== sessionId)
          )
        );
      } catch (error) {
        console.error("Error deleting session from localStorage:", error);
      }

      return {
        sessions: newSessions,
        // 如果删除的是当前会话，重置activeSessionId
        activeSessionId:
          state.activeSessionId === sessionId ? null : state.activeSessionId,
      } as Partial<SerialStateWithSessions>;
    });
  },

  // 重命名会话
  renameSession: (sessionId: string, name: string) => {
    set((state) => {
      const updatedSessions = state.sessions.map((session: Session) =>
        session.id === sessionId ? { ...session, name } : session
      );

      // 更新 localStorage
      try {
        const savedSessions = JSON.parse(
          localStorage.getItem("serial-monitor-sessions") || "[]"
        ) as Session[];

        const updatedSavedSessions = savedSessions.map((session: Session) =>
          session.id === sessionId ? { ...session, name } : session
        );

        localStorage.setItem(
          "serial-monitor-sessions",
          JSON.stringify(updatedSavedSessions)
        );
      } catch (error) {
        console.error("Error updating session in localStorage:", error);
      }

      return { sessions: updatedSessions } as Partial<SerialStateWithSessions>;
    });
  },

  // 导出设置为 JSON 字符串
  exportSettings: () => {
    const state = get();
    const settings = {
      theme: state.theme,
      accentColor: state.accentColor,
      showTimestamps: state.showTimestamps,
      serialMode: state.serialMode,
      viewMode: state.viewMode,
      lineEnding: state.lineEnding,
      connectionMode: state.connectionMode,
      backendUrl: state.backendUrl,
      macros: state.macros,
      protocolParser: state.protocolParser,
      tabs: state.tabs.map((tab) => ({
        name: tab.name,
        port: tab.port,
        baudRate: tab.baudRate,
      })),
    };
    return JSON.stringify(settings, null, 2);
  },

  // 从 JSON 字符串导入设置
  importSettings: (settingsJson: string) => {
    try {
      const settings = JSON.parse(settingsJson);

      // 验证设置
      if (!settings) throw new Error("Invalid settings");

      // 定义一个接口来描述解析后的设置对象
      interface ImportedSettings {
        theme?: string;
        accentColor?: string;
        showTimestamps?: boolean;
        serialMode?: string;
        viewMode?: string;
        lineEnding?: string;
        connectionMode?: string;
        backendUrl?: string;
        protocolParser?: unknown;
        macros?: ImportedMacro[];
        tabs?: ImportedTab[];
      }

      // 类型断言，将settings视为ImportedSettings
      const typedSettings = settings as ImportedSettings;

      // 应用设置
      set(() => {
        const updates: Partial<SerialState> = {};

        if (typedSettings.theme)
          updates.theme = typedSettings.theme as SerialState["theme"];
        if (typedSettings.accentColor)
          updates.accentColor =
            typedSettings.accentColor as SerialState["accentColor"];
        if (typedSettings.showTimestamps !== undefined)
          updates.showTimestamps = typedSettings.showTimestamps;
        if (typedSettings.serialMode)
          updates.serialMode =
            typedSettings.serialMode as SerialState["serialMode"];
        if (typedSettings.viewMode)
          updates.viewMode = typedSettings.viewMode as SerialState["viewMode"];
        if (typedSettings.lineEnding)
          updates.lineEnding =
            typedSettings.lineEnding as SerialState["lineEnding"];
        if (typedSettings.connectionMode)
          updates.connectionMode =
            typedSettings.connectionMode as SerialState["connectionMode"];
        if (typedSettings.backendUrl)
          updates.backendUrl = typedSettings.backendUrl;
        if (typedSettings.protocolParser)
          updates.protocolParser =
            typedSettings.protocolParser as SerialState["protocolParser"];

        if (typedSettings.macros && Array.isArray(typedSettings.macros)) {
          updates.macros = typedSettings.macros.map((macro: ImportedMacro) => ({
            ...macro,
            id: macro.id || nanoid(),
          }));
        }

        if (typedSettings.tabs && Array.isArray(typedSettings.tabs)) {
          const newTabs = typedSettings.tabs.map(
            (tabSettings: ImportedTab) => ({
              id: nanoid(),
              name: tabSettings.name || "Imported Connection",
              port: tabSettings.port || "/dev/ttyS0",
              baudRate: tabSettings.baudRate || "115200",
              terminalData: [],
              dataPoints: [],
              parsedMessages: [],
            })
          ) as SerialTab[]; // 添加类型断言

          if (newTabs.length > 0) {
            updates.tabs = newTabs;
            updates.activeTabId = newTabs[0].id;
          }
        }

        return updates;
      });

      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  },
});
