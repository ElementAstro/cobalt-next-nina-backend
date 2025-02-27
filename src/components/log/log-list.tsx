"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useLogStore } from "@/stores/logStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownCircle,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import LogItem from "./log-item";
import LogPagination from "./log-filters";
import LogFilters from "./log-filters";
import LogActions from "./log-actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 64;
const LOADING_DELAY = 800;
const SCROLL_THRESHOLD = 100;

const LogList: React.FC = () => {
  const {
    filteredLogs,
    isPaginationEnabled,
    currentPage,
    isRealTimeEnabled,
    refreshLogs,
  } = useLogStore();

  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<List>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const paginatedLogs = isPaginationEnabled
    ? filteredLogs.slice((currentPage - 1) * 100, currentPage * 100)
    : filteredLogs;

  // 键盘导航支持
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Home") {
      listRef.current?.scrollTo(0);
    } else if (event.key === "End") {
      listRef.current?.scrollToItem(paginatedLogs.length - 1);
    }
  }, [paginatedLogs.length]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    setIsScrolling(true);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 300);

    // Show scroll to bottom button if not at bottom
    const listHeight = Number(listRef.current?.props.height || 0);
    const totalHeight = Number(paginatedLogs.length * ITEM_HEIGHT);
    setShowScrollButton(scrollOffset < totalHeight - listHeight - SCROLL_THRESHOLD);
  }, [paginatedLogs.length]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(paginatedLogs.length - 1, "end");
      // 添加视觉反馈
      toast.success("已滚动到底部");
    }
  }, [paginatedLogs.length]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await refreshLogs();
      toast.success("日志已刷新");
    } catch (err) {
      const message = err instanceof Error ? err.message : "刷新失败";
      setError(message);
      toast.error("刷新失败", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, [refreshLogs]);

  useEffect(() => {
    setIsLoading(true);
    const loadingTimeout = setTimeout(() => setIsLoading(false), LOADING_DELAY);

    if (isRealTimeEnabled && listRef.current) {
      listRef.current.scrollToItem(filteredLogs.length - 1);
    }

    return () => {
      clearTimeout(loadingTimeout);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [filteredLogs.length, isRealTimeEnabled]);

  const renderEmptyState = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center text-muted-foreground">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-4xl mb-4"
        >
          <FileText className="w-12 h-12 mx-auto opacity-20" />
        </motion.div>
        <p className="text-lg">暂无日志数据</p>
        <p className="text-sm mt-2">尝试调整过滤条件或刷新日志</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新日志
        </Button>
      </div>
    </motion.div>
  );

  const renderError = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center text-destructive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg font-medium">加载失败</p>
        <p className="text-sm mt-2 text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Card 
      className="flex flex-col h-full dark:bg-gray-900/80 backdrop-blur-sm"
      role="region"
      aria-label="日志列表"
    >
      <motion.div
        className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 dark:bg-gray-900/80 border-b"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col space-y-2 p-4">
          <LogFilters />
          <LogActions />
        </div>
      </motion.div>

      <ScrollArea 
        className="flex-1 relative"
        aria-busy={isLoading}
        aria-live="polite"
      >
        <div
          className={cn(
            "relative border-0 transition-shadow duration-300",
            isScrolling && "shadow-lg"
          )}
        >
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-background/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4 w-1/2">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="h-16 bg-muted/20 rounded-lg animate-pulse"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {error ? (
              renderError()
            ) : !isLoading && filteredLogs.length === 0 ? (
              renderEmptyState()
            ) : null}
          </AnimatePresence>

          {isRealTimeEnabled && showScrollButton && (
            <motion.div
              className="fixed bottom-8 right-8 z-30"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={scrollToBottom}
                variant="secondary"
                size="icon"
                className="w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                aria-label="滚动到底部"
              >
                <ArrowDownCircle className="w-6 h-6" />
              </Button>
            </motion.div>
          )}

          {!isLoading && !error && (
            <AutoSizer>
              {({ height, width }) => (
                <div aria-label="日志列表">
                  <List
                    ref={listRef}
                    height={height}
                    itemCount={paginatedLogs.length}
                    itemSize={ITEM_HEIGHT}
                    width={width}
                    className="scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30 scrollbar-track-transparent focus:outline-none"
                    overscanCount={5}
                    itemData={paginatedLogs}
                    onScroll={handleScroll}
                  >
                    {({ index, style }) => (
                      <motion.div
                        style={style}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.03,
                          ease: "easeOut",
                        }}
                      >
                        <LogItem index={index} style={style} />
                      </motion.div>
                    )}
                  </List>
                </div>
              )}
            </AutoSizer>
          )}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {isPaginationEnabled && (
          <motion.div
            className="sticky bottom-0 bg-background/80 dark:bg-gray-900/80 backdrop-blur-xl border-t p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LogPagination />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default LogList;
