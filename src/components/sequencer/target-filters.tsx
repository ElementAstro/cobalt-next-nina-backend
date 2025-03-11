"use client";

import { useCallback, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  <div className="flex-1 relative group">
    <Input
      placeholder="搜索目标..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-9 bg-gray-800/50 border-gray-700 focus:ring-2 focus:ring-teal-500/50 transition-all group-hover:border-gray-600"
      aria-label="搜索目标"
    />
    <motion.div
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-teal-400 transition-colors"
      animate={value ? { rotate: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <Search className="w-4 h-4" />
    </motion.div>
    <AnimatePresence>
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none focus:text-teal-500"
          onClick={() => onChange("")}
          aria-label="清除搜索"
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.8 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
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
    <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors group">
      <SelectValue>
        <div className="flex items-center gap-2">
          <motion.div
            animate={value !== "all" ? { rotate: [0, 360] } : {}}
            transition={{ duration: 0.5 }}
            className="text-gray-400 group-hover:text-teal-400 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </motion.div>
          {value === "all" ? "所有分类" : value}
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent className="border-gray-700 bg-gray-800">
      <SelectItem value="all">
        <div className="flex items-center justify-between w-full">
          <span>所有分类</span>
          <Badge variant="secondary" className="ml-2 text-xs">全部</Badge>
        </div>
      </SelectItem>
      {categories.map((category) => (
        <SelectItem key={category} value={category}>
          <div className="flex items-center justify-between w-full">
            <span>{category}</span>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="text-xs"
            >
              <Badge 
                variant="outline" 
                className="bg-gray-900/50 border-gray-700 text-xs ml-2"
              >
                分类
              </Badge>
            </motion.div>
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
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="h-9 w-9 hover:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/50 transition-colors"
            aria-label="切换排序方向"
          >
            <motion.div
              animate={direction === "desc" ? { rotate: 180 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {direction === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>切换排序方向</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

SortButton.displayName = "SortButton";

// 改进视图切换按钮，添加过渡动效
const ViewToggleButton = memo(({ view, onClick }: { view: string; onClick: () => void }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="h-9 w-9 hover:bg-gray-800/50 focus:ring-2 focus:ring-teal-500/50 transition-colors"
            aria-label="切换视图模式"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                {view === "grid" ? (
                  <Grid2X2 className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>切换到{view === "grid" ? "列表" : "网格"}视图</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
));

ViewToggleButton.displayName = "ViewToggleButton";

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
        <motion.div whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center h-10 hover:bg-gray-800/50 group"
          >
            <span className="text-sm font-medium group-hover:text-teal-400 transition-colors">
              {hasActiveFilters ? "过滤器（已激活）" : "过滤器"}
            </span>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-gray-400 group-hover:text-teal-400 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </motion.div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`
            flex ${isMobile ? 'flex-col' : 'items-center'} gap-4 
            bg-gradient-to-b from-gray-900/70 to-gray-900/40 backdrop-blur-sm p-4 rounded-lg border border-gray-800
            shadow-inner
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
            onValueChange={(value) => handleFilterChange("sort", value as any)}
          >
            <SelectTrigger className="w-[140px] bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: filters.sortDirection === "asc" ? 0 : 180 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <SortAsc className="w-4 h-4" />
                  </motion.div>
                  <span>{filters.sort === "name"
                    ? "按名称"
                    : filters.sort === "category"
                    ? "按分类"
                    : "按任务数"}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-800">
              <SelectItem value="name" className="focus:bg-teal-500/20">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4" />
                  按名称
                </div>
              </SelectItem>
              <SelectItem value="category">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4" />
                  按分类
                </div>
              </SelectItem>
              <SelectItem value="tasks">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4" />
                  按任务数
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <SortButton
              direction={filters.sortDirection}
              onClick={toggleSortDirection}
            />

            <ViewToggleButton 
              view={filters.view} 
              onClick={toggleView} 
            />

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
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
                          <motion.div
                            whileHover={{ rotate: 90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <X className="w-4 h-4" />
                          </motion.div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>清除所有筛选条件</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
