// components/widgets/GpuWidget.jsx
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
import { Cpu, Thermometer } from "lucide-react";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";

export default function GpuWidget() {
  const { systemInfo } = useSystemStore();
  const [activeTab, setActiveTab] = useState("usage");

  // 判断温度是否过高
  const isTemperatureHigh = systemInfo.gpu.temperature > 80;

  // 判断使用率是否过高
  const isUsageHigh = systemInfo.gpu.usage > 90;

  return (
    <AnimatedCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          <span>GPU</span>
        </CardTitle>
        <CardDescription>{systemInfo.gpu.model}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="usage" className="flex-1">
              使用率
            </TabsTrigger>
            <TabsTrigger value="temperature" className="flex-1">
              温度
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
                  <span>GPU使用率</span>
                  <span
                    className={`font-bold ${
                      isUsageHigh ? "text-amber-500" : ""
                    }`}
                  >
                    <CountUp
                      end={systemInfo.gpu.usage}
                      suffix="%"
                      duration={1}
                      decimals={1}
                    />
                  </span>
                </div>
                <Progress
                  value={systemInfo.gpu.usage}
                  className={`h-2 ${isUsageHigh ? "[&>div]:bg-amber-500" : ""}`}
                />

                <div className="mt-2 p-3 rounded-md bg-muted/50">
                  <div className="text-sm">GPU型号</div>
                  <div className="font-medium mt-1">{systemInfo.gpu.model}</div>
                </div>
              </TabsContent>

              <TabsContent value="temperature" className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Thermometer
                      className={`h-5 w-5 ${
                        isTemperatureHigh ? "text-red-500" : "text-orange-500"
                      }`}
                    />
                    <span>GPU温度</span>
                  </div>
                  <span
                    className={`text-xl font-bold ${
                      isTemperatureHigh ? "text-red-500" : ""
                    }`}
                  >
                    <CountUp
                      end={systemInfo.gpu.temperature}
                      suffix="°C"
                      duration={1}
                    />
                  </span>
                </div>

                <div className="relative pt-5">
                  <div className="absolute inset-x-0 top-0 flex justify-between text-xs text-muted-foreground">
                    <span>0°C</span>
                    <span>50°C</span>
                    <span>100°C</span>
                  </div>

                  <Progress
                    value={systemInfo.gpu.temperature}
                    max={100}
                    className={`h-3 ${
                      isTemperatureHigh
                        ? "[&>div]:bg-red-500"
                        : systemInfo.gpu.temperature > 60
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-green-500"
                    }`}
                  />
                </div>

                <div className="mt-2 p-3 rounded-md bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">温度状态</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isTemperatureHigh
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : systemInfo.gpu.temperature > 60
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {isTemperatureHigh
                        ? "过热"
                        : systemInfo.gpu.temperature > 60
                        ? "温暖"
                        : "正常"}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
}
