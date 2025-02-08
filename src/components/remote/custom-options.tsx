"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "react-responsive";
import { motion } from "framer-motion";

interface CustomOptionsProps {
  keyboardShortcuts: boolean;
  handleKeyboardShortcuts: (checked: boolean) => void;
  theme: string;
  setTheme: (value: "light" | "dark") => void;
  scaleViewport: boolean;
  setScaleViewport: (checked: boolean) => void;
  clipViewport: boolean;
  setClipViewport: (checked: boolean) => void;
  dragViewport: boolean;
  setDragViewport: (checked: boolean) => void;
  resizeSession: boolean;
  setResizeSession: (checked: boolean) => void;
  showDotCursor: boolean;
  setShowDotCursor: (checked: boolean) => void;
  qualityLevel: number;
  setQualityLevel: (value: number) => void;
  compressionLevel: number;
  setCompressionLevel: (value: number) => void;
  background: string;
  setBackground: (value: string) => void;
  mobileMode?: boolean;
  touchScrolling: boolean;
  setTouchScrolling: (checked: boolean) => void;
  performanceMode: "quality" | "balanced" | "speed";
  setPerformanceMode: (value: "quality" | "balanced" | "speed") => void;
  inputMode: "touch" | "trackpad" | "mouse";
  setInputMode: (mode: "touch" | "trackpad" | "mouse") => void;
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
  touchSensitivity: number;
  setTouchSensitivity: (value: number) => void;
  autoReconnect: boolean;
  setAutoReconnect: (enabled: boolean) => void;
  reconnectDelay: number;
  setReconnectDelay: (value: number) => void;
}

