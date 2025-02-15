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
    const matchesCategory =
      !selectedCategory || app.category === selectedCategory;
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

  useEffect(() => {
    if (appearance.theme !== themeMode) {
      setThemeMode(appearance.theme);
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

  // 修复排序模式的类型
  const handleSortModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortMode(e.target.value as SortMode);
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
        className="min-h-screen bg-background flex flex-col"
      >
        {/* 新增设置面板 */}
        <div className="p-2 border-b flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1">
            <Label>工作区:</Label>
            <Select
              value={activeWorkspace || ""}
              onValueChange={handleWorkspaceChange}
            >
              <SelectTrigger>
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
          </div>
          <Button onClick={handleUpdateLayout}>更新布局</Button>
          <div className="flex items-center gap-1">
            <Label>排序:</Label>
            <select
              value={sortMode}
              onChange={handleSortModeChange}
              className="p-1 border rounded"
            >
              <option value="name">名称</option>
              <option value="date">日期</option>
              <option value="category">分类</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Label>网格大小: {gridSize}</Label>
            <Button onClick={() => setGridSize(gridSize + 1)}>+</Button>
            <Button onClick={() => setGridSize(Math.max(1, gridSize - 1))}>
              -
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Label>紧凑模式:</Label>
            <input
              type="checkbox"
              checked={isCompactMode}
              onChange={() => setCompactMode(!isCompactMode)}
            />
          </div>
          <Button onClick={() => updateSettings({})}>
            <Settings className="w-4 h-4 mr-1" />
            更新设置
          </Button>
          <div className="flex items-center gap-1">
            <Label>收藏数:</Label>
            <span>{favorites.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Label>收藏统计:</Label>
            <span>{analyticsFavorites.length}</span>
          </div>
        </div>

        <main className="flex-1 h-screen overflow-y-auto">
          <div className="container mx-auto p-3 max-w-7xl">
            {/* Top Bar */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm -mx-3 px-3 py-2 border-b"
            >
              <div className="flex items-center gap-4 p-4 border-b">
                {!isDesktop && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div className="flex flex-wrap gap-4 items-center flex-1 min-w-[200px]">
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SearchBar
                      initialSuggestions={apps.map((app) => app.name)}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="搜索应用..."
                      variant="default"
                    />
                  </motion.div>
                </div>
                <div className="flex items-center gap-2">
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
              {/* 横屏模式下显示分类过滤器 */}
              <div className="landscape:hidden">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
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
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">已固定</h2>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      全部 {">"}
                    </Link>
                  </div>
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
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">所有应用</h2>
                  </div>
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
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">最近使用</h2>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      更多 {">"}
                    </Link>
                  </div>
                  <motion.div
                    className="grid gap-2"
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
            {/* 添加统计部分 */}
            <div className="mt-6">
              <AppStatistics />
            </div>
          </div>
        </main>
      </motion.div>
      <AppLaunchModal app={launchedApp} onClose={() => setLaunchedApp(null)} />
    </TooltipProvider>
  );
}
