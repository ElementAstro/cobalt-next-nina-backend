"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, AlertCircle, CheckCircle } from "lucide-react";

type SequenceState = "idle" | "running" | "paused" | "completed" | "failed";

interface SequenceStateBadgeProps {
  state: SequenceState;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

const stateConfig = {
  idle: {
    icon: <Play className="w-3 h-3" />,
    label: "就绪",
    class: "bg-gray-500/10 text-gray-400 border-gray-500/50",
    motion: {}
  },
  running: {
    icon: <Loader2 className="w-3 h-3" />,
    label: "运行中",
    class: "bg-teal-500/10 text-teal-400 border-teal-500/50",
    motion: { rotate: 360 }
  },
  paused: {
    icon: <Pause className="w-3 h-3" />,
    label: "已暂停",
    class: "bg-amber-500/10 text-amber-400 border-amber-500/50",
    motion: { scale: [1, 1.2, 1] }
  },
  completed: {
    icon: <CheckCircle className="w-3 h-3" />,
    label: "已完成",
    class: "bg-green-500/10 text-green-400 border-green-500/50",
    motion: {}
  },
  failed: {
    icon: <AlertCircle className="w-3 h-3" />,
    label: "已失败",
    class: "bg-red-500/10 text-red-400 border-red-500/50",
    motion: {}
  }
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm"
};

export const SequenceStateBadge = memo(({
  state,
  className = "",
  showIcon = true,
  showLabel = true,
  animate = true,
  size = "md"
}: SequenceStateBadgeProps) => {
  const config = stateConfig[state];
  const shouldAnimate = animate && Object.keys(config.motion).length > 0;
  const sizeClass = sizeClasses[size];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.class} ${className} ${sizeClass} flex items-center gap-1 font-medium`}
    >
      {showIcon && (
        <motion.div
          animate={shouldAnimate ? config.motion : undefined}
          transition={{ 
            duration: state === "running" ? 1.5 : 1, 
            repeat: Infinity, 
            ease: state === "running" ? "linear" : "easeInOut" 
          }}
        >
          {config.icon}
        </motion.div>
      )}
      {showLabel && config.label}
    </Badge>
  );
});

SequenceStateBadge.displayName = "SequenceStateBadge";
