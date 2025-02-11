"use client";

import React, { useState } from "react";
import { useSequencerStore } from "@/stores/sequencer"; // 修正导入路径
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
import {
  X,
  Play,
  StopCircle,
  ChevronDown,
  Loader2,
  Save,
  Pause,
} from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { TargetSettings } from "@/types/sequencer";
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
    settings: TargetSettings & AdvancedSettings; // 修复第一个 any
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
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [isExpanded, setIsExpanded] = React.useState(!isMobile);

  const handleSavePreset = () => {
    const presetName = prompt("请输入预设名称");
    if (presetName) {
      const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        settings: { ...settings, ...state.advancedSettings },
        createdAt: new Date(),
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

  const handleChange = (field: keyof TargetSettings, value: string) => {
    setSetting(field as keyof TargetSettings, value); // 添加类型断言
  };

  const handleAdvancedChange = (
    field: keyof AdvancedSettings,
    value: string | number // 修改参数类型
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

  const validateSettings = (settingsObj: TargetSettings) => {
    // 修复第二个 any
    const errors: Record<string, string> = {};
    if (+settingsObj.delayStart < 0) {
      errors.delayStart = "延迟开始时间不能为负数";
    }
    if (
      typeof settingsObj.retryCount === "number" &&
      (settingsObj.retryCount < 0 || settingsObj.retryCount > 10)
    ) {
      errors.retryCount = "重试次数必须在0-10之间";
    }
    if (
      typeof settingsObj.timeout === "number" &&
      (settingsObj.timeout < 0 || settingsObj.timeout > 3600)
    ) {
      errors.timeout = "超时时间必须在0-3600秒之间";
    }
    return errors;
  };

  const handleSave = async () => {
    const errorsFound = validateSettings(settings);
    if (Object.keys(errorsFound).length > 0) {
      setState((prev) => ({ ...prev, errors: errorsFound }));
      return;
    }
    setState((prev) => ({ ...prev, isSaving: true }));
    try {
      await saveSettings();
    } catch (err) {
      console.error("保存设置失败", err);
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  return (
    <div className="bg-gray-900 rounded-md shadow-md">
      {/* 系统通知 */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-blue-800 text-white rounded-t-md"
          >
            {notifications.map((noti) => (
              <div key={noti.id} className="text-sm">
                {noti.message}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 可折叠区域 */}
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
          {/* 主内容区域 */}
          <div className="h-[50vh]">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
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
                        <SelectItem value="simultaneous">同时进行</SelectItem>
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
                    <Label htmlFor="timeout" className="text-sm text-gray-400">
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
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium text-gray-400">
                        高级设置
                      </div>
                      <Button variant="outline" onClick={toggleExpansion}>
                        {isExpanded ? "隐藏详情" : "显示详情"}
                      </Button>
                    </div>
                    {isExpanded && (
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
                    )}
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

                {/* 显示当前进度条 */}
                <div className="mt-4">
                  <Label className="text-sm text-gray-400">当前进度</Label>
                  <progress
                    className="w-full"
                    value={currentProgress}
                    max={100}
                  />
                </div>

                {/* 显示Store错误（storeErrors） */}
                {storeErrors && Object.keys(storeErrors).length > 0 && (
                  <div className="mt-2 p-2 bg-red-800 text-white rounded">
                    {Object.entries(storeErrors).map(([key, msg]) => (
                      <div key={key} className="text-sm">
                        {key}: {msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* 底部工具栏 */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startSequence}
                  disabled={isRunning}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pauseSequence}
                  disabled={!isRunning}
                >
                  <Pause className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopSequence}
                  disabled={!isRunning}
                >
                  <StopCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
