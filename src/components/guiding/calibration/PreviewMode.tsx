"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Focus,
  PlusCircle,
  MinusCircle,
  Crosshair,
  RotateCw,
  ZoomIn,
  VideoOff,
  Pause,
  Play,
  Thermometer,
  ToggleLeft
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";
import { Switch } from "@/components/ui/switch";

export default function PreviewMode() {
  const { toast } = useToast();
  const { exposure, setExposure, gain, setGain } = useCalibrationStore();

  const [isLive, setIsLive] = useState(false);
  const [focusPosition, setFocusPosition] = useState(5000);
  const [focusMode, setFocusMode] = useState<"manual" | "auto">("manual");
  const [selectedStar, setSelectedStar] = useState<{ x: number; y: number } | null>(null);
  const [imageStats, setImageStats] = useState({
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    noise: 0,
  });
  const [cameraTemp, setCameraTemp] = useState(15.5);
  const [coolingEnabled, setCoolingEnabled] = useState(false);
  const [targetTemp, setTargetTemp] = useState(0);
  const [histogram, setHistogram] = useState<number[]>([]);
  const [focusMetrics, setFocusMetrics] = useState<number[]>([]);
  const [autoStretch, setAutoStretch] = useState(true);
  const [previewScale, setPreviewScale] = useState(1);

  // 模拟实时图像更新
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      // 更新直方图数据
      setHistogram(
        Array(256)
          .fill(0)
          .map(() => Math.random() * 100)
      );

      // 更新图像统计数据
      setImageStats({
        brightness: Math.random() * 100,
        contrast: Math.random() * 100,
        sharpness: Math.random() * 100,
        noise: Math.random() * 100,
      });

      // 更新对焦指标
      setFocusMetrics((prev) => {
        const newValue = prev[prev.length - 1] || 50;
        const nextValue = Math.max(0, Math.min(100, newValue + (Math.random() - 0.5) * 10));
        return [...prev.slice(-19), nextValue];
      });

      // 更新温度
      if (coolingEnabled) {
        setCameraTemp((prev) => {
          const diff = targetTemp - prev;
          return prev + (diff * 0.1);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, coolingEnabled, targetTemp]);

  const toggleLiveView = () => {
    setIsLive(!isLive);
    toast({
      title: isLive ? "已停止实时预览" : "已开启实时预览",
      description: isLive ? "相机已停止采集" : "相机开始采集图像",
    });
  };

  const handleAutoFocus = async () => {
    if (!selectedStar) {
      toast({
        variant: "destructive",
        title: "未选择对焦星",
        description: "请先选择一颗合适的对焦星",
      });
      return;
    }

    setFocusMode("auto");
    
    // 模拟自动对焦过程
    const steps = 10;
    const initialPosition = focusPosition;
    const searchRange = 2000;
    
    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newPosition = initialPosition + (Math.random() - 0.5) * searchRange;
      setFocusPosition(newPosition);
      
      // 更新对焦指标
      setFocusMetrics((prev) => {
        const value = 50 + Math.sin(i / steps * Math.PI) * 40;
        return [...prev.slice(-19), value];
      });
    }

    setFocusMode("manual");
    
    toast({
      title: "自动对焦完成",
      description: "已找到最佳对焦位置",
    });
  };

  const handleStarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectedStar({ x, y });
  };

  const handleFocusStep = (direction: "in" | "out") => {
    const step = direction === "in" ? 100 : -100;
    setFocusPosition((prev) => Math.max(0, Math.min(10000, prev + step)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 主预览区域 */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-gray-700 bg-gray-800/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" />
                实时预览
              </CardTitle>
              <Badge variant={isLive ? "default" : "secondary"}>
                {isLive ? "采集中" : "已停止"}
              </Badge>
            </div>
            <CardDescription className="text-xs flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              相机温度: {cameraTemp.toFixed(1)}°C
              {coolingEnabled && (
                <span className="text-blue-400">
                  (目标: {targetTemp}°C)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AspectRatio
              ratio={16 / 9}
              className="bg-gray-900 rounded-lg overflow-hidden relative"
              onClick={handleStarClick}
              style={{ transform: `scale(${previewScale})` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {!isLive && <VideoOff className="w-8 h-8 text-gray-500" />}
              </div>
              {selectedStar && (
                <motion.div
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute"
                  style={{
                    left: `${selectedStar.x}%`,
                    top: `${selectedStar.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Crosshair className="w-6 h-6 text-yellow-500" />
                </motion.div>
              )}
            </AspectRatio>

            {/* 预览控制按钮组 */}
            <div className="flex justify-between mt-4">
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLive ? "destructive" : "default"}
                        size="sm"
                        onClick={toggleLiveView}
                      >
                        {isLive ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            停止
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            开始
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isLive ? "停止预览" : "开始预览"}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewScale(1)}
                      >
                        <ZoomIn className="w-4 h-4 mr-1" />
                        重置缩放
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>重置图像缩放</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoStretch(!autoStretch)}
                      >
                        <ToggleLeft className="w-4 h-4 mr-1" />
                        自动拉伸
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>切换自动拉伸</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAutoFocus()}
                        disabled={!selectedStar || focusMode === "auto"}
                      >
                        {focusMode === "auto" ? (
                          <RotateCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Focus className="w-4 h-4 mr-1" />
                        )}
                        自动对焦
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>开始自动对焦</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* 对焦曲线 */}
        <Card className="border-gray-700 bg-gray-800/90">
          <CardHeader>
            <CardTitle className="text-sm">对焦曲线</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {focusMetrics.map((value, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-primary/50"
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 控制面板 */}
      <div className="space-y-4">
        <Card className="border-gray-700 bg-gray-800/90">
          <CardHeader>
            <CardTitle className="text-sm">图像控制</CardTitle>
            <CardDescription className="text-xs">
              调整曝光和增益参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>曝光时间 (ms)</Label>
                <Badge variant="outline" className="font-mono">
                  {exposure}
                </Badge>
              </div>
              <Slider
                value={[exposure]}
                min={100}
                max={10000}
                step={100}
                onValueChange={([value]) => setExposure(value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>增益</Label>
                <Badge variant="outline" className="font-mono">
                  {gain}
                </Badge>
              </div>
              <Slider
                value={[gain]}
                min={0}
                max={500}
                step={1}
                onValueChange={([value]) => setGain(value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>制冷</Label>
                <Switch
                  checked={coolingEnabled}
                  onCheckedChange={setCoolingEnabled}
                />
              </div>
              {coolingEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pt-2"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>目标温度</Label>
                      <Badge variant="outline" className="font-mono">
                        {targetTemp}°C
                      </Badge>
                    </div>
                    <Slider
                      value={[targetTemp]}
                      min={-20}
                      max={20}
                      step={1}
                      onValueChange={([value]) => setTargetTemp(value)}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="pt-2">
              <Select
                value={focusMode}
                onValueChange={(value: "manual" | "auto") => setFocusMode(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择对焦模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动对焦</SelectItem>
                  <SelectItem value="auto">自动对焦</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>对焦位置</Label>
                <Badge variant="outline" className="font-mono">
                  {focusPosition.toFixed(0)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleFocusStep("out")}
                >
                  <MinusCircle className="w-4 h-4" />
                </Button>
                <Slider
                  value={[focusPosition]}
                  min={0}
                  max={10000}
                  step={1}
                  onValueChange={([value]) => setFocusPosition(value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleFocusStep("in")}
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 图像统计信息 */}
        <Card className="border-gray-700 bg-gray-800/90">
          <CardHeader>
            <CardTitle className="text-sm">图像统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400">亮度</div>
                <div className="text-lg font-semibold">
                  {imageStats.brightness.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">对比度</div>
                <div className="text-lg font-semibold">
                  {imageStats.contrast.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">锐度</div>
                <div className="text-lg font-semibold">
                  {imageStats.sharpness.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">噪点</div>
                <div className="text-lg font-semibold">
                  {imageStats.noise.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 直方图 */}
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-2">直方图</div>
              <div className="h-24 flex items-end gap-px">
                <AnimatePresence mode="wait">
                  {histogram.map((value, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 bg-gray-600"
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
