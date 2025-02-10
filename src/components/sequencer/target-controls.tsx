"use client";

import React, { useState } from "react";
import { useSequencerStore } from "@/store/useSequencerStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, StopCircle, ChevronDown, Loader2, Save, Pause, Square } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { TargetSettings } from "@/store/useSequencerStore";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface AdvancedSettings {
  retryCount: number;
  timeout: number;
  priority: "low" | "medium" | "high";
  colorTheme: string;
}

interface TargetControlsState {
  isSaving: boolean;
  errors: {
    delayStart?: string;
    retryCount?: string;
    timeout?: string;
    [key: string]: string | undefined;
  };
  advancedSettings: {
    retryCount: number;
    timeout: number;
    priority: "low" | "medium" | "high";
    colorTheme: string;
    autoRetry: boolean;
    notifyOnComplete: boolean;
    maxParallel: number;
    logLevel: "debug" | "info" | "warn" | "error";
  };
  presets: Array<{
    id: string;
    name: string;
    settings: any;
    createdAt: Date;
    lastUsed?: Date;
  }>;
}

export function TargetControls() {
  const {
    settings,
    setSetting,
    saveSettings,
    resetSettings,
    // Rename store error to avoid conflict with local state errors
    errors: storeErrors,
    notifications,
    isRunning,
    currentProgress,
    startSequence,
    pauseSequence,
    stopSequence,
  } = useSequencerStore();
  const [state, setState] = useState<TargetControlsState>({
    isSaving: false,
    errors: {},
    advancedSettings: {
      retryCount: 3,
      timeout: 60,
      priority: "medium",
      colorTheme: "default",
      autoRetry: true,
      notifyOnComplete: true,
      maxParallel: 2,
      logLevel: "info",
    },
    presets: [],
  });
  const [presets, setPresets] = React.useState<
    Array<{ name: string; settings: TargetSettings & AdvancedSettings }>
  >([]);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(
    null
  );
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleSavePreset = () => {
    const presetName = prompt("请输入预设名称");
    if (presetName) {
      const newPreset = {
        name: presetName,
        settings: { ...settings, ...state.advancedSettings },
      };
      setPresets((prev) => [...prev, newPreset]);
    }
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      Object.entries(preset.settings).forEach(([key, value]) => {
        if (key in settings) {
          setSetting(key as keyof TargetSettings, value);
        } else {
          handleAdvancedChange(key as keyof AdvancedSettings, value);
        }
      });
      setSelectedPreset(presetName);
    }
  };
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [isExpanded, setIsExpanded] = React.useState(!isMobile);

  const handleChange = (field: keyof TargetSettings, value: string) => {
    setSetting(field, value);
  };

  const handleAdvancedChange = (
    field: keyof AdvancedSettings,
    value: string
  ) => {
    setState((prev) => ({
      ...prev,
      advancedSettings: {
        ...prev.advancedSettings,
        [field]: value,
      },
    }));
  };

  const toggleExpansion = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch (error) {
      // 错误已经在 store 中处理
    }
  };

  // 添加验证函数
  const validateSettings = (settings: any) => {
    const errors: Record<string, string> = {};
    if (settings.delayStart < 0) {
      errors.delayStart = "延迟开始时间不能为负数";
    }
    if (settings.retryCount < 0 || settings.retryCount > 10) {
      errors.retryCount = "重试次数必须在0-10之间";
    }
    if (settings.timeout < 0 || settings.timeout > 3600) {
      errors.timeout = "超时时间必须在0-3600秒之间";
    }
    return errors;
  };

  // 按钮点击动画变体
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    focus: { scale: 1.02 },
  };

  // 面板动画变体
  const panelVariants = {
    expanded: {
      opacity: 1,
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    collapsed: {
      opacity: 0,
      height: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const deviceStatus = useSequencerStore((state) => state.deviceStatus);
  const updateDeviceStatus = useSequencerStore((state) => state.updateDeviceStatus);
  const synchronizeDevices = useSequencerStore((state) => state.synchronizeDevices);

  // 添加温度控制
  const handleTemperatureChange = (temp: number) => {
    updateDeviceStatus('camera', { targetTemp: temp });
  };

  // 添加设备同步
  const handleSyncDevices = async () => {
    await synchronizeDevices();
  };

  // 添加追踪控制
  const toggleTracking = () => {
    updateDeviceStatus('mount', { tracking: !deviceStatus.mount.tracking });
  };

  return (
    <div className="bg-gray-900 rounded-md shadow-md">
      {/* 可折叠头部 */}
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center h-10 hover:bg-gray-800/50 border-b border-gray-800"
          >
            <span className="text-sm font-medium">目标控制</span>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* 主内容区域 - 固定高度 */}
          <div className="h-[50vh]">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* 设备状态面板 */}
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-2">设备状态</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400">相机温度</div>
                      <div className="flex items-center space-x-2">
                        <span>{deviceStatus.camera.temperature}°C</span>
                        {deviceStatus.camera.cooling && (
                          <span className="text-blue-400">(冷却中)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">赤道仪</div>
                      <div className="flex items-center space-x-2">
                        <span>{deviceStatus.mount.tracking ? "追踪中" : "已停止"}</span>
                        {deviceStatus.mount.slewing && (
                          <span className="text-yellow-400">(转动中)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" onClick={handleSyncDevices} disabled={isRunning}>
                      同步设备
                    </Button>
                    <Button 
                      size="sm"
                      onClick={toggleTracking}
                      disabled={!deviceStatus.mount.connected}
                    >
                      {deviceStatus.mount.tracking ? "停止追踪" : "开始追踪"}
                    </Button>
                  </div>
                </div>

                {/* 基础设置 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Label
                      htmlFor="delay-start"
                      className="text-sm text-gray-400"
                    >
                      延迟开始
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="delay-start"
                        type="number"
                        value={settings.delayStart}
                        onChange={(e) =>
                          handleChange("delayStart", e.target.value)
                        }
                        className={`w-20 bg-gray-800 border ${
                          state.errors.delayStart
                            ? "border-red-500"
                            : "border-gray-700"
                        } text-white`}
                      />
                      <span className="text-gray-400">秒</span>
                    </div>
                    {state.errors.delayStart && (
                      <span className="text-red-500 text-sm">
                        {state.errors.delayStart}
                      </span>
                    )}
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Label
                      htmlFor="sequence-mode"
                      className="text-sm text-gray-400"
                    >
                      序列模式
                    </Label>
                    <Select
                      value={settings.sequenceMode}
                      onValueChange={(value) =>
                        handleChange("sequenceMode", value)
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="one-after-another">
                          一个接一个
                        </SelectItem>
                        <SelectItem value="simultaneous">
                          同时进行
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Label className="text-sm text-gray-400">
                      预计下载时间
                    </Label>
                    <div className="text-white mt-1">
                      {settings.estimatedDownload}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Label
                      htmlFor="retry-count"
                      className="text-sm text-gray-400"
                    >
                      重试次数
                    </Label>
                    <Input
                      id="retry-count"
                      type="number"
                      value={settings.retryCount || 0}
                      onChange={(e) =>
                        handleChange("retryCount", e.target.value)
                      }
                      className={`w-20 bg-gray-800 border ${
                        state.errors.retryCount
                          ? "border-red-500"
                          : "border-gray-700"
                      } text-white mt-1`}
                    />
                    {state.errors.retryCount && (
                      <span className="text-red-500 text-sm">
                        {state.errors.retryCount}
                      </span>
                    )}
                  </motion.div>

                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <Label
                      htmlFor="timeout"
                      className="text-sm text-gray-400"
                    >
                      超时时间
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="timeout"
                        type="number"
                        value={settings.timeout || 0}
                        onChange={(e) =>
                          handleChange("timeout", e.target.value)
                        }
                        className={`w-20 bg-gray-800 border ${
                          state.errors.timeout
                            ? "border-red-500"
                            : "border-gray-700"
                        } text-white`}
                      />
                      <span className="text-gray-400">秒</span>
                    </div>
                    {state.errors.timeout && (
                      <span className="text-red-500 text-sm">
                        {state.errors.timeout}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* 高级设置 */}
                <div className="space-y-4">
                  <motion.div
                    className="mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-sm font-medium text-gray-400 mb-2">
                      高级设置
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <Label
                          htmlFor="priority"
                          className="text-sm text-gray-400"
                        >
                          任务优先级
                        </Label>
                        <Select
                          value={state.advancedSettings.priority}
                          onValueChange={(value) =>
                            handleAdvancedChange("priority", value)
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <Label
                          htmlFor="color-theme"
                          className="text-sm text-gray-400"
                        >
                          颜色主题
                        </Label>
                        <Select
                          value={state.advancedSettings.colorTheme}
                          onValueChange={(value) =>
                            handleAdvancedChange("colorTheme", value)
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="default">默认</SelectItem>
                            <SelectItem value="dark">暗黑</SelectItem>
                            <SelectItem value="light">明亮</SelectItem>
                            <SelectItem value="blue">蓝色</SelectItem>
                            <SelectItem value="green">绿色</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* 预设管理 */}
                <div className="space-y-4">
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="text-lg font-medium text-gray-400 mb-4">
                      预设管理
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select
                        value={selectedPreset || ""}
                        onValueChange={handleLoadPreset}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="选择预设" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          {presets.map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleSavePreset}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        保存当前为预设
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* 底部工具栏 - 固定在底部 */}
          <div className="border-t border-gray-800 p-2 bg-gray-900/90 backdrop-blur-sm">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={isRunning}
                  className="bg-teal-500 text-white hover:bg-teal-600"
                  size="sm"
                >
                  {state.isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
                <Button
                  onClick={resetSettings}
                  variant="destructive"
                  size="sm"
                  className="text-white hover:bg-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  重置
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={startSequence} disabled={isRunning}>
                  <Play className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={pauseSequence} disabled={!isRunning}>
                  <Pause className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={stopSequence} disabled={!isRunning}>
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
