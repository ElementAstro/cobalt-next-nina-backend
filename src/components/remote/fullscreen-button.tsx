"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  className?: string;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  isFullscreen,
  toggleFullscreen,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <Button
        onClick={toggleFullscreen}
        variant="outline"
        size="lg"
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "border border-gray-700/50 dark:border-gray-600/50",
          "bg-background/95 backdrop-blur-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "active:scale-95",
          "dark:text-gray-200",
          "group",
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isFullscreen ? "minimize" : "maximize"}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 transition-transform group-hover:scale-110" />
            ) : (
              <Maximize2 className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            <span className="font-medium">{isFullscreen ? "退出全屏" : "全屏"}</span>
          </motion.div>
        </AnimatePresence>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          style={{ opacity: 0.1 }}
        />
      </Button>
    </motion.div>
  );
};

export default FullscreenButton;
