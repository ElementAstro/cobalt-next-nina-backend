"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, X, Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "success" | "warning" | "error" | "info" | "loading";

interface StatusOverlayProps {
  type: StatusType;
  message: string;
  description?: string;
  visible: boolean;
  onClose?: () => void;
  duration?: number;
  position?: "center" | "top" | "bottom";
  icon?: LucideIcon | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getStatusConfig = (type: StatusType) => {
  switch (type) {
    case "success":
      return {
        icon: Check,
        bgColor: "bg-green-500",
        textColor: "text-white",
        ringColor: "ring-green-500/20",
        title: "成功",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        bgColor: "bg-yellow-500",
        textColor: "text-white",
        ringColor: "ring-yellow-500/20",
        title: "警告",
      };
    case "error":
      return {
        icon: X,
        bgColor: "bg-red-500",
        textColor: "text-white",
        ringColor: "ring-red-500/20",
        title: "错误",
      };
    case "info":
      return {
        icon: Info,
        bgColor: "bg-blue-500",
        textColor: "text-white",
        ringColor: "ring-blue-500/20",
        title: "提示",
      };
    case "loading":
      return {
        icon: LoadingIcon,
        bgColor: "bg-indigo-500",
        textColor: "text-white",
        ringColor: "ring-indigo-500/20",
        title: "加载中",
      };
    default:
      return {
        icon: Info,
        bgColor: "bg-gray-500",
        textColor: "text-white",
        ringColor: "ring-gray-500/20",
        title: "提示",
      };
  }
};

const LoadingIcon = () => (
  <svg
    className="animate-spin h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const StatusOverlay: React.FC<StatusOverlayProps> = ({
  type,
  message,
  description,
  visible,
  onClose,
  duration = 3000,
  position = "center",
  icon: CustomIcon,
  action,
}) => {
  const {
    icon: DefaultIcon,
    bgColor,
    textColor,
    ringColor,
  } = getStatusConfig(type);
  const Icon = CustomIcon || DefaultIcon;

  React.useEffect(() => {
    if (visible && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.85,
      y: position === "top" ? -50 : position === "bottom" ? 50 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  const getPositionClass = () => {
    switch (position) {
      case "top":
        return "items-start pt-16";
      case "bottom":
        return "items-end pb-16";
      default:
        return "items-center";
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          className={cn(
            "fixed inset-0 z-50 flex justify-center",
            getPositionClass(),
            "pointer-events-none"
          )}
        >
          <div className="max-w-md w-full mx-4 pointer-events-auto">
            <motion.div
              className={cn(
                "rounded-lg shadow-lg",
                "bg-gray-900/95 backdrop-blur-md",
                "border border-gray-800",
                "p-6 ring-1",
                ringColor
              )}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start">
                <div
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center",
                    "w-10 h-10 rounded-full",
                    bgColor
                  )}
                >
                  {typeof Icon === "function" ? (
                    <Icon
                      className={cn("h-6 w-6", textColor)}
                      aria-hidden="true"
                    />
                  ) : (
                    Icon
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-200">
                    {message}
                  </h3>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-1 text-sm text-gray-400"
                    >
                      {description}
                    </motion.p>
                  )}
                  {action && (
                    <div className="mt-4">
                      <button
                        onClick={action.onClick}
                        className={cn(
                          "inline-flex items-center px-3 py-2 border border-transparent",
                          "text-sm leading-4 font-medium rounded-md",
                          "focus:outline-none focus:ring-2 focus:ring-offset-2",
                          bgColor,
                          textColor
                        )}
                      >
                        {action.label}
                      </button>
                    </div>
                  )}
                </div>
                {onClose && (
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className="rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">关闭</span>
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
              {duration > 0 && (
                <motion.div
                  className={cn("h-1 mt-4 rounded-full", bgColor)}
                  initial={{ width: "100%" }}
                  animate={{ width: 0 }}
                  transition={{ duration: duration / 1000, ease: "linear" }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusOverlay;
