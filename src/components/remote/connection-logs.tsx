"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Copy,
  Search,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "react-responsive";
import { Skeleton } from "@/components/ui/skeleton";

interface Log {
  timestamp: Date;
  message: string;
  type?: "info" | "warning" | "error";
  source?: string;
  level?: number;
}

interface ConnectionLogsProps {
  logs: Log[];
  defaultHeight?: string;
}

const LogIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case "error":
      return (
        <motion.div
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9, rotate: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AlertCircle className="h-4 w-4 text-red-500 animate-pulse hover:animate-none" />
        </motion.div>
      );
    case "warning":
      return (
        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
          <AlertTriangle className="h-4 w-4 text-yellow-500 animate-bounce" />
        </motion.div>
      );
    default:
      return (
        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
          <Info className="h-4 w-4 text-blue-500 animate-spin-slow" />
        </motion.div>
      );
  }
};

const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  logs,
  defaultHeight = "h-48",
}) => {
  const [logLevel, setLogLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logType, setLogType] = useState<"all" | "info" | "warning" | "error">(
    "all"
  );

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(search.toLowerCase()) &&
      (logType === "all" || log.type === logType) &&
      (logLevel === null || (log.level && log.level >= logLevel))
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, page]);

  const exportLogs = async () => {
    setIsLoading(true);
    try {
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs_${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && autoScroll) {
      setIsScrolling(true);
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      const timeout = setTimeout(() => setIsScrolling(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setAutoScroll(scrollHeight - scrollTop === clientHeight);
    }
  };

  const copyLogs = () => {
    const text = logs
      .map(
        (log) =>
          `[${log.timestamp.toLocaleTimeString()}] ${log.message}${
            log.source ? ` (${log.source})` : ""
          }`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const clearLogs = () => {
    // Notify parent or handle log clearance
  };

  return (
    <Card className="mt-2 shadow-md border border-gray-700 bg-background">
      <CardHeader
        className={cn(
          "py-2 px-3 border-b border-gray-700",
          isMobile && "sticky top-0 bg-background/95 backdrop-blur z-10"
        )}
      >
        <CardTitle className="text-lg font-medium">连接日志</CardTitle>
        <div
          className={cn(
            "mt-2 grid gap-2",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1">
              <span className="text-sm">自动滚动</span>
              <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
            </div>
            <Button variant="ghost" size="icon" onClick={copyLogs}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Select
              value={logType}
              onValueChange={(value: "all" | "info" | "warning" | "error") =>
                setLogType(value)
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="日志类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="info">信息</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="error">错误</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={logLevel?.toString() || "all"}
              onValueChange={(value) =>
                setLogLevel(value === "all" ? null : Number(value))
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="日志级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">1 - 调试</SelectItem>
                <SelectItem value="2">2 - 信息</SelectItem>
                <SelectItem value="3">3 - 警告</SelectItem>
                <SelectItem value="4">4 - 错误</SelectItem>
                <SelectItem value="5">5 - 严重</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn("p-2", isMobile && "pb-safe-area-inset-bottom")}
      >
        <div className="flex flex-col md:flex-row items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索日志..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsSearching(e.target.value.length > 0);
            }}
            className="h-9 flex-1"
          />
          {isSearching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setIsSearching(false);
              }}
            >
              清除
            </Button>
          )}
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "overflow-y-auto p-2 rounded text-sm bg-secondary/10 text-secondary-foreground",
            defaultHeight,
            "border border-gray-700 shadow-inner",
            isScrolling && "scrolling-active"
          )}
        >
          {autoScroll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 right-2 bg-background rounded-full p-2 shadow-lg"
            >
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </motion.div>
          )}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Skeleton className="h-12 w-full rounded" />
                </motion.div>
              ))}
            </motion.div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              暂无日志
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {paginatedLogs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    duration: 0.3,
                  }}
                  layout
                  className={cn(
                    "mb-1 p-2 rounded flex items-start gap-2 transition-all duration-300 relative overflow-hidden",
                    "hover:shadow-md hover:scale-[1.005] transform-gpu active:scale-95",
                    "hover:before:absolute hover:before:inset-0 hover:before:bg-gradient-to-r hover:before:from-transparent hover:before:via-white/10 hover:before:to-transparent hover:before:animate-[shine_1.5s_ease-in-out_infinite]",
                    log.type === "error" && "bg-red-500/10 hover:bg-red-500/20",
                    log.type === "warning" &&
                      "bg-yellow-500/10 hover:bg-yellow-500/20",
                    log.type === "info" && "bg-blue-500/10 hover:bg-blue-500/20"
                  )}
                >
                  <LogIcon type={log.type} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        {log.level && (
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              log.level >= 4 && "bg-red-500/10 text-red-500",
                              log.level === 3 &&
                                "bg-yellow-500/10 text-yellow-500",
                              log.level === 2 && "bg-blue-500/10 text-blue-500",
                              log.level <= 1 && "bg-gray-500/10 text-gray-500"
                            )}
                          >
                            L{log.level}
                          </span>
                        )}
                      </div>
                      {log.source && (
                        <span className="text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded-full">
                          {log.source}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">{log.message}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <div
          className={cn(
            "mt-3 flex flex-wrap items-center justify-between gap-2",
            isMobile ? "text-center" : ""
          )}
        >
          <div className="text-sm text-muted-foreground">
            共 {filteredLogs.length} 条日志
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              下一页
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportLogs}
            disabled={isLoading}
          >
            {isLoading ? "导出中..." : "导出日志"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionLogs;
