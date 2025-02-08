"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva("relative inline-block rounded-full animate-spin", {
  variants: {
    size: {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-16 h-16",
      xl: "w-24 h-24",
    },
    variant: {
      default: "border-4 border-t-4 border-gray-200 border-t-gray-600",
      primary: "border-4 border-t-4 border-blue-200 border-t-blue-600",
      secondary: "border-4 border-t-4 border-purple-200 border-t-purple-600",
      gradient: [
        "border-4",
        "border-t-4",
        "border-transparent",
        "bg-gradient-to-r",
        "from-blue-500",
        "to-purple-500",
        "bg-clip-border",
      ],
    },
    speed: {
      slow: "animate-spin-slow",
      normal: "animate-spin",
      fast: "animate-spin-fast",
    },
  },
  defaultVariants: {
    size: "lg",
    variant: "default",
    speed: "normal",
  },
});

interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, speed, label, ...props }, ref) => {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <div
          ref={ref}
          className={cn(spinnerVariants({ size, variant, speed }), className)}
          {...props}
        />
        {label && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {label}
          </span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

export { LoadingSpinner };
