"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  Legend,
  Brush,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogEntry } from "@/types/log";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSeriesChartProps {
  logs: LogEntry[];
  onTimeRangeChange?: (range: TimeRange) => void;
}

type TimeRange = "1h" | "24h" | "7d" | "30d";

interface ChartData {
  timestamp: string;
  error: number;
  warn: number;
  info: number;
  total: number;
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: keyof ChartData;
}

interface CustomTooltipProps extends Omit<TooltipProps<number, string>, 'payload'> {
  payload?: TooltipEntry[];
  label?: string;
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
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);

  const processData = useMemo(() => {
    const now = Date.now();
    const rangeMs = TIME_RANGES[timeRange].ms;
    const startTime = now - rangeMs;

    const filteredLogs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > startTime
    );

    const groupedData = filteredLogs.reduce((acc: Record<string, ChartData>, log) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      if (!acc[timestamp]) {
        acc[timestamp] = {
          timestamp,
          error: 0,
          warn: 0,
          info: 0,
          total: 0,
        };
      }
      acc[timestamp][log.level]++;
      acc[timestamp].total++;
      return acc;
    }, {});

    return Object.values(groupedData).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [logs, timeRange]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const svg = document.querySelector(".recharts-surface") as SVGElement;
      if (!svg) throw new Error("Chart element not found");

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

      toast.success("图表已导出");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setZoomDomain(null);
  }, []);

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value);
    onTimeRangeChange?.(value);
    setZoomDomain(null);
  };

  const handleZoomIn = () => {
    const length = processData.length;
    setZoomDomain([Math.floor(length / 4), Math.floor(length * 3 / 4)]);
  };

  const handleZoomOut = () => {
    setZoomDomain([0, processData.length - 1]);
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="border shadow-lg">
          <CardContent className="p-3 space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="space-y-1">
              {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: entry.color + "20",
                      color: entry.color,
                    }}
                  >
                    {entry.value} 条
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.name}日志
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

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
              {(Object.entries(TIME_RANGES) as [TimeRange, { label: string }][]).map(
                ([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Switch
              checked={showGrid}
              onCheckedChange={setShowGrid}
              id="show-grid"
            />
            <label htmlFor="show-grid" className="text-sm cursor-pointer">
              网格
            </label>
            <Switch
              checked={showBrush}
              onCheckedChange={setShowBrush}
              id="show-brush"
            />
            <label htmlFor="show-brush" className="text-sm cursor-pointer">
              缩放器
            </label>
            <Switch
              checked={showTotal}
              onCheckedChange={setShowTotal}
              id="show-total"
            />
            <label htmlFor="show-total" className="text-sm cursor-pointer">
              总量
            </label>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            disabled={isExporting}
            className={cn("h-8 w-8", isExporting && "animate-pulse")}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {showTotal && (
                <Area
                  type="monotone"
                  dataKey="total"
                  fill={COLORS.total + "20"}
                  stroke={COLORS.total}
                  strokeWidth={1}
                  dot={false}
                  name="总量"
                />
              )}

              <Bar
                dataKey="error"
                fill={COLORS.error}
                strokeWidth={1}
                name="错误"
                radius={[2, 2, 0, 0]}
              />

              <Line
                type="monotone"
                dataKey="warn"
                stroke={COLORS.warn}
                strokeWidth={2}
                dot={{ r: 2, fill: COLORS.warn }}
                activeDot={{ r: 4, stroke: "var(--background)" }}
                name="警告"
              />

              <Line
                type="monotone"
                dataKey="info"
                stroke={COLORS.info}
                strokeWidth={2}
                dot={{ r: 2, fill: COLORS.info }}
                activeDot={{ r: 4, stroke: "var(--background)" }}
                name="信息"
              />

              {showBrush && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="var(--primary)"
                  fill="var(--background)"
                  startIndex={zoomDomain?.[0] ?? 0}
                  endIndex={zoomDomain?.[1] ?? processData.length - 1}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
