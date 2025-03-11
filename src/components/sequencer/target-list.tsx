"use client";

import { useState, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSequencerStore } from "@/stores/sequencer";
import { SortableItem } from "./sortable-item";
import { TargetFilters } from "./target-filters";
import { type Target } from "@/stores/sequencer";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Telescope, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMediaQuery } from "react-responsive";

interface LoadingStateProps {
  message?: string;
}

const LoadingState = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center p-8 text-gray-400"
    role="status"
  >
    <motion.div
      animate={{ 
        rotate: 360,
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{ 
        rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
        opacity: { duration: 2, repeat: Infinity, repeatType: "reverse" },
      }}
    >
      <Loader2 className="w-12 h-12 mb-4" />
    </motion.div>
    <p>加载目标列表中...</p>
  </motion.div>
));

LoadingState.displayName = "LoadingState";

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center p-8 text-gray-400"
    role="status"
  >
    <motion.div
      animate={{ 
        y: [0, -8, 0],
        opacity: [0.5, 0.8, 0.5] 
      }}
      transition={{ 
        duration: 2.5, 
        repeat: Infinity,
        repeatType: "reverse" 
      }}
    >
      <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
    </motion.div>
    <p>没有找到匹配的目标</p>
  </motion.div>
));

EmptyState.displayName = "EmptyState";

interface TargetItemProps {
  target: Target;
  isActive: boolean;
}

const TargetItem = memo(({ target, isActive }: TargetItemProps) => {
  // 计算完成进度
  const completedTasks = target.tasks.filter(task => task.status === "completed").length;
  const progress = target.tasks.length > 0 
    ? Math.round((completedTasks / target.tasks.length) * 100)
    : 0;
    
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ 
        y: -3,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        transition: { duration: 0.2 } 
      }}
      className={`
        group rounded-lg bg-gray-800/30 hover:bg-gray-800/50
        border border-gray-700 hover:border-gray-600
        transition-all cursor-pointer
        ${isActive ? "bg-gray-800/70 ring-2 ring-teal-500/50" : ""}
      `}
      role="button"
      aria-selected={isActive}
      tabIndex={0}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium group-hover:text-teal-400 transition-colors">
              {target.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-gray-800/50 border-gray-700">
                {target.category}
              </Badge>
              {target.tasks.some(task => task.status === "running") && (
                <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/50">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mr-1"
                  >
                    <Loader2 className="w-3 h-3" />
                  </motion.div>
                  运行中
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2 font-mono">
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
              >
                {`RA: ${target.coordinates.ra.h}h ${target.coordinates.ra.m}m ${target.coordinates.ra.s}s`}
                <br />
                {`Dec: ${target.coordinates.dec.d}° ${target.coordinates.dec.m}' ${target.coordinates.dec.s}"`}
              </motion.div>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between h-full">
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {target.tasks.length} 个任务
            </div>
            
            {target.tasks.length > 0 && (
              <motion.div 
                className="mt-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <Progress 
                    value={progress} 
                    className="h-1 w-16" 
                  />
                  <span className="text-xs text-gray-400 tabular-nums">
                    {progress}%
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* 选中状态指示器 */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="absolute inset-y-0 left-0 w-1 bg-teal-500"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

TargetItem.displayName = "TargetItem";

interface FilterState {
  search: string;
  category: string;
  sort: "name" | "category" | "tasks";
  sortDirection: "asc" | "desc";
  view: "grid" | "list";
}

export function TargetList() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    sort: "name",
    sortDirection: "asc",
    view: "list",
  });

  const { targets, activeTargetId, updateTarget } = useSequencerStore();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const parentRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = targets.findIndex((t: Target) => t.id === active.id);
      const newIndex = targets.findIndex((t: Target) => t.id === over.id);
      const newTargets = arrayMove(targets, oldIndex, newIndex);
      updateTarget(newTargets[newIndex].id, newTargets[newIndex]);
      toast({
        title: "目标顺序已更新",
        description: "已成功调整目标顺序",
      });
    }
  }, [targets, updateTarget]);

  const filterTargets = useCallback((targets: Target[]) => {
    return targets
      .filter((target) => {
        if (filters.search && !target.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        if (filters.category !== "all" && target.category !== filters.category) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (filters.sort) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "category":
            comparison = a.category.localeCompare(b.category);
            break;
          case "tasks":
            comparison = a.tasks.length - b.tasks.length;
            break;
        }
        return filters.sortDirection === "asc" ? comparison : -comparison;
      });
  }, [filters]);

  const filteredTargets = filterTargets(targets);

  // 虚拟滚动设置
  const virtualizer = useVirtualizer({
    count: filteredTargets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 预估每个目标的高度
    overscan: 5, // 预加载数量
  });

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-colors shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Telescope className="w-5 h-5 text-teal-500" />
          </motion.div>
          <CardTitle className="text-xl">目标列表</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TargetFilters onFiltersChange={setFilters} />

          {filteredTargets.length === 0 ? (
            <EmptyState />
          ) : (
            <div 
              ref={parentRef}
              className="h-[600px] overflow-auto relative rounded-md border border-gray-800 bg-gray-900/30"
              role="list"
              aria-label="目标列表"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredTargets.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div 
                    className="relative p-2 space-y-2"
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                  >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                      const target = filteredTargets[virtualRow.index];
                      return (
                        <div
                          key={target.id}
                          className="absolute top-0 left-0 w-full px-2"
                          style={{
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <SortableItem 
                            key={target.id}
                            value={target.id}
                          >
                            <TargetItem
                              target={target}
                              isActive={target.id === activeTargetId}
                            />
                          </SortableItem>
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {/* 滚动阴影效果 */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-900/70 to-transparent z-10"></div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900/70 to-transparent z-10"></div>
            </div>
          )}

          {isMobile && (
            <div className="fixed bottom-4 right-4 z-50">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  size="lg"
                  className="rounded-full shadow-lg bg-teal-500 hover:bg-teal-600"
                  onClick={() => {
                    const element = parentRef.current;
                    if (element) {
                      element.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ↑
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
