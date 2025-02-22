"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Copy,
  Search,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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
  onClear?: () => void;
}

const LogIcon = ({ type }: { type?: string }) => {
  const iconVariants = {
    initial: { scale: 0.8, rotate: 0 },
    animate: { scale: 1, rotate: 360 },
    hover: { scale: 1.2, rotate: 0 },
    tap: { scale: 0.9, rotate: -10 },
  };

  switch (type) {
    case "error":
      return (
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AlertCircle className="h-4 w-4 text-red-500" />
        </motion.div>
      );
    case "warning":
      return (
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </motion.div>
      );
    default:
      return (
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <Info className="h-4 w-4 text-blue-500" />
        </motion.div>
      );
  }
};

const LogItem = React.memo(({ log }: { log: Log }) => {
  const itemVariants = {
    initial: { opacity: 0, x: -20, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 20, scale: 0.95 },
    hover: { scale: 1.01, x: 4 },
  };

  return (
    <motion.div
      layout
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.3,
      }}
      className={cn(
        "mb-1 p-3 rounded-lg flex items-start gap-3 transition-all duration-300",
        "hover:shadow-lg dark:shadow-none",
        "border border-transparent hover:border-gray-700/50",
        "bg-card/30 hover:bg-card/50 backdrop-blur-sm",
        log.type === "error" && "bg-red-500/10 hover:bg-red-500/20",
        log.type === "warning" && "bg-yellow-500/10 hover:bg-yellow-500/20",
        log.type === "info" && "bg-blue-500/10 hover:bg-blue-500/20"
      )}
    >
      <LogIcon type={log.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">
              {log.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
            {log.level && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5",
                  log.level >= 4 && "bg-red-500/10 text-red-500 border-red-500/50",
                  log.level === 3 &&
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/50",
                  log.level === 2 &&
                    "bg-blue-500/10 text-blue-500 border-blue-500/50",
                  log.level <= 1 && "bg-gray-500/10 text-gray-500 border-gray-500/50"
                )}
              >
                L{log.level}
              </Badge>
            )}
          </div>
          {log.source && (
            <Badge
              variant="secondary"
              className="text-xs font-mono bg-secondary/20"
            >
              {log.source}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm break-words">{log.message}</p>
      </div>
    </motion.div>
  );
});

LogItem.displayName = "LogItem";

const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  logs,
  defaultHeight = "h-[600px]",
  onClear,
}) => {
  const { toast } = useToast();
  const [logLevel, setLogLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logType, setLogType] = useState<"all" | "info" | "warning" | "error">(
    "all"
  );
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(search.toLowerCase()) &&
        (logType === "all" || log.type === logType) &&
        (logLevel === null || (log.level && log.level >= logLevel))
    );
  }, [logs, search, logType, logLevel]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, page]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && autoScroll && !search) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [paginatedLogs, autoScroll, search]);

  const handleCopyLogs = async () => {
    try {
      const text = logs
        .map(
          (log) =>
            `[${log.timestamp.toLocaleTimeString()}] ${log.message}${
              log.source ? ` (${log.source})` : ""
            }`
        )
        .join("\n");
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: "日志内容已复制到剪贴板",
      });
    } catch {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板",
        variant: "destructive",
      });
    }
  };

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
      toast({
        title: "导出成功",
        description: "日志已成功导出",
      });
    } catch {
      toast({
        title: "导出失败",
        description: "无法导出日志文件",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-2 border-gray-700/50 bg-background/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-gray-700/50">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
          >
            <RefreshCw className="h-4 w-4" />
          </motion.div>
          连接日志
        </CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Select
                value={logType}
                onValueChange={(value: "all" | "info" | "warning" | "error") =>
                  setLogType(value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="日志类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="info">信息</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenuSeparator />
              <Select
                value={logLevel?.toString() || "all"}
                onValueChange={(value) =>
                  setLogLevel(value === "all" ? null : Number(value))
                }
              >
                <SelectTrigger className="w-full">
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
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopyLogs}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="搜索日志..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea
          ref={scrollRef}
          className={cn(
            "relative",
            defaultHeight,
            "rounded-lg border border-gray-700/50"
          )}
        >
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">暂无日志</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {paginatedLogs.map((log, index) => (
                  <LogItem key={index} log={log} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {autoScroll && filteredLogs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 right-4"
            >
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
              >
                <ArrowDown className="h-3 w-3 mr-1 animate-bounce" />
                自动滚动
              </Badge>
            </motion.div>
          )}
        </ScrollArea>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              共 {filteredLogs.length} 条日志
            </p>
            <div className="flex items-center gap-1">
              <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
              <span className="text-sm">自动滚动</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={exportLogs}
              disabled={isLoading || filteredLogs.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionLogs;
