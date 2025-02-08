"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import useSearchStore from "@/stores/skymap/searchStore";

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
  animationLevel?: "basic" | "advanced";
  refreshInterval?: number;
  theme?: "default" | "compact";
}

export function RealTimeData({
  showAdvanced = true,
  animationLevel = "advanced",
  refreshInterval = 60000,
  theme = "default",
}: RealTimeDataProps) {
  const { realTimeData, fetchRealTimeData } = useSearchStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRealTimeData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRealTimeData, refreshInterval]);

  if (!realTimeData) {
    return <div>Loading real-time data...</div>;
  }

  // 根据动画等级设置动画过渡效果
  const transitionSettings =
    animationLevel === "advanced" ? { duration: 0.3 } : { duration: 0.1 };

  // 根据主题设置样式：compact主题应用更紧凑的内边距和较小字体
  const containerClass =
    theme === "compact" ? "w-full text-xs p-2" : "w-full p-3";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transitionSettings}
      className={containerClass}
    >
      <Card className="bg-background/50 backdrop-blur-sm border-muted">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className={theme === "compact" ? "p-2 space-y-0" : "p-3 space-y-0"}>
            <div className="flex items-center justify-between">
              <Label className="font-medium">实时天文数据</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {open ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className={theme === "compact" ? "p-2 pt-1 space-y-2" : "p-3 pt-0 space-y-3"}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: animationLevel === "advanced" ? 0.5 : 0.2 }}
                className="space-y-2"
              >
                <p className="text-muted-foreground">
                  最后更新: {new Date(realTimeData.timestamp).toLocaleString()}
                </p>
                <p>月相: {Math.round(realTimeData.moonPhase * 100)}%</p>
                <p>可见行星: {realTimeData.visiblePlanets.join(", ") || "无"}</p>
                <p>云量: {Math.round(realTimeData.weather.cloudCover * 100)}%</p>
                <p>温度: {realTimeData.weather.temperature}°C</p>
                <p>湿度: {realTimeData.weather.humidity}%</p>
                {showAdvanced && (
                  <>
                    <p>风速: {realTimeData.weather.windSpeed} m/s</p>
                    <p>气压: {realTimeData.weather.pressure} hPa</p>
                    <p>能见度: {realTimeData.weather.visibility} km</p>
                    <p>太阳高度: {Math.round(realTimeData.astronomical.sunAltitude)}°</p>
                    <p>月亮高度: {Math.round(realTimeData.astronomical.moonAltitude)}°</p>
                    <p>视宁度: {realTimeData.astronomical.seeing.toFixed(2)}&quot;</p>
                  </>
                )}
                <TooltipProvider>
                  {[
                    { label: "云量", value: realTimeData.weather.cloudCover },
                    { label: "月相", value: realTimeData.moonPhase },
                    { label: "能见度", value: 0.8 },
                    { label: "大气稳定性", value: realTimeData.astronomical.seeing / 5 },
                    { label: "风速", value: Math.min(realTimeData.weather.windSpeed / 20, 1) },
                    { label: "能见度", value: Math.min(realTimeData.weather.visibility / 50, 1) },
                  ].map(({ label, value }) => (
                    <Tooltip key={label}>
                      <TooltipTrigger className="w-full">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>{label}</span>
                            <span>{Math.round(value * 100)}%</span>
                          </div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value * 100}%` }}
                            transition={{ duration: animationLevel === "advanced" ? 1 : 0.5, ease: "easeOut" }}
                          >
                            <Progress value={value * 100} />
                          </motion.div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>点击查看{label}详情</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </motion.div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}