"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowUp, ArrowDown, History, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import debounce from "lodash/debounce";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface SearchHistoryItem {
  term: string;
  timestamp: number;
  count: number;
}

interface SearchBarProps {
  initialSuggestions: string[];
  placeholder?: string;
  onSearch?: (term: string) => void;
  className?: string;
  variant?: "default" | "minimal" | "compact";
  animationDuration?: number;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  iconVariant?: "default" | "modern" | "minimal";
  primaryColor?: string;
  secondaryColor?: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  showClearButton?: boolean;
  suggestionLimit?: number;
  showHistory?: boolean;
  maxHistoryItems?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialSuggestions,
  placeholder = "搜索...",
  onSearch,
  className,
  variant = "default",
  animationDuration = 0.3,
  disabled = false,
  value,
  onChange,
  iconVariant = "default",
  primaryColor,
  secondaryColor,
  size = "md",
  loading = false,
  showClearButton = true,
  suggestionLimit = 10,
  showHistory = true,
  maxHistoryItems = 5,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const searchTerm = value !== undefined ? value : internalSearchTerm;
  const setSearchTerm = onChange
    ? onChange
    : (term: string) => setInternalSearchTerm(term);

  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [searchHistory, setSearchHistory, removeSearchHistory] = useLocalStorage<SearchHistoryItem[]>("search-history", []);

  // 使用 useMemo 缓存过滤后的建议列表
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return initialSuggestions.slice(0, suggestionLimit);
    
    return initialSuggestions
      .filter((suggestion) =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, suggestionLimit);
  }, [searchTerm, initialSuggestions, suggestionLimit]);

  // 使用 useMemo 缓存已排序的搜索历史
  const sortedHistory = useMemo(() => {
    return [...searchHistory]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxHistoryItems);
  }, [searchHistory, maxHistoryItems]);

  // 防抖处理搜索建议更新
  const debouncedUpdateSuggestions = useCallback(
    debounce((term: string) => {
      setSuggestions(
        term
          ? filteredSuggestions
          : initialSuggestions.slice(0, suggestionLimit)
      );
    }, 150),
    [filteredSuggestions, initialSuggestions, suggestionLimit]
  );

  useEffect(() => {
    debouncedUpdateSuggestions(searchTerm);
  }, [searchTerm, debouncedUpdateSuggestions]);

  const updateSearchHistory = useCallback(
    (term: string) => {
      if (!showHistory || !term.trim()) return;

      const now = Date.now();
      const existingIndex = searchHistory.findIndex((item: SearchHistoryItem) => item.term === term);

      if (existingIndex > -1) {
        const updatedHistory = [...searchHistory];
        updatedHistory[existingIndex] = {
          ...updatedHistory[existingIndex],
          timestamp: now,
          count: updatedHistory[existingIndex].count + 1,
        };
        setSearchHistory(updatedHistory);
      } else {
        setSearchHistory([
          { term, timestamp: now, count: 1 },
          ...searchHistory.slice(0, maxHistoryItems - 1),
        ]);
      }
    },
    [searchHistory, setSearchHistory, showHistory, maxHistoryItems]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      updateSearchHistory(searchTerm);
      onSearch?.(searchTerm);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const suggestionsLength = suggestions.length;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestionsLength - 1 ? prev + 1 : -1
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > -1 ? prev - 1 : suggestionsLength - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex > -1) {
          const selected = suggestions[selectedIndex];
          handleSuggestionClick(selected);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    updateSearchHistory(suggestion);
    onSearch?.(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const clearHistory = useCallback(() => {
    removeSearchHistory();
  }, [removeSearchHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const iconSize =
    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const inputPadding =
    size === "sm" ? "pl-8 pr-8" : size === "lg" ? "pl-12 pr-12" : "pl-10 pr-10";
  const iconPosition =
    size === "sm" ? "left-1.5" : size === "lg" ? "left-3" : "left-2";

  const renderSearchIcon = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Search className={iconSize} />
        </motion.div>
      );
    }

    switch (iconVariant) {
      case "modern":
        return (
          <motion.div whileHover={{ scale: 1.1 }}>
            <Search className={iconSize} />
          </motion.div>
        );
      case "minimal":
        return <Search className={cn(iconSize, "opacity-50")} />;
      default:
        return <Search className={iconSize} />;
    }
  };

  const renderHighlightedText = (text: string) => {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => (
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark>
      ) : part
    ));
  };

  return (
    <motion.form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "relative w-full mx-auto p-1",
        variant === "minimal" && "max-w-[300px]",
        variant === "compact" && "max-w-[200px]",
        className,
        "rounded-lg shadow-lg hover:shadow-md transition-shadow"
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationDuration }}
    >
      <div className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className={cn(
            "w-full py-2 rounded-full border-2 focus:ring transition-all duration-300",
            inputPadding,
            primaryColor
              ? `focus:border-[${primaryColor}] focus:ring-[${primaryColor}]/20`
              : "focus:border-primary focus:ring-primary/20",
            secondaryColor
              ? `bg-[${secondaryColor}] text-[${secondaryColor}]/90 placeholder-[${secondaryColor}]/70`
              : "bg-background text-foreground placeholder:text-muted-foreground",
            variant === "minimal" && "border-none shadow-none",
            size === "sm" && "text-sm",
            size === "lg" && "text-lg"
          )}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          aria-label="搜索"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 transition-colors",
            iconPosition,
            primaryColor
              ? `text-[${primaryColor}] hover:text-[${primaryColor}]/80`
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {renderSearchIcon()}
          <span className="sr-only">聚焦搜索</span>
        </Button>
        {searchTerm && showClearButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors",
              primaryColor
                ? `text-[${primaryColor}] hover:text-[${primaryColor}]/80`
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleClear}
          >
            <X className={iconSize} />
            <span className="sr-only">清除搜索</span>
          </Button>
        )}
      </div>
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || sortedHistory.length > 0) && (
          <motion.div
            className="absolute z-10 w-full mt-2 bg-background border rounded-md shadow-lg max-h-[300px] overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {showHistory && sortedHistory.length > 0 && (
              <div className="p-2 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <History className="h-4 w-4" />
                    <span>搜索历史</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={clearHistory}
                  >
                    清除历史
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedHistory.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSuggestionClick(item.term)}
                    >
                      <Clock className="h-3 w-3 mr-1 opacity-50" />
                      {item.term}
                      <span className="ml-1 text-xs opacity-50">({item.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <ul className="py-2 max-h-[200px] overflow-auto scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  className={cn(
                    "px-4 py-2 cursor-pointer transition-colors",
                    index === selectedIndex && "bg-accent",
                    "hover:bg-accent",
                    primaryColor ? `hover:bg-[${primaryColor}]/10` : ""
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.03 }}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 opacity-50" />
                    <span>{renderHighlightedText(suggestion)}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
            {selectedIndex > -1 && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    <ArrowDown className="h-3 w-3" />
                    <span>选择</span>
                  </div>
                  <span>Enter 确认</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};

export default SearchBar;
