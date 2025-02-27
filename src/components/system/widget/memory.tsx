// components/widgets/MemoryWidget.jsx
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
import { MemoryStick, BarChart, Info } from "lucide-react";
import UsageChart from "../usage-chart";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";

export default function MemoryWidget() {
  const { systemInfo, historicalData, settings } = useSystemStore();
  const [activeTab, setActiveTab] = useState("usage");

  const memoryUsage = Math.round(
    (systemInfo.memory.used / systemInfo.memory.total) * 100
  );
  const isOverThreshold = memoryUsage > settings.alertThresholds.memory;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const isDecimal = settings.unitDisplay === "decimal";
    const k = isDecimal ? 1000 : 1024;
    const sizes = isDecimal
      ? ["B", "KB", "MB", "GB", "TB"]
      : ["B", "KiB", "MiB", "GiB", "TiB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AnimatedCard
      className={isOverThreshold ? "border-red-500 dark:border-red-400" : ""}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            <span>内存</span>
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
        <CardDescription>物理内存状态监控</CardDescription>
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
                  <span>内存使用率</span>
                  <span className="font-bold">
                    <CountUp
                      end={memoryUsage}
                      suffix="%"
                      duration={1}
                      decimals={1}
                    />
                  </span>
                </div>
                <Progress
                  value={memoryUsage}
                  className={`h-2 ${
                    isOverThreshold ? "[&>div]:bg-red-500" : ""
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">已使用</div>
                    <div className="font-medium">
                      {formatBytes(systemInfo.memory.used * 1024 * 1024)}
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50">
                    <div className="text-xs text-muted-foreground">可用</div>
                    <div className="font-medium">
                      {formatBytes(systemInfo.memory.free * 1024 * 1024)}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="pt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <span>总内存</span>
                    </div>
                    <span className="font-medium">
                      {formatBytes(systemInfo.memory.total * 1024 * 1024)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-green-500" />
                      <span>已使用</span>
                    </div>
                    <span className="font-medium">
                      {formatBytes(systemInfo.memory.used * 1024 * 1024)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-purple-500" />
                      <span>可用</span>
                    </div>
                    <span className="font-medium">
                      {formatBytes(systemInfo.memory.free * 1024 * 1024)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-orange-500" />
                      <span>使用率</span>
                    </div>
                    <span className="font-medium">{memoryUsage}%</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="chart" className="pt-4">
                <UsageChart
                  data={historicalData.memory}
                  color={isOverThreshold ? "#ef4444" : "#8b5cf6"}
                  title="内存使用率历史"
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
}
