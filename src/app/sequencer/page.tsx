"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TargetSetHeader } from "@/components/sequencer/target-set-header";
import { TimelineGraph } from "@/components/sequencer/timeline-graph";
import { TargetControls } from "@/components/sequencer/target-controls";
import { AutofocusSettings } from "@/components/sequencer/autofocus-settings";
import { CoordinateData } from "@/types/sequencer";
import { useMediaQuery } from "react-responsive";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Pause,
  Square,
} from "lucide-react";
import { useSequencerStore } from "@/store/useSequencerStore";
import { Progress } from "@/components/ui/progress";
import { ExposureTaskList } from "@/components/sequencer/exposure-task-list";
import { TargetList } from "@/components/sequencer/target-list";

const timelineData = Array.from({ length: 24 }, (_, i) => ({
  time: i.toString().padStart(2, "0"),
  value: i >= 3 && i <= 6 ? 90 : 30,
}));

const initialCoordinates: CoordinateData = {
  ra: { h: 0, m: 0, s: 0 },
  dec: { d: 0, m: 0, s: 0 },
  rotation: 0,
};

const containerVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: {
      duration: 0.5,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function SequencerEditor() {
  const [coordinates, setCoordinates] =
    useState<CoordinateData>(initialCoordinates);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const {
    errors,
    notifications,
    clearNotification,
    isRunning,
    currentProgress,
    startSequence,
    stopSequence,
    pauseSequence,
  } = useSequencerStore();

  const deviceStatus = useSequencerStore((state) => state.deviceStatus);
  const synchronizeDevices = useSequencerStore(
    (state) => state.synchronizeDevices
  );

  // Dummy implementations for settings actions.
  const saveSettings = () => {
    console.log("Settings saved");
  };

  const resetSettings = () => {
    console.log("Settings reset");
  };

  // 自动清除已读通知
  useEffect(() => {
    const timer = setInterval(() => {
      notifications
        .filter((n) => n.read)
        .forEach((n) => clearNotification(n.id));
    }, 5000);
    return () => clearInterval(timer);
  }, [notifications, clearNotification]);

  // 监听错误并显示通知
  useEffect(() => {
    if (errors.length > 0) {
      // 使用 toast 或其他通知组件显示错误
      console.error("Error:", errors);
    }
  }, [errors]);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            saveSettings();
            break;
          case "r":
            e.preventDefault();
            resetSettings();
            break;
          // 添加更多快捷键...
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // 已移除未使用的 debouncedSave

  useEffect(() => {
    useSequencerStore.getState().fetchInitialData();
  }, []);

  // 添加设备状态监控
  useEffect(() => {
    const interval = setInterval(() => {
      // 模拟设备状态更新
      const temp = deviceStatus.camera.temperature;
      if (
        deviceStatus.camera.cooling &&
        temp > deviceStatus.camera.targetTemp
      ) {
        useSequencerStore.getState().updateDeviceStatus("camera", {
          temperature: temp - 0.1,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deviceStatus.camera]);

  // 页面加载时自动同步设备
  useEffect(() => {
    synchronizeDevices();
  }, []);

  return (
    <div className="h-screen bg-gray-950 text-white">
      {/* Header - 固定高度 */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center px-4 bg-gray-900/50 border-b border-gray-800 h-12"
      >
        <h1 className="text-lg font-medium">目标设置</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area - 固定高度计算 */}
      <div className="h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-12">
        {/* Left Panel */}
        <div className="lg:col-span-8 border-r border-gray-800">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <motion.div variants={itemVariants}>
                <TargetSetHeader />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-gray-900/50 rounded-lg p-4"
              >
                <h2 className="text-lg mb-2">目标列表</h2>
                <TargetList />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-gray-900/50 rounded-lg p-4"
              >
                <ExposureTaskList />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-gray-900/50 rounded-lg p-4"
              >
                <TimelineGraph
                  data={timelineData}
                  height={180}
                  showControls
                  showGrid
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-gray-900/50 rounded-lg p-4"
              >
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">赤经</div>
                    <div className="font-mono">{`${coordinates.ra.h}h ${
                      coordinates.ra.m
                    }m ${coordinates.ra.s.toFixed(1)}s`}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">赤纬</div>
                    <div className="font-mono">{`${coordinates.dec.d}d ${
                      coordinates.dec.m
                    }m ${coordinates.dec.s.toFixed(1)}s`}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">旋转</div>
                    <div className="font-mono">{`${coordinates.rotation}°`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-sm">时间</div>
                    <div className="font-mono">15:39:51</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-4">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <motion.div variants={itemVariants}>
                <TargetControls />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AutofocusSettings />
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Fixed Elements */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-red-600 p-3 rounded-lg shadow-lg">
            出错了！请检查日志。
          </div>
        </motion.div>
      )}

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
            <Progress value={currentProgress} />
            <div className="mt-2 text-sm text-gray-400">
              正在执行序列... {currentProgress}%
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        className="fixed bottom-4 left-4 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg flex space-x-1 border border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={startSequence}
            disabled={isRunning}
            className="h-8 w-8"
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={pauseSequence}
            disabled={!isRunning}
            className="h-8 w-8"
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopSequence}
            disabled={!isRunning}
            className="h-8 w-8"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Device Status */}
      <div className="fixed top-4 left-4 z-50">
        <motion.div
          className="bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg border border-gray-800"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  deviceStatus.camera.connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs">相机</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  deviceStatus.mount.connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs">赤道仪</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  deviceStatus.focuser.connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs">对焦器</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
