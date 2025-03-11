"use client";

import { useEffect } from "react";
import { Toolbar } from "@/components/serial/toolbar";
import { TabsBar } from "@/components/serial/tabs-bar";
import { TerminalDisplay } from "@/components/serial/terminal-display";
import { CommandInput } from "@/components/serial/command-input";
import { VisualizationPanel } from "@/components/serial/visualization-panel";
import { ProtocolAnalyzer } from "@/components/serial/protocol-analyzer";
import { ScriptAutomation } from "@/components/serial/script-automation";
import { useSerialStore } from "@/stores/serial";
import { useTheme } from "@/hooks/use-theme";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

export default function SerialDebugInterface() {
  const {
    isSimulationMode,
    addTerminalData,
    showVisualization,
    tabs,
    activeTabId,
    isFullscreen,
    protocolParser,
  } = useSerialStore();

  // Use theme hook to apply theme
  useTheme();

  // Use hotkeys hook to register keyboard shortcuts
  useHotkeys();

  // Get active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Initialize with welcome message
  useEffect(() => {
    addTerminalData("--- 欢迎使用串口调试工具 Enterprise Edition ---", "info");
    addTerminalData('选择端口和波特率，然后点击"开始监视"按钮开始调试', "info");
    addTerminalData("提示: 使用模拟模式可以测试功能而无需实际硬件连接", "info");
    addTerminalData("新功能: 支持WebSerial API和后端串口通信", "info");
    addTerminalData(
      "新功能: 协议分析器支持MODBUS, I2C, SPI, CAN等协议",
      "info"
    );
    addTerminalData("新功能: 脚本自动化功能可以执行预定义的命令序列", "info");
  }, [addTerminalData]);

  // Apply fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }, [isFullscreen]);

  return (
    <motion.div
      className={cn(
        "flex flex-col h-screen bg-[#0a1929] text-white dark:bg-gray-900 dark:text-gray-200 transition-colors duration-200",
        isFullscreen && "fixed inset-0 z-50"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <TabsBar />
      <Toolbar />
      <div className="flex-grow flex flex-col overflow-hidden">
        <TerminalDisplay />
        {showVisualization &&
          activeTab?.dataPoints &&
          activeTab.dataPoints.length > 0 && <VisualizationPanel />}
        {protocolParser && <ProtocolAnalyzer />}
        <ScriptAutomation />
      </div>
      <CommandInput />

      <AnimatePresence>
        {isSimulationMode && (
          <motion.div
            className="absolute top-2 right-2 bg-amber-600 text-white px-2 py-1 rounded text-xs"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            模拟模式
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster />
    </motion.div>
  );
}
