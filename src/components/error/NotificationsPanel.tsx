"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BellIcon, ChevronDownIcon, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { containerVariants, itemVariants } from "./lock-screen-animations";
import { Button } from "@/components/ui/button";
import { LogEntry } from "@/types/log";

interface NotificationsPanelProps {
  logs: LogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function NotificationsPanel({ logs, isExpanded, onToggle }: NotificationsPanelProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="z-10 w-full md:w-1/3 p-4 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white text-sm flex items-center">
          <BellIcon className="w-4 h-4 mr-1" /> 通知
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggle}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ChevronDownIcon className="w-5 h-5 text-white/80" />
          </motion.div>
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-1 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
          >
            {logs.map((notification: LogEntry) => (
              <motion.div
                key={notification.id}
                variants={itemVariants}
                className={`
                  backdrop-blur-sm rounded-xl p-4 border
                  transition-all duration-200
                  hover:bg-white/5
                  ${
                    notification.level === "error"
                      ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                      : notification.level === "warn"
                      ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50"
                      : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex-shrink-0
                      flex items-center justify-center
                      ${
                        notification.level === "error"
                          ? "bg-red-500/20"
                          : notification.level === "warn"
                          ? "bg-yellow-500/20"
                          : "bg-emerald-500/20"
                      }
                    `}
                  >
                    {notification.level === "error" ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : notification.level === "warn" ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Info className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white">
                        {notification.id || "通知"}
                      </h4>
                      <time className="text-xs text-white/50">
                        {Math.floor(
                          (Date.now() - (notification.timestamp as unknown as number)) /
                            60000
                        )}
                        分钟前
                      </time>
                    </div>
                    <p className="text-sm text-white/80 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}