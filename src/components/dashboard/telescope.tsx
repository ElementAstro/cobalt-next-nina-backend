"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Power,
  CheckCircle2,
  AlertCircle,
  Navigation,
  RefreshCw,
  Settings2,
  ChevronRight,
  Home,
  Crosshair,
} from "lucide-react";
import { useTelescopeStore } from "@/stores/telescopeStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function TelescopePage() {
  const telescope = useTelescopeStore();
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [rightAscension, setRightAscension] = useState(0);
  const [declination, setDeclination] = useState(0);

  useEffect(() => {
    telescope.getTelescopeInfo();
  }, [telescope]);

  const handleConnect = async () => {
    try {
      await telescope.connect();
      toast.success("连接成功", {
        description: "已成功连接到望远镜",
      });
    } catch (error: unknown) {
      let message = "无法连接到望远镜";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("连接失败", {
        description: message,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await telescope.disconnect();
      toast.success("断开连接成功", {
        description: "已成功断开与望远镜的连接",
      });
    } catch (error: unknown) {
      let message = "无法断开与望远镜的连接";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("断开连接失败", {
        description: message,
      });
    }
  };

  const handleSlewToCoordinates = async () => {
    try {
      await telescope.slewToCoordinates(rightAscension, declination);
      toast.success("开始移动", {
        description: `正在移动到 RA: ${rightAscension}, DEC: ${declination}`,
      });
    } catch (error: unknown) {
      let message = "无法移动到指定坐标";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("移动失败", {
        description: message,
      });
    }
  };

  const handleSyncToCoordinates = async () => {
    try {
      await telescope.syncToCoordinates(rightAscension, declination);
      toast.success("同步成功", {
        description: `已同步到 RA: ${rightAscension}, DEC: ${declination}`,
      });
    } catch (error: unknown) {
      let message = "无法同步到指定坐标";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("同步失败", {
        description: message,
      });
    }
  };

  const handlePark = async () => {
    try {
      await telescope.park();
      toast.success("成功停泊", {
        description: "望远镜已停泊",
      });
    } catch (error: unknown) {
      let message = "无法停泊望远镜";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("停泊失败", {
        description: message,
      });
    }
  };

  const handleFindHome = async () => {
    try {
      await telescope.findHome();
      toast.success("成功寻星", {
        description: "望远镜已找到 Home",
      });
    } catch (error: unknown) {
      let message = "无法找到 Home";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("寻星失败", {
        description: message,
      });
    }
  };

  const handleSetTracking = async (tracking: boolean) => {
    try {
      await telescope.setTracking(tracking);
      toast.success(tracking ? "开始跟踪" : "停止跟踪", {
        description: `跟踪状态已设置为 ${tracking ? "开启" : "关闭"}`,
      });
    } catch (error: unknown) {
      let message = "无法设置跟踪状态";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("设置跟踪失败", {
        description: message,
      });
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 h-full flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Connection status and title */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">望远镜控制</h2>
        <Button
          variant={telescope.isConnected ? "destructive" : "default"}
          onClick={telescope.isConnected ? handleDisconnect : handleConnect}
          disabled={telescope.isLoading}
        >
          {telescope.isLoading && (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          )}
          {telescope.isConnected ? "断开连接" : "连接"}
        </Button>
      </div>

      {/* Telescope Status Panel */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-6 w-6 animate-pulse" />
            望远镜状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Power className="w-4 h-4" />
                连接状态
              </Label>
              <Badge
                variant={telescope.isConnected ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {telescope.isConnected ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {telescope.isConnected ? "已连接" : "未连接"}
              </Badge>
            </div>
          </div>

          <Separator />

          {telescope.telescopeInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>赤经 (RA)</Label>
                <Label className="font-mono">
                  {telescope.telescopeInfo.RightAscension.toFixed(4)}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>赤纬 (DEC)</Label>
                <Label className="font-mono">
                  {telescope.telescopeInfo.Declination.toFixed(4)}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>方位角 (AZ)</Label>
                <Label className="font-mono">
                  {telescope.telescopeInfo.Azimuth.toFixed(4)}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>高度角 (ALT)</Label>
                <Label className="font-mono">
                  {telescope.telescopeInfo.Altitude.toFixed(4)}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>跟踪</Label>
                <Badge
                  variant={
                    telescope.telescopeInfo.IsTracking ? "default" : "secondary"
                  }
                >
                  {telescope.telescopeInfo.IsTracking ? "开启" : "关闭"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>停泊状态</Label>
                <Badge
                  variant={
                    telescope.telescopeInfo.AtPark ? "default" : "secondary"
                  }
                >
                  {telescope.telescopeInfo.AtPark ? "已停泊" : "未停泊"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telescope Control Panel */}
      <Card className="w-full">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              望远镜控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>赤经 (RA)</Label>
                <Input
                  type="number"
                  value={rightAscension}
                  onChange={(e) =>
                    setRightAscension(parseFloat(e.target.value))
                  }
                  disabled={!telescope.isConnected}
                />
              </div>
              <div className="space-y-2">
                <Label>赤纬 (DEC)</Label>
                <Input
                  type="number"
                  value={declination}
                  onChange={(e) => setDeclination(parseFloat(e.target.value))}
                  disabled={!telescope.isConnected}
                />
              </div>

              <Button
                onClick={handleSlewToCoordinates}
                disabled={!telescope.isConnected}
                className="w-full"
              >
                <Crosshair className="w-4 h-4 mr-2" />
                移动到坐标
              </Button>
              <Button
                onClick={handleSyncToCoordinates}
                disabled={!telescope.isConnected}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                同步到坐标
              </Button>

              <Separator />

              <Button
                variant="secondary"
                onClick={handlePark}
                disabled={
                  !telescope.isConnected || !telescope.telescopeInfo?.CanPark
                }
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                停泊
              </Button>
              <Button
                variant="secondary"
                onClick={handleFindHome}
                disabled={
                  !telescope.isConnected ||
                  !telescope.telescopeInfo?.CanFindHome
                }
                className="w-full"
              >
                <Navigation className="w-4 h-4 mr-2" />
                寻星
              </Button>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>跟踪</Label>
                <Switch
                  checked={telescope.telescopeInfo?.IsTracking || false}
                  onCheckedChange={handleSetTracking}
                  disabled={
                    !telescope.isConnected ||
                    !telescope.telescopeInfo?.CanSetTracking
                  }
                />
              </div>

              <Separator />

              <AlertDialog
                open={showAdvancedDialog}
                onOpenChange={setShowAdvancedDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>高级望远镜设置</AlertDialogTitle>
                    <AlertDialogDescription>
                      请谨慎调整以下参数，不当的设置可能会影响观测效果。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>经度</Label>
                          <Input type="number" placeholder="经度" />
                        </div>
                        <div className="space-y-2">
                          <Label>纬度</Label>
                          <Input type="number" placeholder="纬度" />
                        </div>
                        <div className="space-y-2">
                          <Label>时区</Label>
                          <Input type="number" placeholder="时区" />
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction>保存设置</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAdvancedDialog(true)}
              >
                更多设置
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}
