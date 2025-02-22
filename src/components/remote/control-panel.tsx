"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Expand,
  Clipboard,
  KeyRound,
  Power,
  PowerOff,
  RefreshCw,
  Activity,
  Keyboard,
  Settings,
  ChevronRight,
  Gauge,
  MonitorSmartphone,
  Signal,
  LucideIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConnectButtonProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  status?: "good" | "fair" | "poor";
}

interface ControlPanelProps {
  isConnected: boolean;
  toggleFullscreen: () => void;
  connectToVNC: () => void;
  disconnectFromVNC: () => void;
  clipboardSync: boolean;
  handleClipboardSync: (checked: boolean) => void;
  viewOnly: boolean;
  handleViewOnlyChange: (checked: boolean) => void;
  colorDepth: string;
  handleColorDepthChange: (value: string) => void;
  hasPowerCapability: boolean;
  onShutdown: () => void;
  onReboot: () => void;
  onReset: () => void;
  showPerformanceStats: boolean;
  onTogglePerformanceStats: (checked: boolean) => void;
  customKeys: { label: string; keys: string[] }[];
  onSendCustomKeys: (keys: string[]) => void;
  latency: number;
  frameRate: number;
  bandwidth: number;
  connectionQuality: "good" | "fair" | "poor";
}

const ConnectButton: React.FC<ConnectButtonProps> = ({
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={isConnected ? onDisconnect : onConnect}
        variant={isConnected ? "destructive" : "default"}
        className="w-full relative overflow-hidden group"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Power className="h-4 w-4" />
          {isConnected ? "断开连接" : "连接"}
        </span>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-background/0 via-background/10 to-background/0"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </Button>
    </motion.div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  status,
}) => {
  const statusColor = {
    good: "text-green-500",
    fair: "text-yellow-500",
    poor: "text-red-500",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-lg bg-card/50 p-4 backdrop-blur-sm border border-gray-700/50"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className={cn("text-2xl font-bold", status && statusColor[status])}
          >
            {value}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          </p>
        </div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  isConnected,
  toggleFullscreen,
  connectToVNC,
  disconnectFromVNC,
  clipboardSync,
  handleClipboardSync,
  viewOnly,
  handleViewOnlyChange,
  colorDepth,
  handleColorDepthChange,
  hasPowerCapability,
  onShutdown,
  onReboot,
  onReset,
  showPerformanceStats,
  onTogglePerformanceStats,
  customKeys,
  onSendCustomKeys,
  latency,
  frameRate,
  bandwidth,
  connectionQuality,
}) => {
  const stats: StatCardProps[] = useMemo(
    () => [
      {
        icon: Signal,
        label: "延迟",
        value: latency,
        unit: "ms",
        status: latency > 100 ? "poor" : latency > 50 ? "fair" : "good",
      },
      {
        icon: Gauge,
        label: "帧率",
        value: frameRate,
        unit: "FPS",
        status: frameRate < 15 ? "poor" : frameRate < 30 ? "fair" : "good",
      },
      {
        icon: Activity,
        label: "带宽",
        value: Number((bandwidth / 1024 / 1024).toFixed(2)),
        unit: "Mbps",
        status: connectionQuality,
      },
    ],
    [latency, frameRate, bandwidth, connectionQuality]
  );

  return (
    <Card className="border-gray-700/50 bg-background/95 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">远程控制面板</CardTitle>
        <CardDescription>管理远程连接和控制选项</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <ConnectButton
            isConnected={isConnected}
            onConnect={connectToVNC}
            onDisconnect={disconnectFromVNC}
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              className="w-full"
            >
              <Expand className="h-4 w-4 mr-2" />
              全屏模式
            </Button>
          </motion.div>
        </div>

        <Separator className="bg-gray-700/50" />

        <div className="grid gap-4">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            基本设置
          </Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                <span className="text-sm">剪贴板同步</span>
              </div>
              <Switch
                checked={clipboardSync}
                onCheckedChange={handleClipboardSync}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <span className="text-sm">只读模式</span>
              </div>
              <Switch
                checked={viewOnly}
                onCheckedChange={handleViewOnlyChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="h-4 w-4" />
                <span className="text-sm">色彩深度</span>
              </div>
              <Select onValueChange={handleColorDepthChange} value={colorDepth}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="选择色彩深度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24位色彩</SelectItem>
                  <SelectItem value="16">16位色彩</SelectItem>
                  <SelectItem value="8">8位色彩</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {hasPowerCapability && (
          <>
            <Separator className="bg-gray-700/50" />
            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Power className="h-4 w-4" />
                电源控制
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={onShutdown}
                    className="w-full"
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    关机
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={onReboot}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重启
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <ChevronRight className="h-4 w-4" />
                        更多
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onReset}>
                        强制重启
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </div>
            </div>
          </>
        )}

        <Separator className="bg-gray-700/50" />

        <Collapsible
          open={showPerformanceStats}
          onOpenChange={onTogglePerformanceStats}
        >
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              性能监控
            </Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {showPerformanceStats ? "隐藏" : "显示"}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 mt-4"
            >
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {customKeys.length > 0 && (
          <>
            <Separator className="bg-gray-700/50" />
            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                快捷键
              </Label>
              <ScrollArea className="h-[120px] rounded-md border border-gray-700/50 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {customKeys.map((key, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendCustomKeys(key.keys)}
                        className="w-full justify-start"
                      >
                        <Keyboard className="h-4 w-4 mr-2" />
                        {key.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <div className="absolute bottom-4 right-4">
          <Badge
            variant="outline"
            className={cn(
              "transition-colors duration-500",
              connectionQuality === "good" && "border-green-500 text-green-500",
              connectionQuality === "fair" &&
                "border-yellow-500 text-yellow-500",
              connectionQuality === "poor" && "border-red-500 text-red-500"
            )}
          >
            {connectionQuality === "good" && "连接良好"}
            {connectionQuality === "fair" && "连接一般"}
            {connectionQuality === "poor" && "连接不佳"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
