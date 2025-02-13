import { create } from "zustand";

interface UIState {
  // 基础状态
  isDarkMode: boolean;
  sidebarOpen: boolean;
  activeSidebarItem: string;

  // 对话框状态
  errorDialog: boolean;
  reconnectDialog: boolean;
  reconnectProgress: boolean;

  // 方法
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarItem: (item: string) => void;
  update: (
    data: Partial<
      Omit<
        UIState,
        | "update"
        | "updateState"
        | "toggleDarkMode"
        | "setSidebarOpen"
        | "setActiveSidebarItem"
      >
    >
  ) => void;
  updateState: (state: {
    errorDialog?: boolean;
    reconnectDialog?: boolean;
    reconnectProgress?: boolean;
  }) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 基础状态初始值
  isDarkMode: false,
  sidebarOpen: true,
  activeSidebarItem: "connection",

  // 对话框状态初始值
  errorDialog: false,
  reconnectDialog: false,
  reconnectProgress: false,

  // 方法实现
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
  update: (data) => set((state) => ({ ...state, ...data })),
  updateState: (newState) => set((state) => ({ ...state, ...newState })),
}));
