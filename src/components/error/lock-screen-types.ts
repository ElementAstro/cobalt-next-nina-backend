import { create } from "zustand";

export interface MinimalModeConfig {
  showTime?: boolean;
  showWeather?: boolean;
  showNotifications?: boolean;
  showMusicControls?: boolean;
  showQuickLaunch?: boolean;
  showStatusIndicators?: boolean;
}

export interface LockScreenProps {
  backgroundImage?: string;
  showWeather?: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  isConnected?: boolean;
  minimalMode?: boolean;
  minimalModeConfig?: MinimalModeConfig;
  inactivityTimeout?: number;
}

export interface LockScreenState {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  lastActivityTime: number;
  updateLastActivityTime: () => void;
}

export const useLockScreenStore = create<LockScreenState>((set) => ({
  isLocked: true,
  setIsLocked: (locked) => set({ isLocked: locked }),
  lastActivityTime: Date.now(),
  updateLastActivityTime: () => set({ lastActivityTime: Date.now() }),
}));

export interface QuickLaunchItem {
  icon: React.ReactNode;
  action: () => void;
  label: string;
  color: string;
  borderColor: string;
  iconColor: string;
}