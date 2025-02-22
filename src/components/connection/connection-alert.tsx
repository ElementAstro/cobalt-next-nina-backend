"use client";

import React, { useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Loader2,
  WifiOff,
  Satellite,
  Telescope,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const AlertType = z.enum([
  "success",
  "error",
  "info",
  "warning",
  "loading",
  "offline",
  "connecting",
  "weak-signal",
]);
type AlertType = z.infer<typeof AlertType>;

const alertSchema = z.object({
  showAlert: z.boolean(),
  alertType: AlertType,
  message: z.string().optional(),
  autoHideDuration: z.number().min(0).max(60000).optional(),
});

interface ConnectionAlertProps {
  showAlert: boolean;
  alertType: AlertType;
  message?: string;
  autoHideDuration?: number;
  onClose?: () => void;
}

export function ConnectionAlert({
  showAlert,
  alertType,
  message,
  autoHideDuration = 5000,
  onClose,
}: ConnectionAlertProps) {
  const { connectionStrength } = useConnectionStatusStore();

  useEffect(() => {
    try {
      alertSchema.parse({
        showAlert,
        alertType,
        message,
        autoHideDuration,
      });
    } catch (error) {
      console.error("Invalid alert props:", error);
      return;
    }
  }, [showAlert, alertType, message, autoHideDuration]);

  const clearAlert = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (showAlert && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        clearAlert();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [showAlert, autoHideDuration, clearAlert]);

  const getSignalIcon = () => {
    if (connectionStrength > 75) {
      return <SignalHigh className="h-4 w-4 text-green-500" />;
    } else if (connectionStrength > 50) {
      return <SignalMedium className="h-4 w-4 text-yellow-500" />;
    } else if (connectionStrength > 25) {
      return <SignalLow className="h-4 w-4 text-orange-500" />;
    } else {
      return <SignalZero className="h-4 w-4 text-red-500" />;
    }
  };

  const alertConfig = {
    success: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      title: "连接成功",
      description: message || "已成功建立连接",
      variant: "default" as const,
      iconBg: "bg-green-500/10",
    },
    error: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: "连接错误",
      description: message || "连接过程中发生错误",
      variant: "destructive" as const,
      iconBg: "bg-red-500/10",
    },
    info: {
      icon: <Info className="h-4 w-4 text-blue-500" />,
      title: "连接信息",
      description: message || "连接状态更新",
      variant: "default" as const,
      iconBg: "bg-blue-500/10",
    },
    warning: {
      icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      title: "连接警告",
      description: message || "连接可能出现问题",
      variant: "default" as const,
      iconBg: "bg-yellow-500/10",
    },
    loading: {
      icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
      title: "连接中...",
      description: message || "正在建立连接，请稍候",
      variant: "default" as const,
      iconBg: "bg-blue-500/10",
    },
    offline: {
      icon: <WifiOff className="h-4 w-4 text-gray-500" />,
      title: "离线状态",
      description: message || "网络连接已断开",
      variant: "default" as const,
      iconBg: "bg-gray-500/10",
    },
    connecting: {
      icon: <Satellite className="h-4 w-4 text-purple-500 animate-pulse" />,
      title: "正在连接",
      description: message || "正在与天文设备建立连接",
      variant: "default" as const,
      iconBg: "bg-purple-500/10",
    },
    "weak-signal": {
      icon: getSignalIcon(),
      title: "信号较弱",
      description: message || `当前信号强度：${connectionStrength}%`,
      variant: "default" as const,
      iconBg: "bg-orange-500/10",
    },
  };

  const currentAlert = alertConfig[alertType] || alertConfig.info;

  // 动画变体
  const alertVariants = {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
  };

  const progressVariants = {
    initial: { width: "100%" },
    animate: { width: "0%" },
  };

  return (
    <AnimatePresence mode="wait">
      {showAlert && (
        <motion.div
          variants={alertVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className="mb-4 relative"
        >
          <Alert variant={currentAlert.variant} className="pr-12">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${currentAlert.iconBg} flex-shrink-0`}
              >
                {currentAlert.icon}
              </div>
              <div className="flex-1 pt-1">
                <AlertTitle className="text-sm font-semibold mb-1">
                  {currentAlert.title}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {currentAlert.description}
                </AlertDescription>
                {alertType === "connecting" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground"
                  >
                    <Telescope className="h-4 w-4" />
                    <span>正在同步天文设备...</span>
                  </motion.div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition-opacity"
                onClick={clearAlert}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
          {autoHideDuration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-primary/20"
              variants={progressVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: autoHideDuration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
