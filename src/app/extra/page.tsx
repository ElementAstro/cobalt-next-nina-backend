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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppLaunchModal } from "@/components/extra/app-launch-modal";
import { AppStatistics } from "@/components/extra/app-statistics";
import {
  CheckSquare,
  Grid,
  List,
  Menu,
  Pin,
  Settings,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import { App } from "@/types/extra";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStatistics } from "@/stores/extra/statistics";
import useAnalyticsStore from "@/stores/extra/analytics";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppUsageTrackerProps {
  appId: string | null;
  onTrackUsage: (id: string, duration: number) => void;
  onAddUsage: (id: string, duration: number) => void;
}

function useAppUsageTracker({
  appId,
  onTrackUsage,
  onAddUsage,
}: AppUsageTrackerProps) {
  useEffect(() => {
    if (!appId) return;

    const startTime = Date.now();
    return () => {
      const duration = (Date.now() - startTime) / 1000;
      onTrackUsage(appId, duration);
      onAddUsage(appId, duration);
    };
  }, [appId, onTrackUsage, onAddUsage]);
}

const motionConfig = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  sidebar: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: { opacity: 0, y: -20 },
    whileHover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 300,
      },
    },
    whileTap: { scale: 0.98 },
  },
} as const;

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
  } = useExtraStore();

  const { trackAppUsage } = useAnalyticsStore();
  const { addUsage } = useStatistics();

  const isDesktop = useMediaQuery({ query: "(min-width: 1024px)" });
  const [mounted, setMounted] = useState(false);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // 使用应用追踪器
  useAppUsageTracker({
    appId: activeAppId,
    onTrackUsage: trackAppUsage,
    onAddUsage: addUsage,
  });

  useEffect(() => {
    setMounted(true);
    if (isDesktop) {
      setSidebarOpen(true);
    }
  }, [isDesktop]);

  const filteredApps = useMemo(() => {
    return apps.filter((app: App) => {
      const matchesSearch = app.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        (Array.isArray(selectedCategory)
          ? selectedCategory.includes(app.category)
          : app.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, selectedCategory]);

  const recentApps = useMemo(() => {
    return [...apps]
      .filter((app: App) => app.lastOpened)
      .sort((a, b) => {
        return (
          new Date(b.lastOpened!).getTime() - new Date(a.lastOpened!).getTime()
        );
      })
      .slice(0, 4);
  }, [apps]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLaunchApp = useCallback(
    (appId: string) => {
      launchApp(appId);
      setActiveAppId(appId);
      if (!isDesktop) {
        setSidebarOpen(false);
      }
    },
    [launchApp, isDesktop]
  );

  const handleCloseApp = useCallback(() => {
    setActiveAppId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = apps.findIndex((app: App) => app.id === active.id);
        const newIndex = apps.findIndex((app: App) => app.id === over?.id);
        updateAppOrder(oldIndex, newIndex);
      }
    },
    [apps, updateAppOrder]
  );

  const handleBatchOperation = useCallback(
    (operation: "pin" | "delete") => {
      selectedApps.forEach((appId) => {
        if (operation === "pin") {
          togglePin(appId);
        } else if (operation === "delete") {
          deleteApp(appId);
        }
      });
      setSelectedApps([]);
      setIsSelectionMode(false);
    },
    [selectedApps, togglePin, deleteApp]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <motion.div
        {...motionConfig.container}
        className="h-screen bg-background/95 dark:bg-background/90 backdrop-blur-sm flex flex-col"
      >
        <main className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
          <AnimatePresence mode="wait">
            {(isDesktop || sidebarOpen) && (
              <motion.div
                {...motionConfig.sidebar}
                className={cn(
                  "w-72 border-r bg-background/60 backdrop-blur-sm p-4 shrink-0",
                  isDesktop ? "block" : "fixed inset-y-0 left-0 z-50"
                )}
              >
                <ScrollArea className="h-full">
                  <div className="space-y-6 pb-4">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <User className="h-5 w-5" />
                      </Button>
                      <SearchBar
                        initialSuggestions={apps.map((app) => app.name)}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="搜索应用..."
                        variant="minimal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">分类筛选</Label>
                      <CategoryFilter
                        selectedCategory={selectedCategory}
                        onSelectCategory={(category) => {
                          setSelectedCategory(category);
                          if (!isDesktop) {
                            setSidebarOpen(false);
                          }
                        }}
                        orientation="vertical"
                        showCounts
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">最近使用</Label>
                      <div className="space-y-1">
                        {recentApps.map((app) => (
                          <motion.div
                            key={app.id}
                            {...motionConfig.item}
                            onClick={() => handleLaunchApp(app.id)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer group"
                          >
                            <Image
                              src={app.icon}
                              alt={app.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span className="text-sm truncate flex-1">
                              {app.name}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-hidden flex flex-col">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm p-4 border-b">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                {!isDesktop && (
                  <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <Menu className="h-5 w-5" />
                  </Button>
                )}

                <div className="flex-1 lg:hidden">
                  <SearchBar
                    initialSuggestions={apps.map((app) => app.name)}
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="搜索应用..."
                    variant="default"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isSelectionMode && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleBatchOperation("pin")}
                        disabled={selectedApps.length === 0}
                        className="gap-2"
                      >
                        <Pin className="w-4 h-4" />
                        <span className="hidden sm:inline">固定</span>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleBatchOperation("delete")}
                        disabled={selectedApps.length === 0}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">删除</span>
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className="gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">多选</span>
                  </Button>

                  <AddAppDialog onAddApp={addNewApp} />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setView(view === "grid" ? "list" : "grid")}
                  >
                    {view === "grid" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <Grid className="h-4 w-4" />
                    )}
                  </Button>

                  <Sheet open={showStatsSheet} onOpenChange={setShowStatsSheet}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>使用统计</SheetTitle>
                        <SheetDescription>
                          查看应用使用情况和趋势分析
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-4">
                        <AppStatistics />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </header>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredApps.map((app) => app.id)}
                    strategy={
                      view === "grid"
                        ? horizontalListSortingStrategy
                        : verticalListSortingStrategy
                    }
                  >
                    <div
                      className={cn(
                        "max-w-7xl mx-auto",
                        view === "grid"
                          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                          : "space-y-2"
                      )}
                    >
                      {filteredApps.map((app) => (
                        <AppIcon
                          key={app.id}
                          id={app.id}
                          name={app.name}
                          icon={app.icon}
                          isPinned={app.isPinned}
                          category={app.category}
                          onPin={() => togglePin(app.id)}
                          onLaunch={() => handleLaunchApp(app.id)}
                          onDelete={() => deleteApp(app.id)}
                          onEdit={(newName) => editAppName(app.id, newName)}
                          view={view}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedApps.includes(app.id)}
                          onSelect={(id) => {
                            setSelectedApps((prev) =>
                              prev.includes(id)
                                ? prev.filter((appId) => appId !== id)
                                : [...prev, id]
                            );
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </ScrollArea>
          </div>
        </main>
      </motion.div>
      <AppLaunchModal
        app={launchedApp}
        onClose={() => {
          setLaunchedApp(null);
          handleCloseApp();
        }}
      />
    </TooltipProvider>
  );
}
