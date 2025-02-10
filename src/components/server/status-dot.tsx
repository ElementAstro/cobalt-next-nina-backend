"use client";

import { motion } from "framer-motion";
import type { StatusType } from "@/types/server/status";

interface StatusDotProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
  theme: {
    upColor: string;
    degradedColor: string;
    downColor: string;
  };
}

const sizes = {
  sm: "w-1.5 h-3",
  md: "w-2 h-4",
  lg: "w-2.5 h-5",
};

export function StatusDot({
  status,
  size = "md",
  theme,
  className = "",
}: StatusDotProps) {
  const getStatusColor = () => {
    switch (status) {
      case "up":
        return theme.upColor;
      case "degraded":
        return theme.degradedColor;
      case "down":
        return theme.downColor;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`${sizes[size]} rounded-sm ${className}`}
      style={{ backgroundColor: getStatusColor() }}
      whileHover={{ scale: 1.2 }}
    />
  );
}
