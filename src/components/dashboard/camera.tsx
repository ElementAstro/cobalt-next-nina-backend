"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useCameraStore } from "@/stores/cameraStore";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera as CameraIcon,
  Power,
  ThermometerSnowflake,
  RefreshCw,
  PlayCircle,
  StopCircle,
  Settings2,
  Activity,
  ChevronRight,
  CheckCircle2,
  Database,
  Sun,
  Aperture,
  Monitor,
  AlertCircle,
  Scale,
  Binary,
  Gauge,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CameraPage() {
  const camera = useCameraStore();
  const [isLandscape, setIsLandscape] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const startRefreshing = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    const interval = setInterval(async () => {
      await camera.fetchStatus();
      if (camera.isConnected && camera.name) {
        clearInterval(interval);
        setRefreshInterval(null);
        toast.success(`成功连接到相机: ${camera.name}`);
      }
    }, 1000);
    setRefreshInterval(interval);
  }, [camera, refreshInterval]);

  const handleResize = useCallback(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      handleResize();
      const container = document.querySelector(".container");
      if (container) {
        if (window.innerWidth > window.innerHeight) {
          container.classList.add("landscape");
        } else {
          container.classList.remove("landscape");
        }
      }
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleResize]);

  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  useEffect(() => {
    camera.fetchStatus();
    const interval = setInterval(() => {
      const newTemp = camera.temperature + (Math.random() - 0.5) * 0.1;
      camera.setTemperature(newTemp, 0); // 假设 minutes 参数为 0
      camera.temperatureHistory.push({
        time: new Date().toLocaleTimeString(),
        temperature: newTemp,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [camera]);

  const handleCalibration = async () => {
    setIsCalibrating(true);
    setCalibrationProgress(0);

    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCalibrationProgress(i);
      }

      toast.success("相机参数已成功校准");
    } catch {
      toast.error("请检查相机连接并重试");
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleExposureChange = async (value: number) => {
    try {
      await camera.setExposure(value);
    } catch {
      toast.error("无法更新曝光时间");
    }
  };

  const handleCoolingToggle = async () => {
    try {
      await camera.setCooler(!camera.coolerOn);
    } catch {
      toast.error("无法切换制冷状态");
    }
  };

  const handleGainChange = async (value: number) => {
    try {
      await camera.setGain(value);
    } catch {
      toast.error("无法更新增益");
    }
  };

  const handleBinningChange = async (value: string) => {
    try {
      await camera.setBinning(value);
    } catch {
      toast.error("无法更新像素合并");
    }
  };

  const handleTemperatureChange = async (value: number) => {
    try {
      await camera.setTemperature(value, 0);
    } catch {
      toast.error("无法更新目标温度");
    }
  };

  const handleReadoutModeChange = async (value: string) => {
    try {
      await camera.setReadoutMode(parseInt(value));
    } catch {
      toast.error("无法更新读出模式");
    }
  };

  const handleConnect = async () => {
    try {
      await camera.connect();
      startRefreshing();
    } catch {
      toast.error("无法连接到相机");
    }
  };

  const handleDisconnect = async () => {
    try {
      await camera.disconnect();
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } catch {
      toast.error("无法断开相机连接");
    }
  };

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  return (
    <motion.div
      className={cn(
        "container mx-auto p-4 h-[calc(100vh-4rem)]",
        "flex flex-col gap-4",
        isLandscape ? "landscape-mode" : ""
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">相机控制</h2>
        <Button
          variant={camera.isConnected ? "destructive" : "default"}
          onClick={camera.isConnected ? handleDisconnect : handleConnect}
        >
          {camera.isConnected ? "断开连接" : "连接"}
        </Button>
      </div>
      <div
        className={cn(
          "flex-1 grid gap-4 overflow-hidden",
          "grid-cols-1" // 始终保持单列
        )}
      >
        {/* Camera Status Panel */}
        <Card className="overflow-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CameraIcon className="h-6 w-6 animate-pulse" />
              相机状态
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
                  variant={camera.isConnected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {camera.isConnected ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {camera.isConnected ? "已连接" : "未连接"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  录制状态
                </Label>
                <Badge
                  variant={camera.isRecording ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {camera.isRecording ? (
                    <Activity className="w-3 h-3 animate-pulse" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                  {camera.isRecording ? "录制中" : "停止"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ThermometerSnowflake className="w-4 h-4" />
                  制冷状态
                </Label>
                <Badge
                  variant={camera.coolerOn ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {camera.coolerOn ? (
                    <Activity className="w-3 h-3 animate-pulse" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                  {camera.coolerOn ? "制冷中" : "关闭"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>当前温度</Label>
                <Label className="font-mono">
                  {camera.temperature.toFixed(1)}°C
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>目标温度</Label>
                <Label className="font-mono">
                  {camera.targetTemperature}°C
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>制冷功率</Label>
                <Label className="font-mono">{camera.coolerPower}%</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>曝光时间</Label>
                <Label className="font-mono">{camera.exposure}秒</Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>增益</Label>
                <Label className="font-mono">{camera.gain}</Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>ISO</Label>
                <Label className="font-mono">{camera.gain}</Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>偏置</Label>
                <Label className="font-mono">{camera.offset}</Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>像素合并</Label>
                <Label className="font-mono">
                  {camera.binning.x}x{camera.binning.y}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>读出模式</Label>
                <Badge variant="outline">{camera.readoutMode}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => camera.capture({})}
                disabled={!camera.isConnected}
              >
                {camera.isRecording ? (
                  <>
                    <StopCircle className="w-4 h-4 animate-spin" />
                    停止曝光
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    开始曝光
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Camera Control Panel */}
        <Card className="overflow-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                相机控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="exposure" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  {" "}
                  {/* 修改为单列 */}
                  <TabsTrigger value="exposure">曝光</TabsTrigger>
                  <TabsTrigger value="cooling">制冷</TabsTrigger>
                  <TabsTrigger value="image">图像</TabsTrigger>
                  <TabsTrigger value="advanced">高级</TabsTrigger>
                </TabsList>

                <TabsContent value="exposure">
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          曝光时间 (秒)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[camera.exposure]}
                            onValueChange={([v]) => handleExposureChange(v)}
                            min={camera.exposureMin}
                            max={camera.exposureMax}
                            step={0.001}
                            disabled={!camera.isConnected}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={camera.exposure}
                            onChange={(e) =>
                              handleExposureChange(parseFloat(e.target.value))
                            }
                            className="w-24"
                            disabled={!camera.isConnected}
                          />
                        </div>
                      </div>

                      {camera.canSetGain && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Aperture className="w-4 h-4" />
                            增益
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[camera.gain]}
                              onValueChange={([v]) => handleGainChange(v)}
                              min={camera.gainMin}
                              max={camera.gainMax}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={camera.gain}
                              onChange={(e) =>
                                handleGainChange(parseFloat(e.target.value))
                              }
                              className="w-24"
                            />
                          </div>
                        </div>
                      )}

                      {camera.gains && camera.gains.length > 0 && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Gauge className="w-4 h-4" />
                            ISO
                          </Label>
                          <Select
                            value={camera.gain.toString()}
                            onValueChange={(v) =>
                              handleGainChange(parseFloat(v))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {camera.gains.map((gain, index) => (
                                <SelectItem
                                  key={index}
                                  value={gain?.toString() ?? ""}
                                >
                                  ISO {gain}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {camera.canSetOffset && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Scale className="w-4 h-4" />
                            偏置
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[camera.offset]}
                              onValueChange={([v]) => camera.setOffset(v)}
                              min={camera.offsetMin}
                              max={camera.offsetMax}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={camera.offset}
                              onChange={(e) =>
                                camera.setOffset(parseFloat(e.target.value))
                              }
                              className="w-24"
                            />
                          </div>
                        </div>
                      )}

                      {camera.binningModes &&
                        camera.binningModes.length > 0 && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Binary className="w-4 h-4" />
                              像素合并
                            </Label>
                            <Select
                              value={`${camera.binning.x}x${camera.binning.y}`}
                              onValueChange={(v) => handleBinningChange(v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {camera.binningModes.map((mode) => (
                                  <SelectItem
                                    key={`${mode.X}x${mode.Y}`}
                                    value={`${mode.X}x${mode.Y}`}
                                  >
                                    {mode.X}x{mode.Y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="cooling">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>制冷开关</Label>
                      <Switch
                        checked={camera.coolerOn}
                        onCheckedChange={handleCoolingToggle}
                      />
                    </div>

                    {camera.canSetTemperature && (
                      <div className="space-y-2">
                        <Label>目标温度 (°C)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[camera.targetTemperature]}
                            onValueChange={([v]) => handleTemperatureChange(v)}
                            min={-30}
                            max={20}
                            step={0.1}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={camera.targetTemperature}
                            onChange={(e) =>
                              handleTemperatureChange(
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="advanced">
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>校准设置</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>自动校准</Label>
                            <Button
                              onClick={handleCalibration}
                              disabled={isCalibrating || !camera.isConnected}
                            >
                              {isCalibrating ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Settings2 className="w-4 h-4 mr-2" />
                              )}
                              {isCalibrating ? "校准中..." : "开始校准"}
                            </Button>
                          </div>
                          {isCalibrating && (
                            <Progress
                              value={calibrationProgress}
                              className="w-full"
                            />
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>高级参数</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowAdvancedDialog(true)}
                          >
                            更多设置
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <AlertDialog
                      open={showAdvancedDialog}
                      onOpenChange={setShowAdvancedDialog}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>高级相机设置</AlertDialogTitle>
                          <AlertDialogDescription>
                            请谨慎调整以下参数，不当的设置可能会影响图像质量。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                          <ScrollArea className="h-[300px] rounded-md border p-4">
                            <div className="space-y-4">
                              {camera.readoutModes &&
                                camera.readoutModes.length > 0 && (
                                  <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                      <Monitor className="w-4 h-4" />
                                      读出模式
                                    </Label>
                                    <Select
                                      value={camera.readoutMode.toString()}
                                      onValueChange={(value) =>
                                        handleReadoutModeChange(value)
                                      }
                                    >
                                      <SelectTrigger className="flex items-center gap-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {camera.readoutModes.map(
                                          (mode, index) => (
                                            <SelectItem
                                              key={index}
                                              value={index.toString()}
                                            >
                                              <span className="flex items-center gap-2">
                                                {mode}
                                              </span>
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              {camera.canSetUSBLimit && (
                                <div className="space-y-2">
                                  <Label>USB 带宽</Label>
                                  <Slider
                                    value={[camera.usbLimit]}
                                    onValueChange={([v]) =>
                                      camera.setUSBLimit(v)
                                    }
                                    min={camera.usbLimitMin}
                                    max={camera.usbLimitMax}
                                    step={1}
                                  />
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction>保存设置</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </motion.div>
        </Card>
      </div>

      {/* Advanced Settings Dialog */}
      <AlertDialog
        open={showAdvancedDialog}
        onOpenChange={setShowAdvancedDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>高级相机设置</AlertDialogTitle>
            <AlertDialogDescription>
              请谨慎调整以下参数，不当的设置可能会影响图像质量。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {camera.readoutModes && camera.readoutModes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      读出模式
                    </Label>
                    <Select
                      value={camera.readoutMode.toString()}
                      onValueChange={(value) => handleReadoutModeChange(value)}
                    >
                      <SelectTrigger className="flex items-center gap-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {camera.readoutModes.map((mode, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            <span className="flex items-center gap-2">
                              {mode}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {camera.canSetUSBLimit && (
                  <div className="space-y-2">
                    <Label>USB 带宽</Label>
                    <Slider
                      value={[camera.usbLimit]}
                      onValueChange={([v]) => camera.setUSBLimit(v)}
                      min={camera.usbLimitMin}
                      max={camera.usbLimitMax}
                      step={1}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>保存设置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
