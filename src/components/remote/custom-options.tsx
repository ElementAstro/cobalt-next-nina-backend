"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Monitor,
  Mouse,
  Settings,
  Sliders,
  Smartphone,
  Wifi,
  Zap,
  Info,
  LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const OptionSwitch = ({
  label,
  checked,
  onChange,
  icon: Icon,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: LucideIcon;
  description?: string;
}) => (
  <TooltipProvider>
    <div className="flex items-center justify-between group">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <Label className="text-sm cursor-pointer">{label}</Label>
          </div>
        </TooltipTrigger>
        {description && (
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  </TooltipProvider>
);

const CustomOptions: React.FC<CustomOptionsProps> = (props) => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderPerformanceMode = () => {
    const modes = {
      quality: { label: "高质量", description: "优先图像质量" },
      balanced: { label: "平衡", description: "平衡质量和性能" },
      speed: { label: "高速", description: "优先连接速度" },
    };
    return (
      <Select
        value={props.performanceMode}
        onValueChange={props.setPerformanceMode}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择性能模式" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(modes) as Array<keyof typeof modes>).map((mode) => (
            <SelectItem key={mode} value={mode}>
              <div className="flex items-center justify-between">
                <span>{modes[mode].label}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {modes[mode].description}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderInputMode = () => (
    <div className="space-y-4">
      <Select value={props.inputMode} onValueChange={props.setInputMode}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择输入模式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mouse">鼠标模式</SelectItem>
          <SelectItem value="touch">触摸模式</SelectItem>
          <SelectItem value="trackpad">触控板模式</SelectItem>
        </SelectContent>
      </Select>

      <AnimatePresence mode="wait">
        {props.inputMode === "touch" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pl-4 border-l-2 border-primary/20"
          >
            <OptionSwitch
              label="启用手势"
              checked={props.gestureEnabled}
              onChange={props.setGestureEnabled}
              icon={Smartphone}
              description="允许使用触摸手势进行操作"
            />
            <div className="space-y-2">
              <Label className="text-sm">触摸灵敏度</Label>
              <Slider
                value={[props.touchSensitivity]}
                onValueChange={([value]) => props.setTouchSensitivity(value)}
                max={10}
                min={1}
                step={1}
                className="[&>div]:bg-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>低</span>
                <span>高</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "w-full bg-background/95 backdrop-blur-sm rounded-lg border border-gray-700/50",
        "shadow-xl"
      )}
    >
      <Tabs defaultValue="display" className="w-full">
        <TabsList
          className={cn(
            "w-full h-auto p-1 grid gap-1 bg-muted/50",
            isMobile ? "grid-cols-2" : "grid-cols-4"
          )}
        >
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>显示</span>
          </TabsTrigger>
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Mouse className="h-4 w-4" />
            <span>输入</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>性能</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>高级</span>
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-6">
          <TabsContent value="display" className="space-y-6">
            <div className="space-y-4">
              <OptionSwitch
                label="缩放以适应窗口"
                checked={props.scaleViewport}
                onChange={props.setScaleViewport}
                icon={Monitor}
                description="自动调整远程画面大小以适应窗口"
              />
              <OptionSwitch
                label="显示点状光标"
                checked={props.showDotCursor}
                onChange={props.setShowDotCursor}
                icon={Mouse}
                description="在远程桌面上显示点状光标"
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <Label className="text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                背景样式
              </Label>
              <Select
                value={props.background}
                onValueChange={props.setBackground}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择背景" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rgb(40, 40, 40)">深色</SelectItem>
                  <SelectItem value="rgb(70, 70, 70)">中性</SelectItem>
                  <SelectItem value="rgb(110, 110, 110)">浅色</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="input" className="space-y-6">
            <div className="space-y-4">
              {renderInputMode()}
              <Separator />
              <OptionSwitch
                label="启用触摸滚动"
                checked={props.touchScrolling}
                onChange={props.setTouchScrolling}
                icon={Smartphone}
                description="允许使用触摸手势进行滚动"
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                性能模式
              </Label>
              {renderPerformanceMode()}
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  图像质量
                </Label>
                <Slider
                  value={[props.qualityLevel]}
                  onValueChange={([value]) => props.setQualityLevel(value)}
                  max={9}
                  step={1}
                  className="[&>div]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>压缩</span>
                  <span>高清</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  压缩等级
                </Label>
                <Slider
                  value={[props.compressionLevel]}
                  onValueChange={([value]) => props.setCompressionLevel(value)}
                  max={9}
                  step={1}
                  className="[&>div]:bg-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>快速</span>
                  <span>高压</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <OptionSwitch
                label="自动重连"
                checked={props.autoReconnect}
                onChange={props.setAutoReconnect}
                icon={Wifi}
                description="断开连接时自动尝试重连"
              />
              {props.autoReconnect && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pl-4 border-l-2 border-primary/20"
                >
                  <Label className="text-sm">重连延迟 (秒)</Label>
                  <Slider
                    value={[props.reconnectDelay]}
                    onValueChange={([value]) => props.setReconnectDelay(value)}
                    min={1}
                    max={30}
                    step={1}
                    className="[&>div]:bg-primary"
                  />
                </motion.div>
              )}
              <Separator />
              <OptionSwitch
                label="启用键盘快捷键"
                checked={props.keyboardShortcuts}
                onChange={props.handleKeyboardShortcuts}
                icon={Settings}
                description="允许使用键盘快捷键"
              />
              <OptionSwitch
                label="自动调整分辨率"
                checked={props.resizeSession}
                onChange={props.setResizeSession}
                icon={Monitor}
                description="根据窗口大小自动调整远程分辨率"
              />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      <div className="p-4 bg-muted/30 border-t border-gray-700/50 rounded-b-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>提示：所有设置会立即生效并自动保存</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomOptions;
