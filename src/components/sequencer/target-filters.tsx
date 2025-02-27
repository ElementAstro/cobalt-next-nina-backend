"use client";

import { useCallback, useState, memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSequencerStore } from "@/stores/sequencer";
import type { Target } from "@/stores/sequencer";
import { useMediaQuery } from "react-responsive";
import { useDebouncedCallback } from "use-debounce";

export interface FilterState {
  search: string;
  category: string;
  sort: "name" | "category" | "tasks";
  sortDirection: "asc" | "desc";
  view: "grid" | "list";
}

interface FilterProps {
  onFiltersChange: (filters: FilterState) => void;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchInput = memo(({ value, onChange }: SearchInputProps) => (
  <div className="flex-1 relative">
    <Input
      placeholder="搜索目标..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-9 bg-gray-800/50 border-gray-700 focus:ring-2 focus:ring-teal-500/50"
      aria-label="搜索目标"
    />
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    {value && (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:text-teal-500"
        onClick={() => onChange("")}
        aria-label="清除搜索"
      >
        <X className="w-4 h-4" />
      </motion.button>
    )}
  </div>
));

SearchInput.displayName = "SearchInput";

interface CategorySelectProps {
  value: string;
  categories: string[];
  onChange: (value: string) => void;
}

const CategorySelect = memo(({ value, categories, onChange }: CategorySelectProps) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700">
      <SelectValue>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {value === "all" ? "所有分类" : value}
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">所有分类</SelectItem>
      {categories.map((category) => (
        <SelectItem key={category} value={category}>
          <div className="flex items-center justify-between w-full">
            <span>{category}</span>
            <span className="text-xs text-gray-400">
              ({category === "all" ? "全部" : "已选择"})
            </span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
));

CategorySelect.displayName = "CategorySelect";

interface SortButtonProps {
  direction: "asc" | "desc";
  onClick: () => void;
}

const SortButton = memo(({ direction, onClick }: SortButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="h-9 w-9 hover:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/50"
          aria-label="切换排序方向"
        >
          {direction === "asc" ? (
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
));

SortButton.displayName = "SortButton";

export function TargetFilters({ onFiltersChange }: FilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    sort: "name",
    sortDirection: "asc",
    view: "grid",
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { targets } = useSequencerStore();

  // 获取所有唯一的目标分类
  const categories = Array.from(new Set(targets.map((t: Target) => t.category)));

  // 使用防抖处理过滤器变化
  const debouncedOnFiltersChange = useDebouncedCallback(
    (newFilters: FilterState) => {
      onFiltersChange(newFilters);
    },
    300
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      debouncedOnFiltersChange(newFilters);
    },
    [filters, debouncedOnFiltersChange]
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

  const hasActiveFilters = filters.search || 
    filters.category !== "all" || 
    filters.sort !== "name" || 
    filters.sortDirection !== "asc";

  return (
    <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center h-10 hover:bg-gray-800/50"
        >
          <span className="text-sm font-medium">过滤器</span>
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            flex ${isMobile ? 'flex-col' : 'items-center'} gap-4 
            bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg border border-gray-800
          `}
          role="search"
          aria-label="目标过滤器"
        >
          <SearchInput
            value={filters.search}
            onChange={(value) => handleFilterChange("search", value)}
          />

          <CategorySelect
            value={filters.category}
            categories={categories}
            onChange={(value) => handleFilterChange("category", value)}
          />

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

          <div className="flex items-center gap-2">
            <SortButton
              direction={filters.sortDirection}
              onClick={toggleSortDirection}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleView}
                    className="h-9 w-9 hover:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/50"
                    aria-label="切换视图模式"
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

            {hasActiveFilters && (
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
                        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-400/10 focus:ring-2 focus:ring-red-500/50"
                        aria-label="清除筛选"
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
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
