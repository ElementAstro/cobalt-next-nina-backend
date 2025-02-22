"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  TooltipProps,
} from "recharts";
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
import { LogEntry } from "@/types/log";
import {
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Radar as RadarIcon,
  Download,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LogChartProps {
  logs: LogEntry[];
  chartType?: "bar" | "pie" | "radar" | "line";
  showTrends?: boolean;
  groupBy?: "level" | "hour" | "day" | "custom";
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps extends Omit<TooltipProps<number, string>, 'payload'> {
  payload?: Array<{
    payload: ChartData;
    value: number;
  }>;
}

const COLORS = {
  error: "rgb(239, 68, 68)",
  warn: "rgb(234, 179, 8)",
  info: "rgb(59, 130, 246)",
  success: "rgb(34, 197, 94)",
  default: "rgb(99, 102, 241)",
};

const CHART_TYPES = [
  { value: "bar", label: "柱状图", icon: BarChart2 },
  { value: "line", label: "折线图", icon: LineChartIcon },
  { value: "pie", label: "饼图", icon: PieChartIcon },
  { value: "radar", label: "雷达图", icon: RadarIcon },
] as const;

const LogChart: React.FC<LogChartProps> = ({
  logs,
  chartType: initialChartType = "bar",
  groupBy = "level",
}) => {
  const [chartType, setChartType] = useState(initialChartType);
  const [isExporting, setIsExporting] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const processData = useMemo(() => {
    const groupedData = logs.reduce((acc: { [key: string]: number }, log) => {
      const key = groupBy === "level" ? log.level : new Date(log.timestamp).toLocaleString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedData).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS] || COLORS.default,
    }));
  }, [logs, groupBy]);

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
      a.download = `log-chart-${new Date().toISOString()}.svg`;
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

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="border shadow-lg">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-sm font-medium">{label || data.name}</p>
            <Badge 
              variant="secondary" 
              style={{ 
                backgroundColor: data.color + "20",
                color: data.color 
              }}
            >
              {payload[0].value} 条日志
            </Badge>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <BarChart data={processData} className="[&_.recharts-cartesian-grid-horizontal]:opacity-20">
      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
      <XAxis 
        dataKey="name" 
        tick={{ fill: "currentColor", opacity: 0.5 }} 
      />
      <YAxis 
        tick={{ fill: "currentColor", opacity: 0.5 }}
        allowDecimals={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="value" className="cursor-pointer">
        {processData.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={entry.color}
            opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        ))}
      </Bar>
    </BarChart>
  );

  const renderLineChart = () => (
    <LineChart data={processData} className="[&_.recharts-cartesian-grid-horizontal]:opacity-20">
      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
      <XAxis 
        dataKey="name" 
        tick={{ fill: "currentColor", opacity: 0.5 }} 
      />
      <YAxis 
        tick={{ fill: "currentColor", opacity: 0.5 }}
        allowDecimals={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Line
        type="monotone"
        dataKey="value"
        stroke={COLORS.default}
        strokeWidth={2}
        dot={{
          r: 4,
          strokeWidth: 2,
          fill: "var(--background)",
          stroke: COLORS.default,
        }}
        activeDot={{
          r: 6,
          strokeWidth: 2,
          fill: COLORS.default,
          stroke: "var(--background)",
        }}
      />
    </LineChart>
  );

  const renderPieChart = () => (
    <PieChart>
      <Pie
        data={processData}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={2}
        dataKey="value"
        className="cursor-pointer"
      >
        {processData.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={entry.color}
            opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend />
    </PieChart>
  );

  const renderRadarChart = () => (
    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={processData}>
      <PolarGrid className="opacity-20" />
      <PolarAngleAxis dataKey="name" tick={{ fill: "currentColor", opacity: 0.5 }} />
      <PolarRadiusAxis tick={{ fill: "currentColor", opacity: 0.5 }} />
      <Radar
        name="日志分布"
        dataKey="value"
        stroke={COLORS.default}
        fill={COLORS.default}
        fillOpacity={0.2}
      />
      <Tooltip content={<CustomTooltip />} />
    </RadarChart>
  );

  const renderChart = () => {
    const charts = {
      bar: renderBarChart,
      line: renderLineChart,
      pie: renderPieChart,
      radar: renderRadarChart,
    };
    return charts[chartType]?.() || null;
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">日志统计</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={chartType} onValueChange={(value: typeof chartType) => setChartType(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "transition-all",
              isExporting && "animate-pulse"
            )}
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
        <div className="h-[350px] w-full">
          <ResponsiveContainer>
            <AnimatePresence mode="wait">
              <motion.div
                key={chartType}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderChart()}
              </motion.div>
            </AnimatePresence>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export { LogChart };
export type { LogChartProps };
