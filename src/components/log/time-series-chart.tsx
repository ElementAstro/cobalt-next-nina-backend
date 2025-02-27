"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  TooltipProps,
  Legend,
  Brush,
  Label,
} from "recharts";
import { Tooltip as RechartsTooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label as UILabel } from "@/components/ui/label";
import {
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Calendar,
  Eye,
  Grid,
  Clock,
  TrendingUp,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogEntry } from "@/types/log";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface TimeSeriesChartProps {
  logs: LogEntry[];
  onTimeRangeChange?: (range: TimeRange) => void;
}

type TimeRange = "1h" | "24h" | "7d" | "30d";

interface TimeSeriesData {
  timestamp: string;
  error: number;
  warn: number;
  info: number;
  total: number;
}

interface TooltipContent {
  name: string;
  value: number;
  color: string;
  dataKey: keyof TimeSeriesData;
}

const TIME_RANGES: Record<TimeRange, { label: string; ms: number }> = {
  "1h": { label: "最近1小时", ms: 60 * 60 * 1000 },
  "24h": { label: "最近24小时", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "最近7天", ms: 7 * 24 * 60 * 60 * 1000 },
  "30d": { label: "最近30天", ms: 30 * 24 * 60 * 60 * 1000 },
};

const COLORS = {
  error: "rgb(239, 68, 68)",
  warn: "rgb(234, 179, 8)",
  info: "rgb(59, 130, 246)",
  total: "rgb(99, 102, 241)",
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  logs,
  onTimeRangeChange,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBrush, setShowBrush] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [smoothing, setSmoothing] = useState(true);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 处理时间序列数据
  const processData = useMemo(() => {
    try {
      setChartError(null);
      const now = Date.now();
      const rangeMs = TIME_RANGES[timeRange].ms;
      const startTime = now - rangeMs;

      const filteredLogs = logs.filter(
        (log) => new Date(log.timestamp).getTime() > startTime
      );

      // 按时间间隔分组
      const interval =
        timeRange === "1h"
          ? 5 * 60 * 1000 // 5分钟
          : timeRange === "24h"
          ? 30 * 60 * 1000 // 30分钟
          : timeRange === "7d"
          ? 3 * 60 * 60 * 1000 // 3小时
          : 12 * 60 * 60 * 1000; // 12小时 (30d)

      const groups = new Map<number, TimeSeriesData>();

      filteredLogs.forEach((log) => {
        const timestamp = new Date(log.timestamp).getTime();
        const groupTime = Math.floor(timestamp / interval) * interval;

        if (!groups.has(groupTime)) {
          groups.set(groupTime, {
            timestamp: new Date(groupTime).toLocaleString(),
            error: 0,
            warn: 0,
            info: 0,
            total: 0,
          });
        }

        const group = groups.get(groupTime)!;
        group[
          log.level as keyof Pick<TimeSeriesData, "error" | "warn" | "info">
        ]++;
        group.total++;
      });

      // 如果数据集为空，添加一个空记录以便显示图表骨架
      if (groups.size === 0) {
        const now = Date.now();
        groups.set(now, {
          timestamp: new Date(now).toLocaleString(),
          error: 0,
          warn: 0,
          info: 0,
          total: 0,
        });
      }

      return Array.from(groups.values()).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "数据处理错误";
      setChartError(message);
      toast.error("图表数据处理失败", { description: message });
      return [];
    }
  }, [logs, timeRange]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);
      setChartError(null);

      const svg = document.querySelector(".recharts-surface") as SVGElement;
      if (!svg) throw new Error("图表元素未找到");

      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svg);
      const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-timeseries-${timeRange}-${new Date().toISOString()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      toast.success("导出成功", {
        description: `已下载时序图表 (${timeRange})`,
        icon: <Download className="h-4 w-4" />,
      });
    } catch (error) {
      console.error("Export failed:", error);
      const message = error instanceof Error ? error.message : "导出失败";
      setChartError(message);
      toast.error("导出失败", {
        description: message,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsExporting(false);
      // 重置成功状态
      setTimeout(() => setExportSuccess(false), 2000);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setChartError(null);

      // 模拟加载延迟
      await new Promise((resolve) => setTimeout(resolve, 800));

      setZoomDomain(null);
      toast.success("图表已刷新", {
        description: `当前时间范围: ${TIME_RANGES[timeRange].label}`,
        icon: <RefreshCw className="h-4 w-4" />,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "刷新失败";
      setChartError(message);
      toast.error("刷新失败", {
        description: message,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  const handleTimeRangeChange = (value: TimeRange) => {
    setIsLoading(true);
    setTimeRange(value);
    onTimeRangeChange?.(value);
    setZoomDomain(null);

    // 显示加载状态一小段时间
    setTimeout(() => {
      setIsLoading(false);
      toast.success("时间范围已更新", {
        description: TIME_RANGES[value].label,
        icon: <Calendar className="h-4 w-4" />,
      });
    }, 500);
  };

  const handleZoomIn = useCallback(() => {
    const length = processData.length;
    if (length <= 4) {
      toast.info("无法进一步放大", { description: "数据点不足" });
      return;
    }

    setZoomDomain([Math.floor(length / 4), Math.floor((length * 3) / 4)]);
    toast.success("图表已放大", { icon: <ZoomIn className="h-4 w-4" /> });
  }, [processData.length]);

  const handleZoomOut = useCallback(() => {
    if (processData.length === 0) {
      toast.info("没有可显示的数据");
      return;
    }

    setZoomDomain([0, processData.length - 1]);
    toast.success("图表已重置缩放", { icon: <ZoomOut className="h-4 w-4" /> });
  }, [processData.length]);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  // 首次加载显示提示
  useEffect(() => {
    const hasShownTip = sessionStorage.getItem("timeSeriesChartTipShown");
    if (!hasShownTip) {
      setTimeout(() => {
        toast.info("提示", {
          description: "可使用 Ctrl+加号/减号 快捷键缩放图表",
          duration: 5000,
        });
        sessionStorage.setItem("timeSeriesChartTipShown", "true");
      }, 1000);
    }
  }, []);

  const CustomTooltip = useCallback(
    ({ active, payload }: TooltipProps<number, string>) => {
      if (active && payload && payload.length) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border shadow-lg">
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium">
                  {payload[0].payload.timestamp}
                </p>
                <div className="space-y-1">
                  {payload.map((entry) => (
                    <motion.div
                      key={entry.dataKey}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor:
                            COLORS[entry.dataKey as keyof typeof COLORS] + "20",
                          color: COLORS[entry.dataKey as keyof typeof COLORS],
                        }}
                      >
                        {entry.value} 条
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {entry.dataKey === "total"
                          ? "总量"
                          : entry.dataKey === "error"
                          ? "错误"
                          : entry.dataKey === "warn"
                          ? "警告"
                          : "信息"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      }
      return null;
    },
    []
  );

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <CardTitle className="text-base font-medium">时序分析</CardTitle>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.entries(TIME_RANGES) as [TimeRange, { label: string }][]
              ).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <div className="flex items-center gap-2 mr-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showGrid}
                      onCheckedChange={(checked) => {
                        setShowGrid(checked);
                        toast.success(checked ? "网格已显示" : "网格已隐藏", {
                          position: "bottom-right",
                          duration: 2000,
                        });
                      }}
                      id="show-grid"
                    />
                    <UILabel
                      htmlFor="show-grid"
                      className="text-sm cursor-pointer"
                    >
                      <Grid className="h-4 w-4" />
                    </UILabel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>显示网格</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showBrush}
                      onCheckedChange={(checked) => {
                        setShowBrush(checked);
                        toast.success(
                          checked ? "时间轴已显示" : "时间轴已隐藏",
                          {
                            position: "bottom-right",
                            duration: 2000,
                          }
                        );
                      }}
                      id="show-brush"
                    />
                    <UILabel
                      htmlFor="show-brush"
                      className="text-sm cursor-pointer"
                    >
                      <Clock className="h-4 w-4" />
                    </UILabel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>显示时间轴</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showTotal}
                      onCheckedChange={(checked) => {
                        setShowTotal(checked);
                        toast.success(checked ? "总量已显示" : "总量已隐藏", {
                          position: "bottom-right",
                          duration: 2000,
                        });
                      }}
                      id="show-total"
                    />
                    <UILabel
                      htmlFor="show-total"
                      className="text-sm cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </UILabel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>显示总量</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={smoothing}
                      onCheckedChange={(checked) => {
                        setSmoothing(checked);
                        toast.success(checked ? "曲线已平滑" : "曲线已线性化", {
                          position: "bottom-right",
                          duration: 2000,
                        });
                      }}
                      id="show-smoothing"
                    />
                    <UILabel
                      htmlFor="show-smoothing"
                      className="text-sm cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </UILabel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>平滑曲线</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className={cn(
                    "h-8 w-8",
                    "hover:bg-primary/10 hover:text-primary transition-colors"
                  )}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-1">
                  <span>放大</span>
                  <kbd className="bg-muted rounded px-1 text-xs">Ctrl+加号</kbd>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className={cn(
                    "h-8 w-8",
                    "hover:bg-primary/10 hover:text-primary transition-colors"
                  )}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-1">
                  <span>缩小</span>
                  <kbd className="bg-muted rounded px-1 text-xs">Ctrl+减号</kbd>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className={cn(
                    "h-8 w-8",
                    isLoading
                      ? "animate-pulse"
                      : "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <motion.div
                    animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      isLoading
                        ? { repeat: Infinity, duration: 1, ease: "linear" }
                        : {}
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>刷新</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExport}
                  disabled={isExporting || isLoading}
                  className={cn(
                    "h-8 w-8",
                    isExporting && "animate-pulse",
                    exportSuccess &&
                      "bg-green-100 text-green-600 border-green-200"
                  )}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exportSuccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>导出图表</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-6 relative">
        {/* 错误状态展示 */}
        <AnimatePresence>
          {chartError && (
            <motion.div
              className="absolute inset-x-0 top-0 z-10 p-4 bg-destructive/10 rounded-md text-destructive text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{chartError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 加载状态展示 */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-10 w-10 text-primary/70" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-sm text-muted-foreground"
              >
                加载中...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <ComposedChart
              data={processData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="opacity-20"
                  vertical={false}
                />
              )}
              <XAxis
                dataKey="timestamp"
                tick={{ fill: "currentColor", opacity: 0.5 }}
                tickLine={{ stroke: "currentColor", opacity: 0.2 }}
              >
                <Label
                  value="时间"
                  position="insideBottom"
                  offset={-10}
                  fill="currentColor"
                  opacity={0.5}
                />
              </XAxis>
              <YAxis
                tick={{ fill: "currentColor", opacity: 0.5 }}
                tickLine={{ stroke: "currentColor", opacity: 0.2 }}
                allowDecimals={false}
              >
                <Label
                  value="数量"
                  angle={-90}
                  position="insideLeft"
                  fill="currentColor"
                  opacity={0.5}
                />
              </YAxis>
              <RechartsTooltip content={CustomTooltip} />
              <Legend />

              {showTotal && (
                <Area
                  type={smoothing ? "monotone" : "linear"}
                  dataKey="total"
                  fill={COLORS.total + "20"}
                  stroke={COLORS.total}
                  strokeWidth={1}
                  dot={false}
                  name="总量"
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              )}

              <Bar
                dataKey="error"
                fill={COLORS.error}
                strokeWidth={1}
                name="错误"
                radius={[2, 2, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />

              <Line
                type={smoothing ? "monotone" : "linear"}
                dataKey="warn"
                stroke={COLORS.warn}
                strokeWidth={2}
                dot={{ r: 2, fill: COLORS.warn }}
                activeDot={{ r: 4, stroke: "var(--background)" }}
                name="警告"
                animationDuration={1200}
                animationEasing="ease-out"
              />

              <Line
                type={smoothing ? "monotone" : "linear"}
                dataKey="info"
                stroke={COLORS.info}
                strokeWidth={2}
                dot={{ r: 2, fill: COLORS.info }}
                activeDot={{ r: 4, stroke: "var(--background)" }}
                name="信息"
                animationDuration={1400}
                animationEasing="ease-out"
              />

              {showBrush && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="var(--primary)"
                  fill="var(--background)"
                  startIndex={zoomDomain?.[0] ?? 0}
                  endIndex={zoomDomain?.[1] ?? processData.length - 1}
                  className="transition-opacity"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 空数据状态 */}
        {processData.length <= 1 && processData[0]?.total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-muted-foreground p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm"
            >
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-lg font-medium">暂无数据</p>
              <p className="text-sm">当前时间范围内没有日志数据</p>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
