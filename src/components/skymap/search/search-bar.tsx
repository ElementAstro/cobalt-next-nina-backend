"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Clock,
  Settings,
  RefreshCw,
  Filter,
  Sliders,
  Plus,
} from "lucide-react";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useSearchStore from "@/stores/skymap/searchStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CelestialObject, SearchFilters } from "@/types/skymap/search";

interface SearchBarProps {
  onSearch: (term: string, filters?: SearchFilters) => void;
  items: CelestialObject[];
}

export function SearchBar({ onSearch, items }: SearchBarProps) {
  const {
    setObjects,
    filters,
    searchTerm,
    showAdvanced,
    showSuggestions,
    suggestions,
    searchHistory,
    isLoading,
    setSearchTerm,
    setShowAdvanced,
    setShowSuggestions,
    setSuggestions,
    setFilters,
    addToHistory,
    clearHistory,
  } = useSearchStore();

  const fuseRef = useRef<Fuse<CelestialObject> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useRef(
    debounce((value: string, currentFilters: SearchFilters) => {
      if (value && fuseRef.current) {
        let results = fuseRef.current
          .search(value)
          .map((result) => result.item);

        if (currentFilters.constellations.length > 0) {
          results = results.filter((item) =>
            currentFilters.constellations.includes(item.constellation)
          );
        }

        if (currentFilters.types.length > 0) {
          results = results.filter((item) =>
            currentFilters.types.includes(item.type)
          );
        }

        if (currentFilters.minMagnitude !== undefined) {
          results = results.filter(
            (item) => item.magnitude >= currentFilters.minMagnitude
          );
        }

        if (currentFilters.maxMagnitude !== undefined) {
          results = results.filter(
            (item) => item.magnitude <= currentFilters.maxMagnitude
          );
        }

        setSuggestions(results.slice(0, 5));
      } else {
        setSuggestions([]);
      }
      onSearch(value, filters);
    }, 300)
  ).current;

  useEffect(() => {
    fuseRef.current = new Fuse(items, {
      keys: ["name", "constellation", "type", "magnitude"],
      threshold: 0.3,
    });
    setObjects(items);
  }, [items, setObjects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value, filters);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (value: string) => {
    if (!value.trim()) return;
    addToHistory(value);
    onSearch(value, filters);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100);
  };

  const handleAdvancedFilterChange = (
    filterName: keyof SearchFilters,
    value: string
  ) => {
    const newFilters: SearchFilters = { ...filters };

    switch (filterName) {
      case "constellations":
        newFilters.constellations = [value];
        break;
      case "types":
        newFilters.types = [value];
        break;
      case "minMagnitude":
        newFilters.minMagnitude = Number(value);
        break;
      case "maxMagnitude":
        newFilters.maxMagnitude = Number(value);
        break;
      default:
        break;
    }

    setFilters(newFilters);
    debouncedSearch(searchTerm, newFilters);
  };

  const handleAddFilter = () => {
    // 示例功能：添加更多自定义过滤器
    console.log("Add filter clicked");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-full mx-auto"
    >
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Clock className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜索天体..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            className="w-full pl-8 h-9 bg-background/50 backdrop-blur-sm border-muted"
          />
          {isLoading && (
            <RefreshCw className="absolute right-3 top-2.5 h-4 w-4 animate-spin opacity-70" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleSearchSubmit(searchTerm)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 overflow-hidden rounded-md border bg-background/95 backdrop-blur-sm shadow-lg"
          >
            {/* 显示建议内容 */}
            {suggestions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSearchSubmit(item.name)}
                className="p-1 hover:bg-muted cursor-pointer"
              >
                {item.name} - {item.constellation} - {item.type}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {searchHistory.length > 0 && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden rounded-md border bg-background/95 backdrop-blur-sm shadow-lg">
          <div className="p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">搜索历史</span>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                清空
              </Button>
            </div>
            {searchHistory.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSearchSubmit(item)}
                className="p-1 hover:bg-muted cursor-pointer"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 p-2 border rounded bg-background/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">高级筛选</span>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <span className="text-xs">星座:</span>
                    <Select
                      value={
                        filters.constellations.length > 0
                          ? filters.constellations[0]
                          : ""
                      }
                      onValueChange={(val) =>
                        handleAdvancedFilterChange("constellations", val)
                      }
                    >
                      <SelectTrigger className="w-32 text-xs">
                        <SelectValue placeholder="选择星座" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UMA">UMA</SelectItem>
                        <SelectItem value="CYG">CYG</SelectItem>
                        <SelectItem value="PYX">PYX</SelectItem>
                        <SelectItem value="ORI">ORI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>选择特定星座</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <span className="text-xs">对象类型:</span>
                    <Select
                      value={filters.types.length > 0 ? filters.types[0] : ""}
                      onValueChange={(val) =>
                        handleAdvancedFilterChange("types", val)
                      }
                    >
                      <SelectTrigger className="w-32 text-xs">
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAR">STAR</SelectItem>
                        <SelectItem value="GALXY">GALXY</SelectItem>
                        <SelectItem value="COMET">COMET</SelectItem>
                        <SelectItem value="NOVA">NOVA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>选择天体类型</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs">星等:</span>
            <Input
              type="number"
              placeholder="最小"
              value={filters.minMagnitude?.toString() || ""}
              onChange={(e) =>
                handleAdvancedFilterChange("minMagnitude", e.target.value)
              }
              className="w-16 text-xs"
            />
            <Input
              type="number"
              placeholder="最大"
              value={filters.maxMagnitude?.toString() || ""}
              onChange={(e) =>
                handleAdvancedFilterChange("maxMagnitude", e.target.value)
              }
              className="w-16 text-xs"
            />
            <Sliders className="h-5 w-5 text-gray-500" />
          </div>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFilter}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              添加过滤器
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
