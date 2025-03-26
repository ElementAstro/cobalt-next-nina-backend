"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ErrorHeaderProps {
  title: string;
  errorMessage?: string;
  errorCode?: string;
  theme?: "light" | "dark";
  icon?: ReactNode;
}

export const ErrorHeader = ({
  title,
  errorMessage,
  errorCode,
  theme = "dark",
  icon = <AlertTriangle className="w-6 h-6 text-red-500" />,
}: ErrorHeaderProps) => {
  const bgColor = theme === "light" ? "bg-white" : "bg-gray-800";
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200";

  return (
    <div className={`space-y-4 ${bgColor} ${textColor} p-6 rounded-lg`}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          {icon}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      
      {errorMessage && (
        <div className="space-y-2">
          <p className="text-base/relaxed font-medium text-red-500/90">
            {errorMessage}
          </p>
          {errorCode && (
            <p className="text-sm/relaxed text-white/60">
              错误代码: <Label className="font-mono">{errorCode}</Label>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface ErrorDetailsProps {
  errorInfo?: string;
  theme?: "light" | "dark";
  onCopy?: () => void;
}

const ErrorDetailsComponent = ({
  errorInfo,
  theme = "dark",
  onCopy,
}: ErrorDetailsProps) => {
  const bgColor = theme === "light" ? "bg-gray-100" : "bg-gray-800";
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200";

  return (
    <div className="mt-6 space-y-3">
      <AnimatePresence>
        {errorInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="relative">
              <ScrollArea className={`h-64 w-full rounded-md border ${bgColor} ${textColor}`}>
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                  {errorInfo}
                </pre>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              
              {onCopy && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={onCopy}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>复制错误信息</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ErrorDetailsComponent.displayName = "ErrorDetails";
export const ErrorDetails = React.memo(ErrorDetailsComponent);

interface ErrorActionsProps {
  onRetry?: () => void;
  onReport?: () => void;
  onClose?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isReporting?: boolean;
  theme?: "light" | "dark";
}

const ErrorActionsComponent = ({
  onRetry,
  onReport,
  onClose,
  retryCount = 0,
  maxRetries = 3,
  isReporting = false,
}: ErrorActionsProps) => {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {onRetry && (
        <motion.button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-blue-500/90 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重试 ({retryCount}/{maxRetries})
        </motion.button>
      )}
      
      {onReport && (
        <motion.button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReport}
          disabled={isReporting}
        >
          {isReporting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          ) : (
            "报告错误"
          )}
        </motion.button>
      )}
      
      {onClose && (
        <motion.button
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-gray-500/90 hover:bg-gray-500 text-white font-medium shadow-lg shadow-gray-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
        >
          <X className="w-4 h-4 mr-2" />
          关闭
        </motion.button>
      )}
    </div>
  );
};

ErrorActionsComponent.displayName = "ErrorActions";
export const ErrorActions = React.memo(ErrorActionsComponent);

interface ErrorProgressProps {
  progress: number;
  label?: string;
}

export const ErrorProgress = ({ progress, label }: ErrorProgressProps) => {
  return (
    <div className="space-y-1">
      <Progress value={progress} className="h-2 bg-gray-800" />
      {label && (
        <p className="text-xs text-gray-400">
          {label} {progress}% 完成
        </p>
      )}
    </div>
  );
};