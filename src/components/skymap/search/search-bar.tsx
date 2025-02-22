"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Settings,
  RefreshCw,
  Clock,
  History,
  X,
  ArrowRight,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import useSearchStore from "@/stores/skymap/searchStore";
import { CelestialObject } from "@/types/skymap/search";

interface SearchBarProps {
  onSearch: (term: string) => void;
  items: CelestialObject[];
}

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const overlayVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function SearchBar({ onSearch, items }: SearchBarProps) {
  const {
    searchTerm,
    setSearchTerm,
    showAdvanced,
    setShowAdvanced,
    searchHistory,
    addToHistory,
    clearHistory,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useSearchStore();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<CelestialObject[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        // 模拟搜索延迟
        await new Promise((resolve) => setTimeout(resolve, 300));
        const results = items
          .filter(
            (item) =>
              item.name.toLowerCase().includes(term.toLowerCase()) ||
              item.constellation.toLowerCase().includes(term.toLowerCase()) ||
              item.type.toLowerCase().includes(term.toLowerCase())
          )
          .slice(0, 5);
        setSuggestions(results);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setShowHistory(false);
  };

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return;
    addToHistory(term);
    onSearch(term);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setShowHistory(false);
    } else if (e.key === "Enter" && searchTerm) {
      handleSearchSubmit(searchTerm);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-2xl mx-auto"
    >
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <div className="p-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="搜索天体..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowHistory(true)}
                className="pl-8 pr-10 bg-background/50"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-2 hover:bg-transparent"
                  onClick={() => {
                    setSearchTerm("");
                    inputRef.current?.focus();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleSearchSubmit(searchTerm)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>搜索</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>高级选项</TooltipContent>
                </Tooltip>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="name">名称</SelectItem>
                    <SelectItem value="magnitude">星等</SelectItem>
                    <SelectItem value="distance">距离</SelectItem>
                  </SelectContent>
                </Select>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>排序方向</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {(showSuggestions || showHistory) && (searchTerm || showHistory) && (
          <motion.div
            ref={suggestionsRef}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute z-50 w-full mt-1"
          >
            <Card className="bg-background/95 backdrop-blur-md border-border/50">
              <Command>
                <CommandList>
                  {showHistory && searchHistory.length > 0 && (
                    <CommandGroup
                      heading={
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <span>搜索历史</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              clearHistory();
                              setShowHistory(false);
                            }}
                          >
                            清空
                          </Button>
                        </div>
                      }
                    >
                      {searchHistory.map((term, index) => (
                        <CommandItem
                          key={index}
                          onSelect={() => {
                            setSearchTerm(term);
                            handleSearchSubmit(term);
                          }}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>{term}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {showSuggestions && suggestions.length > 0 && (
                    <CommandGroup heading="搜索建议">
                      {suggestions.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => {
                            setSearchTerm(item.name);
                            handleSearchSubmit(item.name);
                          }}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.constellation}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {showSuggestions && !isSearching && suggestions.length === 0 && (
                    <CommandEmpty>未找到相关天体</CommandEmpty>
                  )}

                  {isSearching && (
                    <div className="p-4 text-center">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                    </div>
                  )}
                </CommandList>
              </Command>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