const CustomOptions: React.FC<CustomOptionsProps> = (props) => {
  const {
    keyboardShortcuts,
    handleKeyboardShortcuts,
    theme,
    setTheme,
    scaleViewport,
    setScaleViewport,
    clipViewport,
    setClipViewport,
    dragViewport,
    setDragViewport,
    resizeSession,
    setResizeSession,
    showDotCursor,
    setShowDotCursor,
    qualityLevel,
    setQualityLevel,
    compressionLevel,
    setCompressionLevel,
    background,
    setBackground,
    touchScrolling,
    setTouchScrolling,
    performanceMode,
    setPerformanceMode,
    inputMode,
    setInputMode,
    gestureEnabled,
    setGestureEnabled,
    touchSensitivity,
    setTouchSensitivity,
    autoReconnect,
    setAutoReconnect,
    reconnectDelay,
    setReconnectDelay,
  } = props;

  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const containerAnimation = {
    initial: { opacity: 0, y: 25 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -25 },
    transition: { duration: 0.3 },
  };

  const tabsListClasses = isPortrait
    ? "flex flex-col gap-2 w-full border-b border-gray-700 pb-2 mb-4"
    : `grid gap-2 w-full ${
        isMobile ? "grid-cols-2" : "grid-cols-4"
      } border-b border-gray-700 pb-2 mb-4`;

  return (
    <motion.section
      {...containerAnimation}
      className={`w-full ${
        isPortrait ? "p-2" : "p-4"
      } bg-background text-foreground ${isLandscape ? "landscape-layout" : ""}`}
      aria-label="自定义选项设置"
    >
      <Tabs defaultValue="display" className="w-full">
        <TabsList className={tabsListClasses}>
          <TabsTrigger value="display" className="capitalize">
            显示
          </TabsTrigger>
          <TabsTrigger value="performance" className="capitalize">
            性能
          </TabsTrigger>
          <TabsTrigger value="controls" className="capitalize">
            控制
          </TabsTrigger>
          <TabsTrigger value="advanced" className="capitalize">
            高级
          </TabsTrigger>
        </TabsList>

        {/* Display Tab */}
        <TabsContent value="display" className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="scaleViewport" className="text-sm">
              缩放以适应窗口
            </Label>
            <Switch
              id="scaleViewport"
              checked={scaleViewport}
              onCheckedChange={setScaleViewport}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="clipViewport" className="text-sm">
              裁剪视口
            </Label>
            <Switch
              id="clipViewport"
              checked={clipViewport}
              onCheckedChange={setClipViewport}
            />
          </div>
          {clipViewport && (
            <div className="flex items-center justify-between">
              <Label htmlFor="dragViewport" className="text-sm">
                拖动视口
              </Label>
              <Switch
                id="dragViewport"
                checked={dragViewport}
                onCheckedChange={setDragViewport}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor="backgroundSelect" className="text-sm">
              背景样式
            </Label>
            <Select onValueChange={setBackground} value={background}>
              <SelectTrigger id="backgroundSelect" className="w-full">
                <SelectValue placeholder="选择背景" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rgb(40, 40, 40)">深灰色</SelectItem>
                <SelectItem value="rgb(70, 70, 70)">中灰色</SelectItem>
                <SelectItem value="rgb(110, 110, 110)">浅灰色</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="inputModeSelect" className="text-sm">
              输入模式
            </Label>
            <Select onValueChange={setInputMode} value={inputMode}>
              <SelectTrigger id="inputModeSelect" className="w-full">
                <SelectValue placeholder="选择输入模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="touch">触摸</SelectItem>
                <SelectItem value="trackpad">触控板</SelectItem>
                <SelectItem value="mouse">鼠标</SelectItem>
              </SelectContent>
            </Select>
            {inputMode === "touch" && (
              <div className="flex flex-col gap-2 pl-2 border-l border-gray-700">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gestureEnabled" className="text-sm">
                    启用手势
                  </Label>
                  <Switch
                    id="gestureEnabled"
                    checked={gestureEnabled}
                    onCheckedChange={setGestureEnabled}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="touchSensitivity" className="text-sm">
                    触摸灵敏度 ({touchSensitivity})
                  </Label>
                  <Slider
                    id="touchSensitivity"
                    min={1}
                    max={10}
                    step={1}
                    value={[touchSensitivity]}
                    onValueChange={([value]) => setTouchSensitivity(value)}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="qualityLevel" className="text-sm">
              图像质量 ({qualityLevel})
            </Label>
            <Slider
              id="qualityLevel"
              min={0}
              max={9}
              step={1}
              value={[qualityLevel]}
              onValueChange={([value]) => setQualityLevel(value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="compressionLevel" className="text-sm">
              压缩等级 ({compressionLevel})
            </Label>
            <Slider
              id="compressionLevel"
              min={0}
              max={9}
              step={1}
              value={[compressionLevel]}
              onValueChange={([value]) => setCompressionLevel(value)}
            />
          </div>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="touchScrolling" className="text-sm">
              触摸滚动
            </Label>
            <Switch
              id="touchScrolling"
              checked={touchScrolling}
              onCheckedChange={setTouchScrolling}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="performanceModeSelect" className="text-sm">
              性能模式
            </Label>
            <Select onValueChange={setPerformanceMode} value={performanceMode}>
              <SelectTrigger id="performanceModeSelect" className="w-full">
                <SelectValue placeholder="选择性能模式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality">高质量</SelectItem>
                <SelectItem value="balanced">平衡</SelectItem>
                <SelectItem value="speed">高速</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="resizeSession" className="text-sm">
              自动调整远程分辨率
            </Label>
            <Switch
              id="resizeSession"
              checked={resizeSession}
              onCheckedChange={setResizeSession}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showDotCursor" className="text-sm">
              显示点状光标
            </Label>
            <Switch
              id="showDotCursor"
              checked={showDotCursor}
              onCheckedChange={setShowDotCursor}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="keyboardShortcuts" className="text-sm">
              键盘快捷键
            </Label>
            <Switch
              id="keyboardShortcuts"
              checked={keyboardShortcuts}
              onCheckedChange={handleKeyboardShortcuts}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="themeSelect" className="text-sm">
              主题
            </Label>
            <Select
              onValueChange={(value) => setTheme(value as "light" | "dark")}
              value={theme}
            >
              <SelectTrigger id="themeSelect" className="w-full">
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">亮色</SelectItem>
                <SelectItem value="dark">暗色</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoReconnect" className="text-sm">
                自动重连
              </Label>
              <Switch
                id="autoReconnect"
                checked={autoReconnect}
                onCheckedChange={setAutoReconnect}
              />
            </div>
            {autoReconnect && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="reconnectDelay" className="text-sm">
                  重连延迟 (秒)
                </Label>
                <Slider
                  id="reconnectDelay"
                  min={1}
                  max={30}
                  step={1}
                  value={[reconnectDelay]}
                  onValueChange={([value]) => setReconnectDelay(value)}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};

export default CustomOptions;
