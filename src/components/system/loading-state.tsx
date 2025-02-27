import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  center?: boolean;
}

export function LoadingState({
  message = "加载中...",
  className,
  size = "md",
  center = true,
}: LoadingStateProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "text-muted-foreground",
        center && "flex flex-col items-center justify-center",
        className
      )}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-2"
      >
        <Loader2 className={cn(sizeMap[size], "text-primary")} />
      </motion.div>
      {message && (
        <p className={cn("text-center", size === "sm" ? "text-xs" : "text-sm")}>
          {message}
        </p>
      )}
    </div>
  );
}
