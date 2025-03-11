"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import useSystemStore from "@/stores/system/systemStore";

interface DataRefreshIndicatorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  isRefreshing?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  autoRefresh?: boolean;
}

export function DataRefreshIndicator({
  className,
  size = "sm",
  isRefreshing = false,
  lastUpdated = null,
  onRefresh,
  autoRefresh = true,
}: DataRefreshIndicatorProps) {
  const { settings } = useSystemStore();
  const [timeAgo, setTimeAgo] = useState<string>("刚刚");
  const [nextRefresh, setNextRefresh] = useState<number>(0);

  const sizeMap = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // 计算时间差
  useEffect(() => {
    if (!lastUpdated) return;

    const calculateTimeAgo = () => {
      const now = new Date();
      const diffSeconds = Math.floor(
        (now.getTime() - lastUpdated.getTime()) / 1000
      );

      if (diffSeconds < 30) {
        setTimeAgo("刚刚");
      } else if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}秒前`);
      } else if (diffSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffSeconds / 60)}分钟前`);
      } else {
        setTimeAgo(`${Math.floor(diffSeconds / 3600)}小时前`);
      }
    };

    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 10000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // 自动刷新倒计时
  useEffect(() => {
    if (!autoRefresh || !settings || !onRefresh) return;

    const refreshInterval = settings.refreshInterval;
    let countdown = refreshInterval / 1000;
    setNextRefresh(countdown);

    const timer = setInterval(() => {
      countdown -= 1;
      setNextRefresh(countdown);

      if (countdown <= 0) {
        onRefresh();
        countdown = refreshInterval / 1000;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, settings, onRefresh]);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-muted-foreground",
        className
      )}
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          repeat: isRefreshing ? Infinity : 0,
          duration: 1,
          ease: "linear",
        }}
        whileTap={{ rotate: 360, transition: { duration: 0.5 } }}
        className="cursor-pointer"
        onClick={onRefresh}
      >
        <RefreshCw className={sizeMap[size]} />
      </motion.div>

      <div
        className={cn(
          "text-xs flex gap-1",
          size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs"
        )}
      >
        {lastUpdated && <span>更新于 {timeAgo}</span>}

        {autoRefresh && !isRefreshing && nextRefresh > 0 && (
          <span className="opacity-75">• {nextRefresh}s</span>
        )}

        {isRefreshing && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-primary"
          >
            正在刷新...
          </motion.span>
        )}
      </div>
    </div>
  );
}
