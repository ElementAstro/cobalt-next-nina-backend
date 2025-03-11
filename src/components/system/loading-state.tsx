import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import useSystemStore from "@/stores/system/systemStore";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  center?: boolean;
  progress?: number; // 可选的进度值（0-100）
  type?: "spinner" | "dots" | "progress"; // 加载类型
}

export function LoadingState({
  message = "加载中...",
  className,
  size = "md",
  center = true,
  progress,
  type = "spinner",
}: LoadingStateProps) {
  const { settings } = useSystemStore();

  // 根据动画速度设置动画时长
  const animationSpeed = {
    slow: 1.5,
    normal: 1,
    fast: 0.6,
  }[settings?.animationSpeed || "normal"];

  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "text-muted-foreground",
        center && "flex flex-col items-center justify-center",
        className
      )}
    >
      {type === "spinner" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: animationSpeed,
            repeat: Infinity,
            ease: "linear",
          }}
          className="mb-2"
        >
          <Loader2 className={cn(sizeMap[size], "text-primary")} />
        </motion.div>
      )}

      {type === "dots" && (
        <div className="flex gap-1 mb-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-full bg-primary",
                size === "sm"
                  ? "h-1.5 w-1.5"
                  : size === "md"
                  ? "h-2 w-2"
                  : "h-2.5 w-2.5"
              )}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: animationSpeed * 1.2,
                repeat: Infinity,
                delay: i * animationSpeed * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {type === "progress" && typeof progress === "number" && (
        <div className="w-full mb-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-1.5 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          {size !== "sm" && (
            <div className="text-xs text-center mt-1">{progress}%</div>
          )}
        </div>
      )}

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={cn("text-center", textSizeMap[size])}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
