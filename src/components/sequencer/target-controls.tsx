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
  Clock,
  ArrowUpDown,
  RefreshCw,
  Timer,
  BarChart2,
  Palette,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { TargetSettings } from "@/types/sequencer";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
// 添加缺少的导入
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="bg-gray-900/70 rounded-md shadow-md border border-gray-800 backdrop-blur-sm transition-all hover:border-gray-700">
      {/* 系统通知 */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="p-3 bg-blue-800/70 text-white rounded-t-md border-b border-blue-700"
          >
            {notifications.map((noti) => (
              <motion.div
                key={noti.id}
                className="text-sm flex items-center gap-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                {noti.message}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 可折叠区域 */}
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex justify-between items-center h-10 hover:bg-gray-800/50 border-b border-gray-800 group"
          >
            <span className="text-sm font-medium group-hover:text-teal-400 transition-colors">
              目标控制
            </span>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-gray-400 group-hover:text-teal-400 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* 主内容区域 */}
          <div className="h-[50vh]">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* 基础设置 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      className="w-1 h-5 bg-teal-500"
                      layoutId="settingHighlight"
                    />
                    <h3 className="text-md font-medium">基础设置</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-3">
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.2 }}
                    >
                      <Label
                        htmlFor="delay-start"
                        className="text-sm text-gray-400 flex items-center gap-1 mb-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        延迟开始
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="delay-start"
                          type="number"
                          value={settings.delayStart}
                          onChange={(e) =>
                            handleChange("delayStart", e.target.value)
                          }
                          className={`w-20 bg-gray-800/70 border ${
                            state.errors.delayStart
                              ? "border-red-500 focus:ring-red-500/50"
                              : "border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50"
                          } text-white transition-colors`}
                        />
                        <span className="text-gray-400">秒</span>
                      </div>
                      <AnimatePresence>
                        {state.errors.delayStart && (
                          <motion.span
                            className="text-red-500 text-xs mt-1 block"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {state.errors.delayStart}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.3 }}
                    >
                      <Label
                        htmlFor="sequence-mode"
                        className="text-sm text-gray-400 flex items-center gap-1 mb-1.5"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        序列模式
                      </Label>
                      <Select
                        value={settings.sequenceMode}
                        onValueChange={(value) =>
                          handleChange("sequenceMode", value)
                        }
                      >
                        <SelectTrigger className="bg-gray-800/70 border-gray-700 text-white hover:border-gray-600 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem
                            value="one-after-another"
                            className="focus:bg-teal-500/20"
                          >
                            一个接一个
                          </SelectItem>
                          <SelectItem
                            value="simultaneous"
                            className="focus:bg-teal-500/20"
                          >
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
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.4 }}
                    >
                      <Label
                        htmlFor="retry-count"
                        className="text-sm text-gray-400 flex items-center gap-1 mb-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        重试次数
                      </Label>
                      <Input
                        id="retry-count"
                        type="number"
                        value={settings.retryCount || 0}
                        onChange={(e) =>
                          handleChange("retryCount", e.target.value)
                        }
                        className={`w-20 bg-gray-800/70 border ${
                          state.errors.retryCount
                            ? "border-red-500 focus:ring-red-500/50"
                            : "border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50"
                        } text-white transition-colors`}
                      />
                      <AnimatePresence>
                        {state.errors.retryCount && (
                          <motion.span
                            className="text-red-500 text-xs mt-1 block"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {state.errors.retryCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5 }}
                    >
                      <Label
                        htmlFor="timeout"
                        className="text-sm text-gray-400 flex items-center gap-1 mb-1.5"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        超时时间
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="timeout"
                          type="number"
                          value={settings.timeout || 0}
                          onChange={(e) =>
                            handleChange("timeout", e.target.value)
                          }
                          className={`w-20 bg-gray-800/70 border ${
                            state.errors.timeout
                              ? "border-red-500 focus:ring-red-500/50"
                              : "border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50"
                          } text-white transition-colors`}
                        />
                        <span className="text-gray-400">秒</span>
                      </div>
                      <AnimatePresence>
                        {state.errors.timeout && (
                          <motion.span
                            className="text-red-500 text-xs mt-1 block"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {state.errors.timeout}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </motion.div>

                {/* 高级设置 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-1 h-5 bg-purple-500"
                        layoutId="settingHighlight"
                        transition={{ duration: 0.3 }}
                      />
                      <h3 className="text-md font-medium">高级设置</h3>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        onClick={toggleExpansion}
                        className="text-xs h-7 bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors"
                      >
                        {isExpanded ? "隐藏详情" : "显示详情"}
                      </Button>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-3"
                      >
                        <div>
                          <Label
                            htmlFor="priority"
                            className="text-sm text-gray-400 mb-1.5 flex items-center gap-1"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            任务优先级
                          </Label>
                          <Select
                            value={state.advancedSettings.priority}
                            onValueChange={(value) =>
                              handleAdvancedChange("priority", value)
                            }
                          >
                            <SelectTrigger className="bg-gray-800/70 border-gray-700 text-white hover:border-gray-600 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem
                                value="low"
                                className="focus:bg-teal-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                                  低
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="medium"
                                className="focus:bg-teal-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                  中
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="high"
                                className="focus:bg-teal-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-400" />
                                  高
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label
                            htmlFor="color-theme"
                            className="text-sm text-gray-400 mb-1.5 flex items-center gap-1"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            颜色主题
                          </Label>
                          <Select
                            value={state.advancedSettings.colorTheme}
                            onValueChange={(value) =>
                              handleAdvancedChange("colorTheme", value)
                            }
                          >
                            <SelectTrigger className="bg-gray-800/70 border-gray-700 text-white hover:border-gray-600 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem
                                value="default"
                                className="focus:bg-teal-500/20"
                              >
                                默认
                              </SelectItem>
                              <SelectItem
                                value="dark"
                                className="focus:bg-teal-500/20"
                              >
                                暗黑
                              </SelectItem>
                              <SelectItem
                                value="light"
                                className="focus:bg-teal-500/20"
                              >
                                明亮
                              </SelectItem>
                              <SelectItem
                                value="blue"
                                className="focus:bg-teal-500/20"
                              >
                                蓝色
                              </SelectItem>
                              <SelectItem
                                value="green"
                                className="focus:bg-teal-500/20"
                              >
                                绿色
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 预设管理 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-4 border-t border-gray-800"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      className="w-1 h-5 bg-amber-500"
                      layoutId="settingHighlight"
                      transition={{ duration: 0.3 }}
                    />
                    <h3 className="text-md font-medium">预设管理</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 pl-3">
                    <Select
                      value={selectedPreset || ""}
                      onValueChange={handleLoadPreset}
                    >
                      <SelectTrigger className="bg-gray-800/70 border-gray-700 text-white hover:border-gray-600 transition-colors">
                        <SelectValue placeholder="选择预设" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-60">
                        {presets.length === 0 ? (
                          <div className="p-2 text-sm text-gray-400 text-center">
                            暂无预设
                          </div>
                        ) : (
                          presets.map((preset) => (
                            <SelectItem
                              key={preset.name}
                              value={preset.name}
                              className="focus:bg-teal-500/20"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{preset.name}</span>
                                <span className="text-xs text-gray-400">
                                  {preset.settings.createdAt.toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button
                        onClick={handleSavePreset}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        保存当前为预设
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* 显示当前进度条 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 pt-4 border-t border-gray-800"
                >
                  <Label className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                    <Activity className="w-3.5 h-3.5" />
                    当前进度
                  </Label>
                  <div className="relative">
                    <progress
                      className="w-full h-2 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-teal-500 [&::-moz-progress-bar]:bg-teal-500"
                      value={currentProgress}
                      max={100}
                    />
                    <AnimatePresence>
                      {currentProgress > 0 && currentProgress < 100 && (
                        <motion.div
                          className="absolute h-2 bg-white/30 w-1 top-0 rounded-full"
                          initial={{ left: "0%" }}
                          animate={{
                            left: [
                              `${Math.max(0, currentProgress - 3)}%`,
                              `${Math.min(100, currentProgress + 3)}%`,
                            ],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">0%</span>
                    <motion.span
                      className="text-xs font-medium"
                      style={{
                        color: `hsl(${
                          Math.min(currentProgress, 100) * 1.2
                        }, 70%, 60%)`,
                      }}
                    >
                      {currentProgress}%
                    </motion.span>
                    <span className="text-xs text-gray-400">100%</span>
                  </div>
                </motion.div>

                {/* 显示Store错误（storeErrors） */}
                <AnimatePresence>
                  {storeErrors && Object.keys(storeErrors).length > 0 && (
                    <motion.div
                      className="mt-2 p-3 bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-700/50 text-white rounded-lg"
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2 text-red-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">错误信息</span>
                      </div>
                      {Object.entries(storeErrors).map(([key, msg]) => (
                        <motion.div
                          key={key}
                          className="text-sm mb-1 last:mb-0 pl-6"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring" }}
                        >
                          <span className="text-red-300">{key}:</span> {msg}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* 底部工具栏 */}
          <div className="border-t border-gray-800 p-2 bg-gray-900/90 backdrop-blur-sm">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSave}
                    disabled={isRunning}
                    className="bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg"
                    size="sm"
                  >
                    {state.isSaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mr-2"
                      >
                        <Loader2 className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className="mr-2"
                      >
                        <Save className="h-4 w-4" />
                      </motion.div>
                    )}
                    保存
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={resetSettings}
                    variant="destructive"
                    size="sm"
                    className="text-white hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
                  >
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                      className="mr-2"
                    >
                      <X className="h-4 w-4" />
                    </motion.div>
                    重置
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={isRunning ? "ghost" : "outline"}
                          size="sm"
                          onClick={startSequence}
                          disabled={isRunning}
                          className={
                            isRunning
                              ? ""
                              : "bg-green-600/10 text-green-400 border-green-500/30 hover:bg-green-600/20"
                          }
                        >
                          <motion.div
                            animate={!isRunning ? { x: [0, 2, 0] } : {}}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatType: "mirror",
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top">开始执行</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={!isRunning ? "ghost" : "outline"}
                          size="sm"
                          onClick={pauseSequence}
                          disabled={!isRunning}
                          className={
                            !isRunning
                              ? ""
                              : "bg-amber-600/10 text-amber-400 border-amber-500/30 hover:bg-amber-600/20"
                          }
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top">暂停执行</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopSequence}
                          disabled={!isRunning}
                          className={
                            !isRunning
                              ? ""
                              : "hover:bg-red-600/10 hover:text-red-400"
                          }
                        >
                          <StopCircle className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top">停止执行</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
