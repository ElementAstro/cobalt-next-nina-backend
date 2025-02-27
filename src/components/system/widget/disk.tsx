"use client";

import { useState, useEffect } from "react";
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
import { Database, HardDrive, AlertCircle } from "lucide-react";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";
import { warningToast } from "@/lib/toast";
import { LoadingState } from "../loading-state";
import { ErrorState } from "../error-state";

export default function DiskWidget() {
  const { systemInfo, settings, isLoading, error, refreshSystemInfo } =
    useSystemStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [showWarning, setShowWarning] = useState(false);

  const diskUsage = Math.round(
    (systemInfo.disk.used / systemInfo.disk.total) * 100
  );
  const isOverThreshold = diskUsage > settings.alertThresholds.disk;

  // 检测磁盘使用率是否超过阈值
  useEffect(() => {
    if (isOverThreshold && !showWarning) {
      warningToast(
        `磁盘使用率超过阈值(${settings.alertThresholds.disk}%)，当前: ${diskUsage}%`
      );
      setShowWarning(true);
    } else if (!isOverThreshold) {
      setShowWarning(false);
    }
  }, [isOverThreshold, settings.alertThresholds.disk, diskUsage, showWarning]);

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

  if (isLoading) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>磁盘存储</span>
          </CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <LoadingState message="正在获取存储信息..." />
        </CardContent>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>磁盘存储</span>
          </CardTitle>
          <CardDescription>获取数据失败</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <ErrorState
            message="无法加载磁盘数据"
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
            <Database className="h-5 w-5" />
            <span>磁盘存储</span>
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
                <span>空间不足</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <CardDescription>存储设备与空间监控</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              总览
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex-1">
              设备
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
              <TabsContent value="overview" className="pt-4 space-y-4">
                <div className="flex justify-between">
                  <span>磁盘使用率</span>
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
                      end={diskUsage}
                      suffix="%"
                      duration={1}
                      decimals={1}
                    />
                  </motion.span>
                </div>
                <Progress
                  value={diskUsage}
                  className={`h-2 ${
                    isOverThreshold ? "[&>div]:bg-red-500" : ""
                  }`}
                />

                <div className="grid grid-cols-3 gap-2">
                  <motion.div
                    className="p-2 rounded-md bg-muted/50"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-xs text-muted-foreground">总容量</div>
                    <div className="font-medium truncate">
                      {formatBytes(systemInfo.disk.total * 1024 * 1024 * 1024)}
                    </div>
                  </motion.div>
                  <motion.div
                    className="p-2 rounded-md bg-muted/50"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-xs text-muted-foreground">已使用</div>
                    <div className="font-medium truncate">
                      {formatBytes(systemInfo.disk.used * 1024 * 1024 * 1024)}
                    </div>
                  </motion.div>
                  <motion.div
                    className="p-2 rounded-md bg-muted/50"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-xs text-muted-foreground">可用</div>
                    <div className="font-medium truncate">
                      {formatBytes(systemInfo.disk.free * 1024 * 1024 * 1024)}
                    </div>
                  </motion.div>
                </div>
              </TabsContent>

              <TabsContent value="devices" className="pt-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {systemInfo.disk.devices.map((device, index) => {
                      const deviceUsage = Math.round(
                        (device.used / device.size) * 100
                      );
                      const isDeviceWarning =
                        deviceUsage > settings.alertThresholds.disk;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <HardDrive
                                className={`h-4 w-4 ${
                                  isDeviceWarning ? "text-red-500" : ""
                                }`}
                              />
                              <span className="font-medium">{device.name}</span>
                            </div>
                            <motion.span
                              className={
                                isDeviceWarning
                                  ? "text-red-500 font-medium"
                                  : ""
                              }
                              animate={
                                isDeviceWarning
                                  ? {
                                      scale: [1, 1.1, 1],
                                      transition: {
                                        repeat: Infinity,
                                        duration: 2,
                                      },
                                    }
                                  : {}
                              }
                            >
                              {deviceUsage}%
                            </motion.span>
                          </div>
                          <Progress
                            value={deviceUsage}
                            className={`h-1.5 ${
                              isDeviceWarning ? "[&>div]:bg-red-500" : ""
                            }`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {formatBytes(device.used * 1024 * 1024 * 1024)}{" "}
                              已用
                            </span>
                            <span>
                              {formatBytes(device.size * 1024 * 1024 * 1024)}{" "}
                              总计
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {systemInfo.disk.devices.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      未检测到存储设备
                    </div>
                  )}
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
}
