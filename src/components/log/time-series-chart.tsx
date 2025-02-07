import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { LogEntry } from "@/types/log";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { CurveType } from "recharts/types/shape/Curve"; // 修复 CurveType 类型问题

interface TimeSeriesChartProps {
  logs: LogEntry[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

interface ChartDataPoint {
  date: string;
  info: number;
  warn: number;
  error: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  logs,
  timeRange = "24h",
  onTimeRangeChange,
}) => {
  const [chartOptions] = useState({
    showGrid: true,
    showTooltip: true,
    showLegend: true,
    showAxis: true,
    enableAnimation: true,
    animationType: "spring",
    animationDuration: 1000,
    dataPointSize: 4,
    lineThickness: 2,
    curveType: "monotone" as CurveType, // 指定 CurveType
    colorScheme: "default",
    darkMode: true,
    gradientFill: true,
  });

  const [viewOptions] = useState({
    searchBar: true,
    statusBar: true,
    toolbar: true,
    minimap: true,
    zoomControls: true,
  });

  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const controls = useAnimation();

  const getTimeRangeInMs = (range: string) => {
    const units: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    return units[range] || units["24h"];
  };

  const chartData = useMemo(() => {
    controls.start({
      opacity: [0, 1],
      transition: { duration: 0.5 },
    });
    const now = Date.now();
    const rangeMs = getTimeRangeInMs(timeRange);

    const filtered = logs.filter(
      (log) => now - new Date(log.timestamp).getTime() <= rangeMs
    );

    const data = filtered.reduce((acc, log) => {
      const date = new Date(log.timestamp).toLocaleString();
      if (!acc[date]) {
        acc[date] = { date, info: 0, warn: 0, error: 0 };
      }
      acc[date][log.level]++;
      return acc;
    }, {} as Record<string, ChartDataPoint>);

    return Object.values(data).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [logs, timeRange, controls]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(chartData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `log-data-${timeRange}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData, timeRange]);

  const handleShare = useCallback(() => {
    // 实现分享功能
    console.log("Share chart");
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await controls.start({
      opacity: [1, 0.5, 1],
      transition: { duration: 0.5 },
    });
    // 模拟数据刷新
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, [controls]);

  const chartControls = useMemo(
    () => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            handleRefresh();
            setZoomDomain(null);
          }}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoomDomain([0, chartData.length / 2])}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoomDomain([0, chartData.length])}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    ),
    [chartData.length, handleRefresh, isLoading]
  );

  const extraControls = useMemo(
    () => (
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          Export
        </Button>
        <Button variant="outline" onClick={handleShare}>
          Share
        </Button>
      </div>
    ),
    [handleExport, handleShare]
  );

  const timeRangeSelector = useMemo(
    () => (
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="时间范围" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1h">最近1小时</SelectItem>
          <SelectItem value="24h">最近24小时</SelectItem>
          <SelectItem value="7d">最近7天</SelectItem>
          <SelectItem value="30d">最近30天</SelectItem>
        </SelectContent>
      </Select>
    ),
    [onTimeRangeChange, timeRange]
  );

  const timeRangeControls = useMemo(
    () => (
      <div className="flex items-center gap-4">
        {timeRangeSelector}
        <Switch
          checked={autoRefresh}
          onCheckedChange={setAutoRefresh}
          id="auto-refresh"
        />
        <Label htmlFor="auto-refresh">自动刷新</Label>
      </div>
    ),
    [autoRefresh, timeRangeSelector]
  );

  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          className="bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-medium">{label}</p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}: </span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <Card className="min-h-[300px] sm:min-h-[400px]">
      <CardHeader>
        <CardTitle>时序日志分析</CardTitle>
        <div className="flex items-center space-x-4">
          {timeRangeControls}
          {extraControls}
          {chartControls}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={timeRange}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                onMouseMove={(e) => {
                  if (e && e.activePayload) {
                    setHoveredPoint(e.activePayload[0]?.index);
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="infoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="warnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="errorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff7300" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {chartOptions.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" />
                )}
                {chartOptions.showAxis && (
                  <>
                    <XAxis dataKey="date" />
                    <YAxis />
                  </>
                )}
                {chartOptions.showTooltip && (
                  <Tooltip content={<CustomTooltip />} />
                )}
                {chartOptions.showLegend && <Legend />}
                <Line
                  type={chartOptions.curveType}
                  dataKey="info"
                  stroke="#8884d8"
                  strokeWidth={chartOptions.lineThickness}
                  dot={{
                    r: chartOptions.dataPointSize,
                    fill: "#8884d8",
                    strokeWidth: 2,
                    stroke: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                    className: hoveredPoint !== null ? "opacity-50" : "",
                  }}
                  activeDot={{
                    r: chartOptions.dataPointSize + 2,
                    stroke: "#8884d8",
                    strokeWidth: 2,
                    fill: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                  }}
                  animationDuration={
                    chartOptions.enableAnimation
                      ? chartOptions.animationDuration
                      : 0
                  }
                  animationEasing={
                    chartOptions.animationType === "spring"
                      ? "ease-out"
                      : "linear"
                  }
                  fill={
                    chartOptions.gradientFill ? "url(#infoGradient)" : "none"
                  }
                />
                <Line
                  type={chartOptions.curveType}
                  dataKey="warn"
                  stroke="#82ca9d"
                  strokeWidth={chartOptions.lineThickness}
                  dot={{
                    r: chartOptions.dataPointSize,
                    fill: "#82ca9d",
                    strokeWidth: 2,
                    stroke: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                    className: hoveredPoint !== null ? "opacity-50" : "",
                  }}
                  activeDot={{
                    r: chartOptions.dataPointSize + 2,
                    stroke: "#82ca9d",
                    strokeWidth: 2,
                    fill: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                  }}
                  animationDuration={
                    chartOptions.enableAnimation
                      ? chartOptions.animationDuration
                      : 0
                  }
                  animationEasing={
                    chartOptions.animationType === "spring"
                      ? "ease-out"
                      : "linear"
                  }
                  fill={
                    chartOptions.gradientFill ? "url(#warnGradient)" : "none"
                  }
                />
                <Line
                  type={chartOptions.curveType}
                  dataKey="error"
                  stroke="#ff7300"
                  strokeWidth={chartOptions.lineThickness}
                  dot={{
                    r: chartOptions.dataPointSize,
                    fill: "#ff7300",
                    strokeWidth: 2,
                    stroke: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                    className: hoveredPoint !== null ? "opacity-50" : "",
                  }}
                  activeDot={{
                    r: chartOptions.dataPointSize + 2,
                    stroke: "#ff7300",
                    strokeWidth: 2,
                    fill: chartOptions.darkMode ? "#1e1e1e" : "#ffffff",
                  }}
                  animationDuration={
                    chartOptions.enableAnimation
                      ? chartOptions.animationDuration
                      : 0
                  }
                  animationEasing={
                    chartOptions.animationType === "spring"
                      ? "ease-out"
                      : "linear"
                  }
                  fill={
                    chartOptions.gradientFill ? "url(#errorGradient)" : "none"
                  }
                />
                {viewOptions.minimap && (
                  <Brush
                    dataKey="date"
                    height={30}
                    stroke={chartOptions.darkMode ? "#8884d8" : "#1e1e1e"}
                    startIndex={zoomDomain?.[0] ?? 0}
                    endIndex={zoomDomain?.[1] ?? chartData.length - 1}
                    className="rounded-lg"
                    travellerWidth={10}
                    fill={chartOptions.darkMode ? "#8884d8" : "#1e1e1e"}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
