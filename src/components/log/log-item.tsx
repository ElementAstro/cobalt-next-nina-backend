"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Tag,
  AlertCircle,
  AlertTriangle,
  Info,
  MoreVertical,
  Check,
  MessageSquare,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLogStore } from "@/stores/logStore";
import { LogEntry } from "@/types/log";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RowProps {
  index: number;
  style: React.CSSProperties;
}

const LogItem = ({ index, style }: RowProps) => {
  const { filteredLogs, selectedLogs, setSelectedLogs, setSelectedLogForNote } =
    useLogStore();
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("复制失败");
    }
  };

  const log = filteredLogs[index] as LogEntry;

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "bg-red-500/10 text-red-500 dark:text-red-400 dark:bg-red-500/20";
      case "warn":
        return "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 dark:bg-yellow-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-500 dark:text-blue-400 dark:bg-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 dark:text-gray-400 dark:bg-gray-500/20";
    }
  };

  return (
    <motion.div
      style={style}
      className={cn(
        "group px-4 py-2 border-b dark:border-gray-800 transition-all duration-200 relative",
        selectedLogs.includes(log.id)
          ? "bg-primary/5 dark:bg-primary/10"
          : "hover:bg-muted/50 dark:hover:bg-muted/10"
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={false}
      animate={{
        backgroundColor: selectedLogs.includes(log.id)
          ? "var(--primary-5)"
          : isHovered
          ? "var(--muted-50)"
          : "transparent",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <Checkbox
            checked={selectedLogs.includes(log.id)}
            onCheckedChange={(checked) => {
              setSelectedLogs(
                checked
                  ? [...selectedLogs, log.id]
                  : selectedLogs.filter((id) => id !== log.id)
              );
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center text-xs mb-2">
            <motion.span
              className="font-mono text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {new Date(log.timestamp).toLocaleString()}
            </motion.span>

            <Badge
              variant="outline"
              className={cn("h-5 flex items-center gap-1", getLevelClass(log.level))}
            >
              {getLevelIcon(log.level)}
              {log.level}
            </Badge>

            {log.tags?.map((tag, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Badge
                  variant="secondary"
                  className="h-5 flex items-center gap-1 bg-primary/5 dark:bg-primary/10"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              </motion.div>
            ))}
          </div>

          <motion.pre
            className="text-sm font-mono whitespace-pre-wrap break-all text-foreground/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {log.message}
          </motion.pre>

          {log.note && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <div className="flex items-start gap-2 text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                <MessageSquare className="h-3 w-3 mt-0.5" />
                <p>{log.note}</p>
              </div>
            </motion.div>
          )}
        </div>

        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>更多操作</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setSelectedLogForNote(log)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                添加备注
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCopy(log.message)}
                className="relative"
              >
                <AnimatePresence>
                  {isCopied ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      className="text-green-500 flex items-center"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      已复制!
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.8 }}
                      className="flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制内容
                    </motion.div>
                  )}
                </AnimatePresence>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </motion.div>
  );
};

export { LogItem };
export default LogItem;
