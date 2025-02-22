import { create } from 'zustand';
import { App } from '@/types/extra';
import { ThemeMode } from '@/types/extra/theme';

interface ExtraState {
  apps: App[];
  searchQuery: string;
  selectedCategory: string | string[] | null;
  view: 'grid' | 'list';
  sortMode: 'name' | 'date' | 'category';
  gridSize: number;
  isSidebarOpen: boolean;
  isCompactMode: boolean;
  favorites: string[];
  themeMode: ThemeMode;
  launchedApp: App | null;
  
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | string[] | null) => void;
  setView: (view: 'grid' | 'list') => void;
  togglePin: (appId: string) => void;
  launchApp: (appId: string) => void;
  deleteApp: (appId: string) => void;
  updateAppOrder: (oldIndex: number, newIndex: number) => void;
  editAppName: (appId: string, newName: string) => void;
  addNewApp: (app: App) => void;
  setLaunchedApp: (app: App | null) => void;
  setSortMode: (mode: 'name' | 'date' | 'category') => void;
  setGridSize: (size: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useExtraStore = create<ExtraState>((set, get) => ({
  apps: [],
  searchQuery: '',
  selectedCategory: null,
  view: 'grid',
  sortMode: 'name',
  gridSize: 4,
  isSidebarOpen: false,
  isCompactMode: false,
  favorites: [],
  themeMode: 'system',
  launchedApp: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setView: (view) => set({ view }),
  togglePin: (appId) => {
    const { apps } = get();
    const appIndex = apps.findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      const newApps = [...apps];
      newApps[appIndex] = {
        ...newApps[appIndex],
        isPinned: !newApps[appIndex].isPinned,
      };
      set({ apps: newApps });
    }
  },
  launchApp: (appId) => {
    const { apps } = get();
    const app = apps.find(app => app.id === appId);
    if (app) {
      set({ launchedApp: app });
    }
  },
  deleteApp: (appId) => {
    const { apps } = get();
    set({ apps: apps.filter(app => app.id !== appId) });
  },
  updateAppOrder: (oldIndex, newIndex) => {
    const { apps } = get();
    const newApps = [...apps];
    const [moved] = newApps.splice(oldIndex, 1);
    newApps.splice(newIndex, 0, moved);
    set({ apps: newApps });
  },
  editAppName: (appId, newName) => {
    const { apps } = get();
    const appIndex = apps.findIndex(app => app.id === appId);
    if (appIndex !== -1) {
      const newApps = [...apps];
      newApps[appIndex] = {
        ...newApps[appIndex],
        name: newName,
      };
      set({ apps: newApps });
    }
  },
  addNewApp: (app) => {
    const { apps } = get();
    set({ apps: [...apps, app] });
  },
  setLaunchedApp: (app) => set({ launchedApp: app }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setGridSize: (size) => set({ gridSize: size }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setCompactMode: (compact) => set({ isCompactMode: compact }),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));

// 添加主题系统同步
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const { themeMode, setThemeMode } = useExtraStore.getState();
    if (themeMode === 'system') {
      setThemeMode(e.matches ? 'dark' : 'light');
    }
  };

  mediaQuery.addEventListener('change', handleThemeChange);
  handleThemeChange(mediaQuery);
}
