"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { LucideIcon, AlertTriangle, Info } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  type?: "danger" | "info" | "warning";
  icon?: LucideIcon | React.ReactNode;
  loading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "取消",
  type = "danger",
  icon,
  loading = false,
  onConfirm,
}) => {
  // 根据类型获取相关配置
  const getConfigByType = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertTriangle,
          confirmButtonClass: "bg-red-600 hover:bg-red-500",
          ringColor: "ring-red-500/10",
          iconBgColor: "bg-red-100 dark:bg-red-900/20",
          iconColor: "text-red-600 dark:text-red-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          confirmButtonClass: "bg-yellow-600 hover:bg-yellow-500",
          ringColor: "ring-yellow-500/10",
          iconBgColor: "bg-yellow-100 dark:bg-yellow-900/20",
          iconColor: "text-yellow-600 dark:text-yellow-500",
        };
      case "info":
      default:
        return {
          icon: Info,
          confirmButtonClass: "bg-blue-600 hover:bg-blue-500",
          ringColor: "ring-blue-500/10",
          iconBgColor: "bg-blue-100 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-500",
        };
    }
  };

  const config = getConfigByType();
  const IconComponent = icon || config.icon;

  // 动画变体
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent asChild>
        <motion.div
          className={cn(
            "bg-gray-900/95 backdrop-blur-md border-gray-800 p-6 shadow-xl",
            "rounded-lg overflow-hidden",
            "ring-1",
            config.ringColor
          )}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <AlertDialogHeader className="flex flex-row items-start gap-4">
            <div
              className={cn(
                "rounded-full p-2 flex items-center justify-center",
                config.iconBgColor
              )}
            >
              {typeof IconComponent === "function" ? (
                <IconComponent className={cn("w-6 h-6", config.iconColor)} />
              ) : (
                IconComponent
              )}
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-semibold text-white">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-gray-300">
                {description}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel
              className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-white"
              disabled={loading}
            >
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                config.confirmButtonClass,
                "text-white transition-all duration-200",
                loading ? "opacity-70 cursor-not-allowed" : ""
              )}
              onClick={(e) => {
                if (loading) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                onConfirm();
              }}
            >
              {loading ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  处理中...
                </motion.div>
              ) : (
                "确认"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
