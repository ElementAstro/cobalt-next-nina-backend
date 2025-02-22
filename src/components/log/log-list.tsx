"use client";

import React, { useRef, useEffect, useState } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useLogStore } from "@/stores/logStore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownCircle } from "lucide-react";
import LogItem from "./log-item";
import LogPagination from "./log-filters";
import LogFilters from "./log-filters";
import LogActions from "./log-actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const LogList: React.FC = () => {
  const { filteredLogs, isPaginationEnabled, currentPage, isRealTimeEnabled } =
    useLogStore();
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const listRef = useRef<List>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    setIsScrolling(true);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => setIsScrolling(false), 300);

    // Show scroll to bottom button if not at bottom
    const listHeight = Number(listRef.current?.props.height || 0);
    const totalHeight = Number(paginatedLogs.length * 64);
    setShowScrollButton(scrollOffset < totalHeight - listHeight - 100);
  };

  const scrollToBottom = () => {  
    if (listRef.current) {
      listRef.current.scrollToItem(paginatedLogs.length - 1, "end");
    }
  };

  useEffect(() => {
    // Add initial loading state
    setIsLoading(true);
    const loadingTimeout = setTimeout(() => setIsLoading(false), 800);

    if (isRealTimeEnabled && listRef.current) {
      listRef.current.scrollToItem(filteredLogs.length - 1);
    }

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [filteredLogs.length, isRealTimeEnabled]);

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const paginatedLogs = isPaginationEnabled
    ? filteredLogs.slice((currentPage - 1) * 100, currentPage * 100)
    : filteredLogs;

  return (
    <Card className="flex flex-col h-full dark:bg-gray-900/80 backdrop-blur-sm">
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

      <ScrollArea className="flex-1 relative">
        <div
          className={`relative border-0 transition-shadow duration-300 ${
            isScrolling ? "shadow-lg" : ""
          }`}
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

          <AnimatePresence>
            {!isLoading && filteredLogs.length === 0 && (
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
                    📄
                  </motion.div>
                  <p className="text-lg">暂无日志数据</p>
                  <p className="text-sm mt-2">尝试调整过滤条件或刷新日志</p>
                </div>
              </motion.div>
            )}
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
              >
                <ArrowDownCircle className="w-6 h-6" />
              </Button>
            </motion.div>
          )}

          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                itemCount={paginatedLogs.length}
                itemSize={64}
                width={width}
                className="scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30 scrollbar-track-transparent"
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
            )}
          </AutoSizer>
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
