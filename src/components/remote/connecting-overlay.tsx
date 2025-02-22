"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Monitor, Wifi, Shield, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectingOverlayProps {
  isConnecting: boolean;
  connectionStage: "initializing" | "authenticating" | "establishing" | "connected" | "error";
  progress: number;
  error?: string;
  onRetry?: () => void;
}

const stages = {
  initializing: {
    icon: Monitor,
    text: "初始化连接...",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  authenticating: {
    icon: Shield,
    text: "验证身份...",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
  establishing: {
    icon: Wifi,
    text: "建立通信...",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
  },
  connected: {
    icon: CheckCircle,
    text: "连接成功！",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  error: {
    icon: AlertCircle,
    text: "连接失败",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
  },
};

const ConnectingOverlay: React.FC<ConnectingOverlayProps> = ({
  isConnecting,
  connectionStage,
  progress,
  error,
  onRetry,
}) => {
  const CurrentIcon = stages[connectionStage].icon;
  const stageStyle = stages[connectionStage];

  return (
    <AnimatePresence>
      {isConnecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={cn(
              "max-w-md w-full mx-auto rounded-2xl shadow-2xl",
              "bg-card/95 border",
              stageStyle.borderColor
            )}
          >
            <div
              className={cn(
                "p-8 rounded-t-2xl",
                stageStyle.bgColor,
                "transition-colors duration-500"
              )}
            >
              <div className="relative w-24 h-24 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0"
                >
                  <Loader2
                    className={cn(
                      "h-full w-full opacity-20",
                      stageStyle.color
                    )}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: [0.8, 1.1, 1],
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <CurrentIcon
                    className={cn(
                      "h-12 w-12 relative z-10 transition-transform",
                      stageStyle.color,
                      connectionStage === "error" && "animate-shake"
                    )}
                  />
                </motion.div>
              </div>

              <motion.div
                className="text-center mt-6 space-y-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className={cn("text-2xl font-semibold", stageStyle.color)}>
                  {stages[connectionStage].text}
                </h3>
                {connectionStage !== "error" && (
                  <p className="text-sm text-muted-foreground">
                    请保持网络连接稳定...
                  </p>
                )}
              </motion.div>
            </div>

            <div className="p-6 space-y-4">
              <motion.div
                className="space-y-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Progress
                  value={progress}
                  className={cn(
                    "h-2",
                    "bg-background/50",
                    "[&>div]:transition-all [&>div]:duration-500",
                    `[&>div]:${stageStyle.bgColor}`
                  )}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round(progress)}%</span>
                  {connectionStage === "error" && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRetry}
                      className={cn(
                        "gap-2 transition-colors hover:text-white",
                        stageStyle.color
                      )}
                    >
                      <RefreshCw className="h-4 w-4" />
                      重试
                    </Button>
                  )}
                </div>
              </motion.div>

              {error && connectionStage === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectingOverlay;
