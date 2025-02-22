"use client";

import { useState, useCallback } from "react";
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
import type { Target } from "@/stores/sequencer";

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
    }
  }, [targets, updateTarget]);

  const filterTargets = useCallback((targets: Target[]) => {
    return targets
      .filter((target) => {
        // Search filter
        if (filters.search && !target.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        // Category filter
        if (filters.category !== "all" && target.category !== filters.category) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort based on selected field
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
          default:
            comparison = 0;
        }
        // Apply sort direction
        return filters.sortDirection === "asc" ? comparison : -comparison;
      });
  }, [filters]);

  const filteredTargets = filterTargets(targets);

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">目标列表</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TargetFilters onFiltersChange={setFilters} />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTargets.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredTargets.length > 0 ? (
                    filteredTargets.map((target) => (
                      <SortableItem 
                        key={target.id}
                        value={target.id}
                        showHandle={true}
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`
                            group rounded-lg bg-gray-800/30 hover:bg-gray-800/50
                            border border-gray-700 hover:border-gray-600
                            transition-colors cursor-pointer
                            ${target.id === activeTargetId ? "bg-gray-800/70" : ""}
                          `}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-base font-medium">
                                  {target.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {target.category}
                                </p>
                              </div>
                              <div className="text-sm text-gray-400">
                                {target.tasks.length} 个任务
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </SortableItem>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center p-8 text-gray-400"
                    >
                      <p className="text-sm">没有找到匹配的目标</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-400">
              共 {filteredTargets.length} 个目标
            </div>
            <Button variant="outline" size="sm" className="h-8">
              添加目标
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
