"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { Button } from "@/components/ui/button";
import { RotateCw, Settings, Sun, Moon, AlertTriangle } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import useSystemStore from "@/stores/system/systemStore";
import SettingsPanel from "@/components/system/settings-panel";
import { useTheme } from "next-themes";

// 引入所有部件组件
import CpuWidget from "@/components/system/widget/cpu";
import MemoryWidget from "@/components/system/widget/memory";
import DiskWidget from "@/components/system/widget/disk";
import OsWidget from "@/components/system/widget/os";
import NetworkWidget from "@/components/system/widget/network";
import GpuWidget from "@/components/system/widget/gpu";
import ProcessesWidget from "@/components/system/widget/process";
import ServicesWidget from "@/components/system/widget/services";

// 部件映射表类型
type WidgetId =
  | "cpu"
  | "memory"
  | "disk"
  | "os"
  | "network"
  | "gpu"
  | "processes"
  | "services";
type WidgetComponents = {
  [K in WidgetId]: () => JSX.Element;
};

// 部件映射表
const widgetComponents: WidgetComponents = {
  cpu: CpuWidget,
  memory: MemoryWidget,
  disk: DiskWidget,
  os: OsWidget,
  network: NetworkWidget,
  gpu: GpuWidget,
  processes: ProcessesWidget,
  services: ServicesWidget,
};

export default function SystemInfoPanel() {
  const {
    systemInfo,
    loading,
    error,
    fetchSystemInfo,
    settings,
    updateSettings,
  } = useSystemStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 增强的响应式设计钩子 - 增加对横屏模式的支持
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 1024 });
  const isLandscape = useMediaQuery({ orientation: "landscape" });
  const isMobileLandscape = isMobile && isLandscape;

  // 根据设备和方向自动调整列数
  useEffect(() => {
    // 移动设备竖屏模式始终为1列
    if (isMobile && !isLandscape && settings.layoutConfig.columns !== 1) {
      updateSettings({
        layoutConfig: { ...settings.layoutConfig, columns: 1 },
      });
    }
    // 移动设备横屏模式自动设为2列
    else if (isMobileLandscape && settings.layoutConfig.columns !== 2) {
      updateSettings({
        layoutConfig: { ...settings.layoutConfig, columns: 2 },
      });
    }
  }, [
    isMobile,
    isLandscape,
    settings.layoutConfig,
    updateSettings,
    isMobileLandscape,
  ]);

  // 定时刷新数据
  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, settings.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchSystemInfo, settings.refreshInterval]);

  // 监控阈值检查并发送通知
  useEffect(() => {
    if (systemInfo.cpu.usage > settings.alertThresholds.cpu) {
      toast({
        title: "CPU 使用率警告",
        description: `CPU 使用率达到 ${systemInfo.cpu.usage.toFixed(
          1
        )}%，超过设定阈值 ${settings.alertThresholds.cpu}%`,
        variant: "destructive",
      });
    }

    const memoryUsage = Math.round(
      (systemInfo.memory.used / systemInfo.memory.total) * 100
    );
    if (memoryUsage > settings.alertThresholds.memory) {
      toast({
        title: "内存使用率警告",
        description: `内存使用率达到 ${memoryUsage}%，超过设定阈值 ${settings.alertThresholds.memory}%`,
        variant: "destructive",
      });
    }

    const diskUsage = Math.round(
      (systemInfo.disk.used / systemInfo.disk.total) * 100
    );
    if (diskUsage > settings.alertThresholds.disk) {
      toast({
        title: "磁盘使用率警告",
        description: `磁盘使用率达到 ${diskUsage}%，超过设定阈值 ${settings.alertThresholds.disk}%`,
        variant: "destructive",
      });
    }
  }, [systemInfo, settings.alertThresholds, toast]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <AlertTriangle className="text-red-500 h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">发生错误</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchSystemInfo}>重试</Button>
      </div>
    );
  }

  // 动态确定列数 - 考虑横屏模式
  const getGridCols = () => {
    if (isMobile && !isLandscape) return 1;
    if (isMobileLandscape) return 2;
    if (isTablet) return Math.min(2, settings.layoutConfig.columns);
    return settings.layoutConfig.columns;
  };

  const gridCols = getGridCols();

  // 为横屏模式优化顶部栏
  const isCompactHeader = isMobileLandscape;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 animate-in fade-in duration-700 max-w-7xl">
      <div
        className={`flex flex-col ${
          isCompactHeader ? "sm:flex-row" : "sm:flex-row"
        } justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4`}
      >
        <div className={isCompactHeader ? "mb-2 sm:mb-0" : ""}>
          <h1
            className={`text-xl ${
              isCompactHeader ? "" : "sm:text-2xl md:text-3xl"
            } font-bold`}
          >
            系统信息面板
          </h1>
          <p
            className={`text-muted-foreground text-sm ${
              isCompactHeader ? "hidden sm:block" : "mt-1"
            }`}
          >
            实时监控您的系统资源
          </p>
        </div>

        <div className="flex gap-2 self-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span
              className={
                isMobileLandscape ? "hidden sm:inline" : "hidden sm:inline"
              }
            >
              设置
            </span>
          </Button>

          <Button
            variant="default"
            onClick={fetchSystemInfo}
            disabled={loading}
            className="flex items-center gap-1 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <RotateCw
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span
              className={
                isMobileLandscape ? "hidden sm:inline" : "hidden sm:inline"
              }
            >
              刷新
            </span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        <div
          className={`grid gap-2 sm:gap-3 md:gap-4 auto-rows-auto`}
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            gridAutoRows: isMobileLandscape ? "auto" : undefined,
          }}
        >
          {settings.layoutConfig.visibleWidgets.map((widgetId) => {
            const WidgetComponent = widgetComponents[widgetId as WidgetId];
            if (!WidgetComponent) return null;

            return (
              <motion.div
                key={widgetId}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <WidgetComponent />
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster />
    </div>
  );
}
