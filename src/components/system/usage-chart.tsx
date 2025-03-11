"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Label,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import useSystemStore from "@/stores/system/systemStore";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageChartProps {
  data: number[];
  color: string;
  title: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  thresholdValue?: number;
}

interface ChartDataPoint {
  name: number;
  value: number;
}

export default function UsageChart({
  data,
  color,
  title,
  height = 200,
  loading = false,
  error = false,
  onRetry,
  thresholdValue,
}: UsageChartProps) {
  const { settings } = useSystemStore();
  const [isHovered, setIsHovered] = useState(false);
  const [showThresholdWarning, setShowThresholdWarning] = useState(false);

  // 应用速度设置到动画
  const animationDuration = {
    slow: 1500,
    normal: 1000,
    fast: 600,
  }[settings.animationSpeed];

  // 格式化数据以适应图表
  const chartData = useMemo(() => {
    return data.map(
      (value: number, index: number): ChartDataPoint => ({
        name: index,
        value,
      })
    );
  }, [data]);

  // 检查是否超过阈值
  const currentValue = data.length > 0 ? data[data.length - 1] : 0;
  const isOverThreshold =
    thresholdValue !== undefined && currentValue > thresholdValue;

  // 当超过阈值时显示警告
  useEffect(() => {
    if (isOverThreshold && !showThresholdWarning) {
      toast.warning(`${title}使用率过高`);
      setShowThresholdWarning(true);
    } else if (!isOverThreshold) {
      setShowThresholdWarning(false);
    }
  }, [
    isOverThreshold,
    title,
    currentValue,
    thresholdValue,
    showThresholdWarning,
  ]);

  // 颜色透明度控制
  const colorBase = color.replace("#", "");
  const hoverOpacity = isHovered ? 0.9 : 0.8;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="text-sm font-medium mb-2 flex justify-between items-center">
        <span>{title}</span>
        {data.length > 0 && !loading && !error && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "text-xs font-mono px-1.5 py-0.5 rounded",
              isOverThreshold
                ? "bg-destructive/20 text-destructive"
                : "bg-muted/50"
            )}
          >
            {isOverThreshold && (
              <AlertTriangle className="h-3 w-3 inline-block mr-1" />
            )}
            {currentValue}%
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height }}
          >
            <Skeleton className="h-full w-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingState size="sm" message="加载中" />
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height }}
            className="flex items-center justify-center bg-muted/20 rounded-md"
          >
            <ErrorState
              size="sm"
              message="数据加载失败"
              retryAction={onRetry}
            />
          </motion.div>
        ) : data.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height }}
            className="flex items-center justify-center"
          >
            <EmptyState
              title="无数据"
              message="暂无使用率数据"
              actionLabel={onRetry ? "刷新" : undefined}
              onAction={onRetry}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ height }}
            className="relative overflow-hidden group"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id={`gradient-${colorBase}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={color}
                      stopOpacity={hoverOpacity}
                    />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "使用率"]}
                  labelFormatter={() => ""}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "0.375rem",
                    boxShadow: "var(--shadow)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  fillOpacity={1}
                  fill={`url(#gradient-${colorBase})`}
                  isAnimationActive={true}
                  animationDuration={animationDuration}
                />

                {/* 添加阈值线 */}
                {thresholdValue !== undefined && (
                  <ReferenceLine
                    y={thresholdValue}
                    stroke={
                      isOverThreshold
                        ? "var(--destructive)"
                        : "var(--muted-foreground)"
                    }
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  >
                    <Label
                      value={`阈值: ${thresholdValue}%`}
                      position="insideTopRight"
                      fontSize={10}
                      fill="var(--muted-foreground)"
                    />
                  </ReferenceLine>
                )}
              </AreaChart>
            </ResponsiveContainer>

            {/* 闪光效果 - 鼠标悬停时出现 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
              initial={{ x: "-100%" }}
              animate={isHovered ? { x: "100%" } : { x: "-100%" }}
              transition={{ duration: 1, ease: "easeInOut", repeat: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
