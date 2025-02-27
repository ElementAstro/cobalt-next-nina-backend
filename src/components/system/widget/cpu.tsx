"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import CountUp from "react-countup";
import { Cpu, Thermometer, Gauge } from "lucide-react";
import UsageChart from "../usage-chart";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";

export default function CpuWidget() {
  const { systemInfo, historicalData, settings } = useSystemStore();
  const [activeTab, setActiveTab] = useState("usage");

  const isOverThreshold = systemInfo.cpu.usage > settings.alertThresholds.cpu;

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
          {isOverThreshold && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium"
            >
              警告
            </motion.div>
          )}
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
                  <span className="font-bold">
                    <CountUp
                      end={systemInfo.cpu.usage}
                      suffix="%"
                      duration={1}
                      decimals={1}
                    />
                  </span>
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
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-orange-500" />
                      <span>温度</span>
                    </div>
                    <span className="font-medium">
                      {systemInfo.cpu.temperature}°C
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-blue-500" />
                      <span>时钟频率</span>
                    </div>
                    <span className="font-medium">
                      {systemInfo.cpu.clockSpeed.toFixed(1)} GHz
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span>核心</span>
                    <span className="font-medium">
                      {systemInfo.cpu.cores} 个
                    </span>
                  </div>
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
