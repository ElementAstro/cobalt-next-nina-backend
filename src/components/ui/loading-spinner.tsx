"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

const spinnerVariants = cva(
  "relative inline-block rounded-full", 
  {
    variants: {
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
      },
      variant: {
        default: [
          "border-4",
          "border-gray-200",
          "border-t-gray-600",
          "dark:border-gray-700",
          "dark:border-t-gray-300",
        ],
        primary: [
          "border-4",
          "border-primary/20",
          "border-t-primary",
        ],
        secondary: [
          "border-4",
          "border-purple-200",
          "border-t-purple-600",
          "dark:border-purple-900",
          "dark:border-t-purple-400",
        ],
        gradient: [
          "border-4",
          "border-transparent",
          "bg-gradient-to-r",
          "from-primary",
          "to-purple-500",
          "bg-clip-border",
        ],
        duo: [
          "border-8",
          "border-primary/20",
          "border-t-primary",
          "border-r-primary",
          "shadow-[0_0_15px_rgba(var(--primary),0.2)]",
        ],
      },
      speed: {
        slow: "[animation:spin_2s_linear_infinite]",
        normal: "[animation:spin_1s_linear_infinite]",
        fast: "[animation:spin_0.5s_linear_infinite]",
      },
      progress: {
        true: "after:content-[attr(data-progress)] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-xs after:font-medium",
        false: "",
      },
    },
    defaultVariants: {
      size: "lg",
      variant: "primary",
      speed: "normal",
      progress: false,
    },
  }
);

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
  progressValue?: number;
  showProgress?: boolean;
  reverseAnimation?: boolean;
  customColor?: string;
}

const LoadingSpinner = React.memo(
  React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
    ({ 
      className, 
      size, 
      variant, 
      speed, 
      label, 
      progressValue,
      showProgress = false,
      reverseAnimation = false,
      customColor,
      style,
      ...props 
    }, ref) => {
      const containerVariants = {
        initial: { opacity: 0, scale: 0.9 },
        animate: { 
          opacity: 1, 
          scale: 1,
          transition: {
            duration: 0.3,
            ease: "easeOut",
          }
        },
        exit: { 
          opacity: 0, 
          scale: 0.9,
          transition: {
            duration: 0.2,
            ease: "easeIn",
          }
        },
      };

      const labelVariants = {
        initial: { opacity: 0, y: 5 },
        animate: { 
          opacity: 1, 
          y: 0,
          transition: {
            delay: 0.2,
            duration: 0.3,
          }
        },
      };

      const customStyle = {
        ...style,
        ...(customColor && {
          borderTopColor: customColor,
          borderColor: `${customColor}33`,
        }),
        animationDirection: reverseAnimation ? "reverse" : "normal",
      };

      return (
        <motion.div 
          className="flex flex-col items-center justify-center gap-3"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div
            ref={ref}
            className={cn(
              spinnerVariants({ 
                size, 
                variant, 
                speed,
                progress: showProgress 
              }), 
              className
            )}
            {...props}
            style={customStyle}
            data-progress={progressValue ? `${Math.round(progressValue)}%` : undefined}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressValue}
            aria-label={label || "加载中..."}
          />
          {label && (
            <motion.span 
              variants={labelVariants}
              className={cn(
                "text-sm text-muted-foreground",
                "animate-pulse select-none",
                "transition-colors duration-200"
              )}
            >
              {label}
            </motion.span>
          )}
        </motion.div>
      );
    }
  )
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };

// Add custom keyframes to tailwind.config.js
/**
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
*/
