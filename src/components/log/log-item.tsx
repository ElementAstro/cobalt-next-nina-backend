"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

Prism.manual = true;

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

const LogItem: React.FC<RowProps> = ({ index, style }) => {
  const { filteredLogs, selectedLogs, setSelectedLogs, setSelectedLogForNote } =
    useLogStore();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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
        return "bg-red-100/10 text-red-500 dark:text-red-400";
      case "warn":
        return "bg-yellow-100/10 text-yellow-500 dark:text-yellow-400";
      case "info":
        return "bg-blue-100/10 text-blue-500 dark:text-blue-400";
      default:
        return "bg-gray-100/10 text-gray-500 dark:text-gray-400";
    }
  };

  return (
    <motion.div
      style={style}
      className={cn(
        "group px-2 py-1.5 border-b dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-200 relative",
        selectedLogs.includes(log.id) && "bg-blue-50/50 dark:bg-blue-900/10"
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={selectedLogs.includes(log.id)}
          onCheckedChange={(checked) => {
            setSelectedLogs(
              checked
                ? [...selectedLogs, log.id]
                : selectedLogs.filter((id) => id !== log.id)
            );
          }}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 items-center text-xs mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {new Date(log.timestamp).toLocaleString()}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-5 flex items-center gap-1",
                getLevelClass(log.level)
              )}
            >
              {getLevelIcon(log.level)}
              {log.level}
            </Badge>
            {log.tags?.map((tag, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="h-5 flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
          <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">
            {log.message}
          </pre>
          {log.note && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">
              {log.note}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedLogForNote(log)}>
              <Tag className="h-4 w-4 mr-2" />
              添加备注
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCopy(log.message)}
              className="focus:bg-green-50 dark:focus:bg-green-900/20 flex items-center"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  已复制!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  复制内容
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default LogItem;
