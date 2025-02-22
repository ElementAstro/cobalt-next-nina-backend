import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode, ColorMode } from '@/types/extra/theme';

interface SettingsState {
  appearance: {
    theme: ThemeMode;
    color: ColorMode;
    radius: number;
  };
  performance: {
    animations: boolean;
    reducedMotion: boolean;
  };
  setTheme: (theme: ThemeMode) => void;
  setColor: (color: ColorMode) => void;
  setRadius: (radius: number) => void;
  toggleAnimations: () => void;
  toggleReducedMotion: () => void;
  updateSettings: (settings: Partial<{
    appearance: Partial<SettingsState['appearance']>;
    performance: Partial<SettingsState['performance']>;
  }>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: {
        theme: 'system',
        color: 'light',
        radius: 0.5,
      },
      performance: {
        animations: true,
        reducedMotion: false,
      },
      setTheme: (theme) => set((state) => ({
        appearance: { ...state.appearance, theme }
      })),
      setColor: (color) => set((state) => ({
        appearance: { ...state.appearance, color }
      })),
      setRadius: (radius) => set((state) => ({
        appearance: { ...state.appearance, radius }
      })),
      toggleAnimations: () => set((state) => ({
        performance: { 
          ...state.performance,
          animations: !state.performance.animations
        }
      })),
      toggleReducedMotion: () => set((state) => ({
        performance: {
          ...state.performance,
          reducedMotion: !state.performance.reducedMotion
        }
      })),
      updateSettings: (settings) => set((state) => ({
        appearance: {
          ...state.appearance,
          ...(settings.appearance || {}),
        },
        performance: {
          ...state.performance,
          ...(settings.performance || {}),
        },
      })),
    }),
    {
      name: 'extra-settings',
    }
  )
);

// 添加主题系统检测和自动切换
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const settings = useSettingsStore.getState();
    if (settings.appearance.theme === 'system') {
      settings.setColor(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleThemeChange);
  handleThemeChange(mediaQuery);
}
