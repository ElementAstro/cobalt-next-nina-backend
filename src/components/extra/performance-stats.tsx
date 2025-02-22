"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Activity,
  BarChart2,
  Zap,
  Signal,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PerformanceMetrics } from "@/hooks/use-performance-monitor";

interface PerformanceStatsProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export const PerformanceStats = memo(({ metrics, className }: PerformanceStatsProps) => {
  const getStatusColor = (value: number, thresholds: [number, number]) => {
    const [warning, danger] = thresholds;
    if (value >= danger) return "text-red-500";
    if (value >= warning) return "text-yellow-500";
    return "text-green-500";
  };

  const formatMetric = (value: number, unit: string, decimals = 1) => {
    return `${value.toFixed(decimals)}${unit}`;
  };

  const stats = [
    {
      icon: Clock,
      label: "加载时间",
      value: formatMetric(metrics.loadTime, "ms"),
      thresholds: [500, 1000],
      color: getStatusColor(metrics.loadTime, [500, 1000]),
    },
    {
      icon: Activity,
      label: "内存占用",
      value: formatMetric(metrics.memoryUsage, "%"),
      thresholds: [70, 90],
      color: getStatusColor(metrics.memoryUsage, [70, 90]),
    },
    {
      icon: BarChart2,
      label: "CPU占用",
      value: formatMetric(metrics.cpuUsage, "%"),
      thresholds: [60, 80],
      color: getStatusColor(metrics.cpuUsage, [60, 80]),
    },
    {
      icon: Zap,
      label: "FPS",
      value: formatMetric(metrics.fps, ""),
      thresholds: [30, 15],
      color: getStatusColor(60 - metrics.fps, [30, 45]),
    },
    {
      icon: Signal,
      label: "网络延迟",
      value: formatMetric(metrics.networkLatency, "ms"),
      thresholds: [100, 200],
      color: getStatusColor(metrics.networkLatency, [100, 200]),
    },
    {
      icon: Database,
      label: "资源数量",
      value: metrics.resourceCount.toString(),
      thresholds: [30, 50],
      color: getStatusColor(metrics.resourceCount, [30, 50]),
    },
  ];

  const totalScore = Math.round(
    (100 -
      (metrics.loadTime / 1000 +
        metrics.memoryUsage / 100 +
        metrics.cpuUsage / 100 +
        (60 - metrics.fps) / 60 +
        metrics.networkLatency / 200 +
        metrics.resourceCount / 50) *
        16.67) *
      100
  ) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "backdrop-blur-md bg-background/60 p-4 rounded-lg border shadow-lg",
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">性能监控</h3>
          <Badge
            variant={totalScore >= 80 ? "default" : totalScore >= 60 ? "secondary" : "destructive"}
            className="text-xs"
          >
            得分: {totalScore}
          </Badge>
        </div>

        <Progress
          value={totalScore}
          className={cn(
            "h-1.5 transition-all duration-300",
            totalScore >= 80 ? "bg-green-500" :
            totalScore >= 60 ? "bg-yellow-500" : "bg-red-500"
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-center justify-between p-2 rounded-lg bg-background/40"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}:</span>
              </div>
              <Badge
                variant="secondary"
                className={cn("ml-auto text-xs font-mono", color)}
              >
                {value}
              </Badge>
            </div>
          ))}
        </div>

        {(metrics.cpuUsage > 80 || metrics.memoryUsage > 90) && (
          <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span>系统资源使用率较高</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

PerformanceStats.displayName = "PerformanceStats";