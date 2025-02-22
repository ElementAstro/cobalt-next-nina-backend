"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import { useExtraStore } from "@/stores/extra";
import { SearchBar } from "@/components/extra/search-bar";
import { CategoryFilter } from "@/components/extra/category-filter";
import { AppIcon } from "@/components/extra/app-icon";
import { AddAppDialog } from "@/components/extra/add-app-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppLaunchModal } from "@/components/extra/app-launch-modal";
import { AppStatistics } from "@/components/extra/app-statistics";
import { useHotkeys } from "react-hotkeys-hook";
import { useStatistics } from "@/stores/extra/statistics";
import useAnalyticsStore from "@/stores/extra/analytics";
import { useSettingsStore } from "@/stores/extra/settings";
import useWorkspaceStore from "@/stores/extra/workspace";
import {
  CheckSquare,
  Clock,
  Grid,
  List,
  Menu,
  Moon,
  Pin,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { App } from "@/types/extra";

// 添加排序模式类型
type SortMode = "name" | "date" | "category";

const animationVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.98,
  },
};

export default function SoftwareList() {
  const {
    apps,
    searchQuery,
    selectedCategory,
    view,
    setSearchQuery,
    setSelectedCategory,
    setView,
    togglePin,
    launchApp,
    deleteApp,
    updateAppOrder,
    editAppName,
    addNewApp,
    launchedApp,
    setLaunchedApp,
    sortMode,
    gridSize,
    isSidebarOpen,
    isCompactMode,
    favorites,
    setSortMode,
    setGridSize,
    setSidebarOpen,
    setCompactMode,
    themeMode,
    setThemeMode,
  } = useExtraStore();

  const { trackAppUsage, favorites: analyticsFavorites } = useAnalyticsStore();

  const { appearance, performance, updateSettings } = useSettingsStore();

  const {
    workspaces,
    activeWorkspace,
    createWorkspace,
    setActiveWorkspace,
    updateWorkspaceLayout,
  } = useWorkspaceStore();

  const { addUsage } = useStatistics();

  const isDesktop = useMediaQuery({ query: "(min-width: 1024px)" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 修复创建工作区的调用
  useEffect(() => {
    if (!activeWorkspace) {
      createWorkspace({
        name: "默认工作区",
        apps: [],
        layout: "grid",
        sortOrder: [],
        filters: {},
      });
    }
  }, [activeWorkspace, createWorkspace]);

  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const filteredApps = apps.filter((app: App) => {
    const matchesSearch = app.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory ||
      (Array.isArray(selectedCategory)
        ? selectedCategory.includes(app.category)
        : app.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const pinnedApps = filteredApps.filter((app: App) => app.isPinned);
  const recentApps = [...apps]
    .filter((app) => app.lastOpened)
    .sort(
      (a, b) =>
        new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime()
    )
    .slice(0, 4);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 使用 useCallback 包装 handleDragEnd，并使用 arrayMove 以展示其用法
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = apps.findIndex((app: App) => app.id === active.id);
        const newIndex = apps.findIndex((app: App) => app.id === over?.id);
        const newOrder = arrayMove(apps, oldIndex, newIndex);
        console.log("新的排序:", newOrder);
        updateAppOrder(oldIndex, newIndex);
      }
    },
    [apps, updateAppOrder]
  );

  useEffect(() => {
    console.log("Current view:", view);
  }, [view]);

  const handleBatchOperation = (operation: "pin" | "delete") => {
    selectedApps.forEach((appId) => {
      if (operation === "pin") {
        togglePin(appId);
      } else if (operation === "delete") {
        deleteApp(appId);
      }
    });
    setSelectedApps([]);
    setIsSelectionMode(false);
  };

  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      switch (sortMode) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return (
            new Date(b.lastOpened || 0).getTime() -
            new Date(a.lastOpened || 0).getTime()
          );
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  }, [filteredApps, sortMode]);

  // 添加快捷键支持
  useHotkeys("ctrl+f", () => {
    const searchInput = document.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  useHotkeys("ctrl+g", () => {
    setView(view === "grid" ? "list" : "grid");
  });

  useHotkeys("ctrl+d", () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
  });

  // 修改启动应用的处理函数
  const handleLaunchApp = useCallback(
    (appId: string) => {
      const startTime = Date.now();
      launchApp(appId);
      const cleanup = () => {
        const duration = (Date.now() - startTime) / 1000;
        addUsage(appId, duration);
        trackAppUsage(appId, duration);
      };
      return cleanup;
    },
    [launchApp, addUsage, trackAppUsage]
  );

  // 同步主题设置
  useEffect(() => {
    if (appearance.theme !== themeMode) {
      const newTheme = appearance.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : appearance.theme;
      setThemeMode(newTheme);
    }
  }, [appearance.theme, themeMode, setThemeMode]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-animations",
      performance.animations ? "true" : "false"
    );
  }, [performance.animations]);

  useEffect(() => {
    if (performance.reducedMotion) {
      document.documentElement.style.setProperty("--app-animations", "false");
    }
  }, [performance.reducedMotion]);

  const handleWorkspaceChange = (value: string) => {
    if (value) {
      setActiveWorkspace(value);
    }
  };

  // 修复工作区布局更新
  const handleUpdateLayout = () => {
    if (activeWorkspace) {
      updateWorkspaceLayout(activeWorkspace, "grid");
    }
  };

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            duration: 0.5,
            ease: "easeOut",
          },
        }}
        className="min-h-screen bg-background/95 dark:bg-background/90 backdrop-blur-sm flex flex-col"
      >
        {/* 新增设置面板 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 border-b bg-background/60 dark:bg-background/40 backdrop-blur-md shadow-sm"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-4 rounded-lg bg-background/40 dark:bg-background/20 border shadow-sm">
              <Label className="text-sm font-medium">工作区设置</Label>
              <Select
                value={activeWorkspace || ""}
                onValueChange={handleWorkspaceChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择工作区" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(workspaces).map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUpdateLayout}
                className="w-full"
              >
                更新布局
              </Button>
            </div>
            
            <div className="space-y-2 p-4 rounded-lg bg-background/40 dark:bg-background/20 border shadow-sm">
              <Label className="text-sm font-medium">显示设置</Label>
              <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">按名称</SelectItem>
                  <SelectItem value="date">按日期</SelectItem>
                  <SelectItem value="category">按分类</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">网格大小</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGridSize(Math.max(1, gridSize - 1))}
                    className="h-8 w-8"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{gridSize}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGridSize(gridSize + 1)}
                    className="h-8 w-8"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-background/40 dark:bg-background/20 border shadow-sm">
              <Label className="text-sm font-medium">界面选项</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">紧凑模式</Label>
                  <input
                    type="checkbox"
                    checked={isCompactMode}
                    onChange={() => setCompactMode(!isCompactMode)}
                    className="rounded border-primary"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => updateSettings({})}>
                  <Settings className="w-4 h-4 mr-2" />
                  更新设置
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-lg bg-background/40 dark:bg-background/20 border shadow-sm">
              <Label className="text-sm font-medium">统计信息</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">收藏总数</Label>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                    {favorites.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">统计总数</Label>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                    {analyticsFavorites.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <main className="flex-1 h-screen overflow-y-auto">
          <div className="container mx-auto p-3 max-w-7xl">
            {/* Top Bar */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm -mx-3 px-3 py-2 border-b"
            >
              <div className="flex items-center gap-4 p-4 border-b bg-background/40 dark:bg-background/20 backdrop-blur-md">
                {!isDesktop && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(!isSidebarOpen)}
                      className="hover:bg-primary/10"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
                <div className="flex-1 min-w-[200px]">
                  <motion.div
                    className="w-full max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SearchBar
                      initialSuggestions={apps.map((app) => app.name)}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="搜索应用...(Ctrl+F)"
                      variant="default"
                      className="w-full shadow-sm"
                    />
                  </motion.div>
                </div>
                <div className="flex items-center gap-3">
                  {isSelectionMode && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleBatchOperation("pin")}
                        disabled={selectedApps.length === 0}
                      >
                        <Pin className="w-4 h-4 mr-2" />
                        固定所选
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleBatchOperation("delete")}
                        disabled={selectedApps.length === 0}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除所选
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className="relative"
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        取消选择
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        多选
                      </>
                    )}
                    {selectedApps.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                        {selectedApps.length}
                      </span>
                    )}
                  </Button>
                  <AddAppDialog onAddApp={addNewApp} />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newTheme = themeMode === "light" ? "dark" : "light";
                      setThemeMode(newTheme);
                    }}
                    aria-label="切换主题"
                    className="hover:scale-105 active:scale-95 transition-transform"
                  >
                    {themeMode === "light" ? (
                      <Moon className="h-4 w-4 transition-transform" />
                    ) : (
                      <Sun className="h-4 w-4 transition-transform" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setView(view === "grid" ? "list" : "grid")}
                    aria-label={
                      view === "grid" ? "切换到列表视图" : "切换到网格视图"
                    }
                    className="hover:scale-105 active:scale-95 transition-transform"
                  >
                    {view === "grid" ? (
                      <List className="h-4 w-4 transition-transform" />
                    ) : (
                      <Grid className="h-4 w-4 transition-transform" />
                    )}
                  </Button>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="py-3 px-4 bg-background/40 dark:bg-background/20 backdrop-blur-md border-t"
              >
                <div className="max-w-5xl mx-auto space-y-2">
                  <div className="w-full">
                    <CategoryFilter
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                        显示: {filteredApps.length}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary/30"></span>
                        总计: {apps.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>分类数: {Array.from(new Set(apps.map(app => app.category))).length}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Content Sections */}
            <motion.div
              variants={animationVariants.container}
              initial="hidden"
              animate="visible"
              className="space-y-6 mt-4"
            >
              {/* Grid/List Views */}
              <motion.div
                layout
                layoutRoot
                transition={{
                  layout: { duration: 0.3 },
                }}
                className={cn(
                  view === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
                    : "space-y-1.5"
                )}
              >
                {/* Pinned Section */}
                <section className="bg-background/40 dark:bg-background/20 rounded-lg p-4 border shadow-sm">
                  <motion.div
                    className="flex justify-between items-center mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Pin className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">已固定</h2>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                        {pinnedApps.length}
                      </span>
                    </div>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline group flex items-center gap-1"
                    >
                      全部
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {">"}
                      </span>
                    </Link>
                  </motion.div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pinnedApps.map((app) => app.id)}
                      strategy={
                        view === "grid"
                          ? horizontalListSortingStrategy
                          : verticalListSortingStrategy
                      }
                    >
                      <div
                        className={cn(
                          view === "grid"
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full overflow-x-auto"
                            : "space-y-2"
                        )}
                      >
                        <AnimatePresence>
                          {pinnedApps.map((app) => (
                            <AppIcon
                              key={app.id}
                              id={app.id}
                              name={app.name}
                              icon={app.icon}
                              isPinned={app.isPinned}
                              category={app.category}
                              onPin={() => togglePin(app.id)}
                              onLaunch={() => {
                                const cleanup = handleLaunchApp(app.id);
                                // 组件卸载时清理
                                return () => cleanup();
                              }}
                              onDelete={() => deleteApp(app.id)}
                              onEdit={(newName) => editAppName(app.id, newName)}
                              view={view}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </DndContext>
                </section>

                {/* All Apps Section */}
                <section className="bg-background/40 dark:bg-background/20 rounded-lg p-4 border shadow-sm">
                  <motion.div
                    className="flex justify-between items-center mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Grid className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">所有应用</h2>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                        {sortedApps.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>按 {
                        sortMode === "name" ? "名称" :
                        sortMode === "date" ? "日期" :
                        "分类"
                      } 排序</span>
                    </div>
                  </motion.div>
                  <motion.div
                    className={cn(
                      view === "grid"
                        ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full overflow-x-auto"
                        : "space-y-2"
                    )}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                  >
                    <AnimatePresence>
                      {sortedApps.map((app) => (
                        <motion.div
                          key={app.id}
                          variants={{
                            hidden: { y: 20, opacity: 0 },
                            visible: {
                              y: 0,
                              opacity: 1,
                            },
                          }}
                        >
                          <AppIcon
                            id={app.id}
                            name={app.name}
                            icon={app.icon}
                            isPinned={app.isPinned}
                            category={app.category}
                            onPin={() => togglePin(app.id)}
                            onLaunch={() => {
                              const cleanup = handleLaunchApp(app.id);
                              // 组件卸载时清理
                              return () => cleanup();
                            }}
                            onDelete={() => deleteApp(app.id)}
                            onEdit={(newName) => editAppName(app.id, newName)}
                            view={view}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </section>

                {/* Recent Apps Section */}
                <section className="bg-background/40 dark:bg-background/20 rounded-lg p-4 border shadow-sm">
                  <motion.div
                    className="flex justify-between items-center mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">最近使用</h2>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                        {recentApps.length}
                      </span>
                    </div>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline group flex items-center gap-1"
                    >
                      更多
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {">"}
                      </span>
                    </Link>
                  </motion.div>
                  <motion.div
                    className="grid gap-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                  >
                    {recentApps.map((app) => (
                      <motion.div
                        key={app.id}
                        variants={{
                          hidden: { x: -20, opacity: 0 },
                          visible: { x: 0, opacity: 1 },
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                        onClick={() => launchApp(app.id)}
                      >
                        <Image
                          src={app.icon}
                          alt={app.name}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <div className="flex flex-col">
                          <Label className="font-medium">{app.name}</Label>
                          <Label className="text-muted-foreground">
                            {new Date(app.lastOpened!).toLocaleString("zh-CN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Label>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              </motion.div>
            </motion.div>
            {/* 统计部分 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-8 mb-6"
            >
              <div className="bg-background/40 dark:bg-background/20 rounded-lg p-6 border shadow-sm">
                <motion.div
                  className="flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">使用统计</h2>
                </motion.div>
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent pointer-events-none dark:from-background/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <AppStatistics />
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </motion.div>
      <AppLaunchModal app={launchedApp} onClose={() => setLaunchedApp(null)} />
    </TooltipProvider>
  );
}
