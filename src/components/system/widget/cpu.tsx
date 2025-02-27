"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; // 直接引入 sonner 的 toast
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import CountUp from "react-countup";
import { Cpu, Thermometer, Gauge, AlertCircle } from "lucide-react";
import UsageChart from "../usage-chart";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";
import { LoadingState } from "../loading-state";
import { ErrorState } from "../error-state";

export default function CpuWidget() {
  const {
    systemInfo,
    historicalData,
    settings,
    isLoading,
    error,
    refreshSystemInfo,
  } = useSystemStore();
  const [activeTab, setActiveTab] = useState("usage");
  const [showWarning, setShowWarning] = useState(false);

  const isOverThreshold = systemInfo.cpu.usage > settings.alertThresholds.cpu;

  // 检查 CPU 使用率是否超过阈值，并显示警告
  useEffect(() => {
    if (isOverThreshold && !showWarning) {
      toast.warning(
        `CPU 使用率超过阈值(${
          settings.alertThresholds.cpu
        }%)，当前: ${systemInfo.cpu.usage.toFixed(1)}%`,
        {
          duration: 5000,
        }
      );
      setShowWarning(true);
    } else if (!isOverThreshold) {
      setShowWarning(false);
    }
  }, [
    isOverThreshold,
    settings.alertThresholds.cpu,
    systemInfo.cpu.usage,
    showWarning,
  ]);

  if (isLoading) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <span>CPU</span>
          </CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <LoadingState message="正在获取CPU信息..." />
        </CardContent>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <span>CPU</span>
          </CardTitle>
          <CardDescription>数据获取失败</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <ErrorState
            message="无法加载CPU数据"
            retryAction={refreshSystemInfo}
          />
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard
      className={isOverThreshold ? "border-red-500 dark:border-red-400" : ""}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <span>CPU</span>
          </CardTitle>
          <AnimatePresence>
            {isOverThreshold && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                <span>警告</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <CardDescription>{systemInfo.cpu.model}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="usage" className="flex-1">
              使用率
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1">
              详情
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex-1">
              历史
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="usage" className="pt-4 space-y-4">
                <div className="flex justify-between">
                  <span>CPU使用率</span>
                  <motion.span
                    className={`font-bold ${
                      isOverThreshold ? "text-red-500" : ""
                    }`}
                    animate={
                      isOverThreshold
                        ? {
                            scale: [1, 1.1, 1],
                            transition: { repeat: Infinity, duration: 2 },
                          }
                        : {}
                    }
                  >
                    <CountUp
                      end={systemInfo.cpu.usage}
                      suffix="%"
                      duration={1}
                      decimals={1}
                      onEnd={() => {
                        if (systemInfo.cpu.usage > 90) {
                          toast.info("CPU使用率过高，请检查系统进程");
                        }
                      }}
                    />
                  </motion.span>
                </div>
                <Progress
                  value={systemInfo.cpu.usage}
                  className={`h-2 ${
                    isOverThreshold ? "[&>div]:bg-red-500" : ""
                  }`}
                />
                <div className="flex justify-between">
                  <span>逻辑处理器:</span>
                  <span className="font-medium">{systemInfo.cpu.cores}</span>
                </div>
              </TabsContent>

              <TabsContent value="details" className="pt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <motion.div
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span>温度</span>
                    </div>
                    <motion.span
                      className={`font-medium ${
                        systemInfo.cpu.temperature > 70 ? "text-red-500" : ""
                      }`}
                      animate={
                        systemInfo.cpu.temperature > 70
                          ? {
                              scale: [1, 1.1, 1],
                              transition: { repeat: Infinity, duration: 2 },
                            }
                          : {}
                      }
                    >
                      {systemInfo.cpu.temperature}°C
                    </motion.span>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-blue-500" />
                      <span>时钟频率</span>
                    </div>
                    <span className="font-medium">
                      {systemInfo.cpu.clockSpeed.toFixed(1)} GHz
                    </span>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span>核心</span>
                    <span className="font-medium">
                      {systemInfo.cpu.cores} 个
                    </span>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="chart" className="pt-4">
                <UsageChart
                  data={historicalData.cpu}
                  color={isOverThreshold ? "#ef4444" : "#3b82f6"}
                  title="CPU使用率历史"
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
}
