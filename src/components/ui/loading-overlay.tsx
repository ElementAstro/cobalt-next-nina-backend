"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  fullScreen?: boolean;
  variant?: "default" | "light" | "blur" | "minimal";
  className?: string;
  showAfterDelay?: number;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  text,
  fullScreen = false,
  variant = "default",
  className,
  showAfterDelay = 300,
  children,
}: LoadingOverlayProps) {
  const [shouldRender, setShouldRender] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => {
        setShouldRender(true);
      }, showAfterDelay);
    } else {
      setShouldRender(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isLoading, showAfterDelay]);

  const getVariantStyles = () => {
    switch (variant) {
      case "light":
        return "bg-white/80 dark:bg-gray-900/80";
      case "blur":
        return "bg-white/40 dark:bg-gray-900/40 backdrop-blur-md";
      case "minimal":
        return "bg-transparent";
      default:
        return "bg-white/95 dark:bg-gray-900/95";
    }
  };

  return (
    <div
      className={cn(
        "relative",
        fullScreen ? "h-screen w-screen" : "h-full w-full",
        className
      )}
    >
      {children}

      <AnimatePresence>
        {isLoading && shouldRender && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-0 z-50",
              "flex flex-col items-center justify-center",
              getVariantStyles()
            )}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center"
            >
              <LoadingSpinner
                className={cn(
                  "h-12 w-12",
                  variant === "minimal" ? "text-indigo-600" : "text-indigo-500"
                )}
              />

              {text && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "mt-4 text-sm font-medium",
                    variant === "minimal"
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {text}
                </motion.p>
              )}

              <motion.div
                className="mt-6 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  transition: {
                    repeat: Infinity,
                    duration: 2,
                  },
                }}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1"></div>
                <div
                  className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="h-1.5 w-1.5 rounded-full bg-indigo-500"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
