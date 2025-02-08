"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Clipboard,
  KeyRound,
  Power,
  PowerOff,
  RefreshCw,
  Activity,
  Keyboard,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  orientation?: "horizontal" | "vertical";
  enableAnimation: boolean;
  showPerformanceStats: boolean;
  onTogglePerformanceStats: (checked: boolean) => void;
  customKeys: { label: string; keys: string[] }[];
  onSendCustomKeys: (keys: string[]) => void;
  layout: "compact" | "full";
  latency: number;
  frameRate: number;
  bandwidth: number;
  connectionQuality: "good" | "fair" | "poor";
}

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
  customKeys = [],
  onSendCustomKeys,
  layout = "full",
  latency,
  frameRate,
  bandwidth,
}) => {
  const statsVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  };

  return (
    <Card
      className={cn("shadow-none border-none bg-transparent", {
        "p-6": layout === "full",
        "p-3": layout === "compact",
      })}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold">远程控制面板</CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={isConnected ? disconnectFromVNC : connectToVNC}
              variant={isConnected ? "destructive" : "default"}
              className="w-full h-10"
            >
              {isConnected ? "断开连接" : "连接"}
            </Button>
            <Button onClick={toggleFullscreen} className="w-full h-10">
              <Expand className="h-4 w-4 mr-2" />
              全屏
            </Button>
          </div>
          {hasPowerCapability && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10">
                  <Power className="h-4 w-4 mr-2" />
                  电源控制
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={onShutdown}>
                  <PowerOff className="h-4 w-4 mr-2" />
                  关机
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReboot}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重启
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReset}>
                  <Power className="h-4 w-4 mr-2" />
                  强制重置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Clipboard className="h-4 w-4" />
                <span className="text-sm">剪贴板</span>
              </div>
              <Switch
                checked={clipboardSync}
                onCheckedChange={handleClipboardSync}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <KeyRound className="h-4 w-4" />
                <span className="text-sm">只读模式</span>
              </div>
              <Switch
                checked={viewOnly}
                onCheckedChange={handleViewOnlyChange}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Select onValueChange={handleColorDepthChange} value={colorDepth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="颜色深度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24-bit</SelectItem>
                <SelectItem value="16">16-bit</SelectItem>
                <SelectItem value="8">8-bit</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-between items-center p-2 rounded-lg bg-background/20">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">性能监控</span>
              </div>
              <Switch
                checked={showPerformanceStats}
                onCheckedChange={onTogglePerformanceStats}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-2">
          {customKeys.map((key, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSendCustomKeys(key.keys)}
              className="h-10"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              {key.label}
            </Button>
          ))}
        </div>

        <Collapsible
          open={showPerformanceStats}
          onOpenChange={onTogglePerformanceStats}
        >
          <CollapsibleTrigger asChild>
            <div className="flex justify-between items-center p-2 rounded-lg bg-background/20 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">性能监控</span>
              </div>
              <Switch
                checked={showPerformanceStats}
                onCheckedChange={onTogglePerformanceStats}
              />
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              variants={statsVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/20 p-4 rounded-lg mt-2"
            >
              <motion.div
                className="stat-item p-3 rounded-lg bg-background/30"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label className="text-sm font-medium">延迟</Label>
                <p
                  className={cn(
                    "stat-value text-lg font-semibold mt-1",
                    latency > 100 ? "text-red-500" : "text-green-500"
                  )}
                >
                  {latency}ms
                </p>
              </motion.div>
              <motion.div
                className="stat-item p-3 rounded-lg bg-background/30"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label className="text-sm font-medium">帧率</Label>
                <p className="stat-value text-lg font-semibold mt-1">
                  {frameRate} FPS
                </p>
              </motion.div>
              <motion.div
                className="stat-item p-3 rounded-lg bg-background/30"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label className="text-sm font-medium">带宽</Label>
                <p className="stat-value text-lg font-semibold mt-1">
                  {(bandwidth / 1024 / 1024).toFixed(2)} Mbps
                </p>
              </motion.div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
