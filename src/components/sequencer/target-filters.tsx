"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  Search,
  X,
  SortAsc,
  SortDesc,
  Grid2X2,
  List,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSequencerStore } from "@/stores/sequencer";
import type { Target } from "@/stores/sequencer";

interface FilterState {
  search: string;
  category: string;
  sort: "name" | "category" | "tasks";
  sortDirection: "asc" | "desc";
  view: "grid" | "list";
}

interface FilterProps {
  onFiltersChange: (filters: FilterState) => void;
}

export function TargetFilters({ onFiltersChange }: FilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    sort: "name",
    sortDirection: "asc",
    view: "grid",
  });

  const { targets } = useSequencerStore();

  // 获取所有唯一的目标分类
  const categories = Array.from(new Set(targets.map((t: Target) => t.category)));

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const toggleSortDirection = useCallback(() => {
    handleFilterChange(
      "sortDirection",
      filters.sortDirection === "asc" ? "desc" : "asc"
    );
  }, [filters.sortDirection, handleFilterChange]);

  const toggleView = useCallback(() => {
    handleFilterChange("view", filters.view === "grid" ? "list" : "grid");
  }, [filters.view, handleFilterChange]);

  const clearFilters = useCallback(() => {
    const defaultFilters: FilterState = {
      search: "",
      category: "all",
      sort: "name",
      sortDirection: "asc",
      view: "grid",
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  }, [onFiltersChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-800"
    >
      <div className="flex-1 relative">
        <Input
          placeholder="搜索目标..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-9 bg-gray-800/50 border-gray-700"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        {filters.search && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            onClick={() => handleFilterChange("search", "")}
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      <Select
        value={filters.category}
        onValueChange={(value) => handleFilterChange("category", value)}
      >
        <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700">
          <SelectValue>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {filters.category === "all" ? "所有分类" : filters.category}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有分类</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              <div className="flex items-center justify-between w-full">
                <span>{category}</span>
                <Badge variant="secondary" className="ml-2">
                  {targets.filter((t: Target) => t.category === category).length}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(value) => handleFilterChange("sort", value)}
      >
        <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-700">
          <SelectValue>
            <div className="flex items-center gap-2">
              {filters.sortDirection === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
              {filters.sort === "name"
                ? "按名称"
                : filters.sort === "category"
                ? "按分类"
                : "按任务数"}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">按名称</SelectItem>
          <SelectItem value="category">按分类</SelectItem>
          <SelectItem value="tasks">按任务数</SelectItem>
        </SelectContent>
      </Select>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSortDirection}
              className="h-9 w-9"
            >
              {filters.sortDirection === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>切换排序方向</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleView}
              className="h-9 w-9"
            >
              {filters.view === "grid" ? (
                <Grid2X2 className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>切换视图模式</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {(filters.search ||
        filters.category !== "all" ||
        filters.sort !== "name" ||
        filters.sortDirection !== "asc") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>清除筛选</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </motion.div>
  );
}
