"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import useSearchStore from "@/stores/skymap/searchStore";
import { cn } from "@/lib/utils";

interface RealTimeData {
  timestamp: string;
  moonPhase: number;
  visiblePlanets: string[];
  weather: {
    cloudCover: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
  };
  astronomical: {
    sunAltitude: number;
    moonAltitude: number;
    twilight: string;
    seeing: number;
  };
}

interface RealTimeDataProps {
  showAdvanced?: boolean;
  refreshInterval?: number;
  theme?: "default" | "compact";
}

interface MetricData {
  label: string;
  value: number;
  unit: string;
  description: string;
  status: "good" | "warning" | "bad";
  history: Array<{ timestamp: string; value: number }>;
}

export function RealTimeData({
  showAdvanced = true,
  refreshInterval = 60000,
  theme = "default",
}: RealTimeDataProps) {
  const { realTimeData, fetchRealTimeData } = useSearchStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [historicalData, setHistoricalData] = useState<RealTimeData[]>([]);

  const updateMetrics = useCallback((data: RealTimeData) => {
    const newMetrics: MetricData[] = [
      {
        label: "云量",
        value: data.weather.cloudCover * 100,
        unit: "%",
        description: "当前云层覆盖程度",
        status: data.weather.cloudCover < 0.3 ? "good" : data.weather.cloudCover < 0.7 ? "warning" : "bad",
        history: [],
      },
      {
        label: "能见度",
        value: data.weather.visibility,
        unit: "km",
        description: "大气透明度",
        status: data.weather.visibility > 10 ? "good" : data.weather.visibility > 5 ? "warning" : "bad",
        history: [],
      },
      {
        label: "视宁度",
        value: data.astronomical.seeing,
        unit: "\"",
        description: "大气稳定性",
        status: data.astronomical.seeing < 2 ? "good" : data.astronomical.seeing < 4 ? "warning" : "bad",
        history: [],
      },
      {
        label: "月相",
        value: data.moonPhase * 100,
        unit: "%",
        description: "月球照明比例",
        status: data.moonPhase < 0.25 ? "good" : data.moonPhase < 0.75 ? "warning" : "bad",
        history: [],
      },
    ];

    setMetrics(newMetrics);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchRealTimeData();
      // 模拟历史数据
      setHistoricalData(prev => {
        const newData = [...prev];
        if (realTimeData) {
          newData.push(realTimeData);
          if (newData.length > 24) newData.shift();
        }
        return newData;
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(handleRefresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (realTimeData) {
      updateMetrics(realTimeData);
    }
  }, [realTimeData, updateMetrics]);

  const handleExport = () => {
    if (!realTimeData) return;

    const data = JSON.stringify(realTimeData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astronomical-conditions-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!realTimeData) {
    return (
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-8 flex justify-center items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const containerClass = theme === "compact" ? "w-full text-xs p-2" : "w-full p-3";
  const graphHeight = theme === "compact" ? 120 : 200;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={containerClass}
    >
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className={theme === "compact" ? "p-2" : "p-4"}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">实时天文数据</h3>
                <Badge variant="outline">
                  {new Date(realTimeData.timestamp).toLocaleTimeString()}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw 
                          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} 
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>刷新数据</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleExport}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>导出数据</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {open ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{open ? "收起" : "展开"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent 
              className={
                theme === "compact" 
                  ? "p-2 pt-0 space-y-3" 
                  : "p-4 pt-0 space-y-4"
              }
            >
              <div className="grid gap-4">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {metric.label}
                              </span>
                              <Badge
                                variant={
                                  metric.status === "good"
                                    ? "default"
                                    : metric.status === "warning"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {metric.value.toFixed(1)} {metric.unit}
                              </Badge>
                            </div>
                            <Progress 
                              value={metric.value} 
                              className={cn(
                                "h-2",
                                metric.status === "good" && "bg-primary/20",
                                metric.status === "warning" && "bg-yellow-500/20",
                                metric.status === "bad" && "bg-destructive/20"
                              )}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{metric.description}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                ))}
              </div>

              {showAdvanced && (
                <>
                  <div className="h-px bg-border/50 my-4" />
                  
                  <div className="space-y-4">
                    {/* 天气信息 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">温度: </span>
                        <span>{realTimeData.weather.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">湿度: </span>
                        <span>{realTimeData.weather.humidity}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">气压: </span>
                        <span>{realTimeData.weather.pressure} hPa</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">风速: </span>
                        <span>{realTimeData.weather.windSpeed} m/s</span>
                      </div>
                    </div>

                    {/* 可见行星 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">可见行星</h4>
                      <div className="flex flex-wrap gap-2">
                        {realTimeData.visiblePlanets.length > 0 ? (
                          realTimeData.visiblePlanets.map((planet) => (
                            <Badge key={planet} variant="outline">
                              {planet}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            当前无可见行星
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 历史趋势图 */}
                    {historicalData.length > 1 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">24小时趋势</h4>
                        <div style={{ height: graphHeight }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={historicalData.map((d) => ({
                                time: new Date(d.timestamp).toLocaleTimeString(),
                                seeing: d.astronomical.seeing,
                              }))}
                              margin={{ top: 10, right: 10, bottom: 20, left: 30 }}
                            >
                              <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke="hsl(var(--border))"
                                opacity={0.2}
                              />
                              <XAxis 
                                dataKey="time" 
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <YAxis 
                                stroke="hsl(var(--muted-foreground))"
                                label={{
                                  value: "视宁度 (\")",
                                  position: "insideLeft",
                                  angle: -90,
                                  style: { fill: "hsl(var(--muted-foreground))" },
                                }}
                              />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--background))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "0.375rem",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="seeing"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}