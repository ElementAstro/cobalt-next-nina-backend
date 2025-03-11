"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100/10 text-gray-100 border-gray-200/20",
        primary: "bg-primary/10 text-primary border-primary/20",
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface StatusPillProps extends VariantProps<typeof statusPillVariants> {
  label: string;
  icon?: LucideIcon;
  animate?: boolean;
  className?: string;
  pulseIcon?: boolean;
  rotateIcon?: boolean;
  bounceIcon?: boolean;
}

export const StatusPill = memo(({
  label,
  icon: Icon,
  variant = "default",
  size = "md",
  animate = false,
  className = "",
  pulseIcon = false,
  rotateIcon = false,
  bounceIcon = false,
}: StatusPillProps) => {
  return (
    <motion.span
      className={`${statusPillVariants({ variant, size })} ${className}`}
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      exit={animate ? { opacity: 0, y: -10 } : undefined}
    >
      {Icon && (
        <motion.div
          animate={rotateIcon ? { rotate: 360 } : 
                  bounceIcon ? { y: [0, -2, 0] } : 
                  pulseIcon ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : undefined}
          transition={{
            duration: rotateIcon ? 2 : 1,
            repeat: Infinity,
            ease: rotateIcon ? "linear" : "easeInOut",
          }}
        >
          <Icon className="h-3 w-3" />
        </motion.div>
      )}
      <span>{label}</span>
    </motion.span>
  );
});

StatusPill.displayName = "StatusPill";
