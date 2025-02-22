"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomColors, GuidePoint } from "@/types/guiding/guiding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeakChart } from "./peak-chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  FileJson,
  RotateCw,
  Maximize,
  Minimize,
  Eye,
  Crosshair,
  Move,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TargetDiagramProps {
  radius: number;
  currentPosition: GuidePoint;
  colors: CustomColors;
  animationSpeed: number;
  circleCount?: number;
  crosshairColor?: string;
  pointSize?: number;
  canvasSize?: { width: number; height: number };
  showStats?: boolean;
  enableExport?: boolean;
  showInfo?: boolean;
}

export function TargetDiagram({
  radius,
  currentPosition,
  colors,
  animationSpeed,
  circleCount = 3,
  crosshairColor = colors.secondary,
  pointSize = 4,
  canvasSize = { width: 300, height: 300 },
  showStats = true,
  enableExport = true,
  showInfo = true,
}: TargetDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({
    distance: 0,
    maxDeviation: 0,
    avgDeviation: 0,
  });
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const positionHistory = useRef<GuidePoint[]>([]);
  const [showReferencePoints, setShowReferencePoints] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 计算导星统计数据
  const calculateStats = useCallback(() => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    // 计算当前点到中心的距离
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - centerX, 2) +
        Math.pow(currentPosition.y - centerY, 2)
    );

    // 更新位置历史
    positionHistory.current.push(currentPosition);
    if (positionHistory.current.length > 100) {
      positionHistory.current.shift();
    }

    // 计算偏差
    const deviations = positionHistory.current.map((pos) =>
      Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2))
    );

    setStats({
      distance,
      maxDeviation: Math.max(...deviations),
      avgDeviation:
        deviations.reduce((a, b) => a + b, 0) / deviations.length || 0,
    });
  }, [canvasSize.width, canvasSize.height, currentPosition]);

  // 处理缩放
  const handleZoom = useCallback(
    (factor: number) => {
      setZoomLevel((prev) => {
        const newZoom = Math.max(0.5, Math.min(4, prev * factor));
        toast({
          title: "缩放更新",
          description: `缩放级别: ${newZoom.toFixed(1)}x`,
        });
        return newZoom;
      });
    },
    []
  );

  // 处理拖拽
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;

      e.preventDefault();
      const newOffset = {
        x: panOffset.x + (e.clientX - dragStart.x) / zoomLevel,
        y: panOffset.y + (e.clientY - dragStart.y) / zoomLevel,
      };

      setPanOffset(newOffset);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, panOffset, zoomLevel]
  );

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置高DPI支持
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    // 应用变换
    ctx.save();
    ctx.translate(
      canvasSize.width / 2 + panOffset.x,
      canvasSize.height / 2 + panOffset.y
    );
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-canvasSize.width / 2, -canvasSize.height / 2);

    // 绘制背景网格
    const gridSize = 20;
    ctx.strokeStyle = `${colors.secondary}20`;
    ctx.lineWidth = 0.5 / zoomLevel;
    for (let x = 0; x < canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // 绘制同心圆
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const time = Date.now() * 0.001 * animationSpeed;
    
    for (let i = 1; i <= circleCount; i++) {
      const currentRadius = (radius * i) / circleCount;
      const animatedRadius = currentRadius + Math.sin(time + i) * 2;

      // 绘制圆形
      ctx.beginPath();
      ctx.arc(centerX, centerY, animatedRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors.secondary}40`;
      ctx.lineWidth = 1 / zoomLevel;
      ctx.stroke();

      // 绘制刻度
      for (let angle = 0; angle < 360; angle += 30) {
        const radian = (angle * Math.PI) / 180;
        const markLength = angle % 90 === 0 ? 8 : 4;

        ctx.beginPath();
        ctx.moveTo(
          centerX + animatedRadius * Math.cos(radian),
          centerY + animatedRadius * Math.sin(radian)
        );
        ctx.lineTo(
          centerX + (animatedRadius - markLength) * Math.cos(radian),
          centerY + (animatedRadius - markLength) * Math.sin(radian)
        );
        ctx.strokeStyle = `${colors.secondary}80`;
        ctx.stroke();
      }
    }

    // 绘制历史轨迹
    if (showReferencePoints && positionHistory.current.length > 1) {
      ctx.beginPath();
      const first = positionHistory.current[0];
      ctx.moveTo(first.x, first.y);
      
      positionHistory.current.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.strokeStyle = `${colors.accent}40`;
      ctx.lineWidth = 1 / zoomLevel;
      ctx.stroke();
    }

    // 绘制当前位置
    ctx.beginPath();
    ctx.arc(
      currentPosition.x,
      currentPosition.y,
      pointSize / zoomLevel,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = colors.primary;
    ctx.fill();

    // 绘制参考线
    if (showMeasurements) {
      ctx.setLineDash([4 / zoomLevel, 4 / zoomLevel]);
      ctx.beginPath();
      ctx.moveTo(currentPosition.x, centerY);
      ctx.lineTo(currentPosition.x, currentPosition.y);
      ctx.moveTo(centerX, currentPosition.y);
      ctx.lineTo(currentPosition.x, currentPosition.y);
      ctx.strokeStyle = `${colors.accent}80`;
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制坐标值
      ctx.font = `${12 / zoomLevel}px monospace`;
      ctx.fillStyle = colors.text;
      ctx.fillText(
        `X: ${(currentPosition.x - centerX).toFixed(1)}`,
        currentPosition.x + 8 / zoomLevel,
        currentPosition.y - 8 / zoomLevel
      );
      ctx.fillText(
        `Y: ${(currentPosition.y - centerY).toFixed(1)}`,
        currentPosition.x + 8 / zoomLevel,
        currentPosition.y + 16 / zoomLevel
      );
    }

    // 绘制十字准线
    if (showCrosshair) {
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.strokeStyle = crosshairColor;
      ctx.lineWidth = 1 / zoomLevel;
      ctx.stroke();

      // 绘制中心点
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2 / zoomLevel, 0, Math.PI * 2);
      ctx.fillStyle = crosshairColor;
      ctx.fill();
    }

    ctx.restore();
  }, [
    canvasSize,
    colors,
    currentPosition,
    crosshairColor,
    radius,
    circleCount,
    pointSize,
    showMeasurements,
    showCrosshair,
    showReferencePoints,
    zoomLevel,
    panOffset,
    animationSpeed,
  ]);

  // 动画循环
  useEffect(() => {
    let animationFrame: number;
    let lastDrawTime = 0;
    const frameInterval = 1000 / 60; // 60 FPS

    const animate = (timestamp: number) => {
      if (timestamp - lastDrawTime >= frameInterval) {
        draw();
        calculateStats();
        lastDrawTime = timestamp;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [draw, calculateStats]);

  // 导出功能
  const handleExport = useCallback(
    async (format: "png" | "json") => {
      try {
        if (format === "png") {
          const canvas = canvasRef.current;
          if (!canvas) throw new Error("Canvas not found");

          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = "target-diagram.png";
          link.href = dataUrl;
          link.click();
        } else {
          const data = {
            currentPosition,
            stats,
            history: positionHistory.current,
            settings: {
              radius,
              zoomLevel,
              panOffset,
            },
          };

          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "target-data.json";
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }

        toast({
          title: "导出成功",
          description: `已导出为${format.toUpperCase()}格式`,
        });
      } catch (error) {
        toast({
          title: "导出失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    },
    [currentPosition, stats, radius, zoomLevel, panOffset]
  );

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 重置数据
  const handleReset = useCallback(() => {
    positionHistory.current = [];
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setStats({
      distance: 0,
      maxDeviation: 0,
      avgDeviation: 0,
    });
    toast({
      title: "重置成功",
      description: "所有数据已重置",
    });
  }, []);

  // 工具栏按钮配置
  const toolbarButtons = useMemo(
    () => [
      {
        icon: isFullscreen ? Minimize : Maximize,
        label: isFullscreen ? "退出全屏" : "全屏显示",
        onClick: toggleFullscreen,
      },
      {
        icon: Eye,
        label: showMeasurements ? "隐藏测量" : "显示测量",
        onClick: () => setShowMeasurements((prev) => !prev),
      },
      {
        icon: Crosshair,
        label: showCrosshair ? "隐藏准线" : "显示准线",
        onClick: () => setShowCrosshair((prev) => !prev),
      },
      {
        icon: Move,
        label: isDragging ? "停止拖动" : "开始拖动",
        onClick: () => setIsDragging((prev) => !prev),
      },
      {
        icon: Eye,
        label: showReferencePoints ? "隐藏参考点" : "显示参考点",
        onClick: () => setShowReferencePoints((prev) => !prev),
      },
    ],
    [
      isFullscreen,
      showMeasurements,
      showCrosshair,
      isDragging,
      showReferencePoints,
      toggleFullscreen,
    ]
  );

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative ${
          isFullscreen
            ? "fixed inset-0 z-50 bg-background"
            : "w-full rounded-lg"
        }`}
      >
        <Card className="h-full border-0 shadow-lg">
          <CardHeader className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">目标跟踪</CardTitle>
                <CardDescription>实时监控导星目标位置</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {toolbarButtons.map(({ icon: Icon, label, onClick }, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={onClick}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-lg border border-border bg-background touch-none"
                  onPointerDown={(e) => {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX, y: e.clientY });
                  }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => setIsDragging(false)}
                  onPointerLeave={() => setIsDragging(false)}
                  onWheel={(e) => {
                    e.preventDefault();
                    const factor = e.deltaY > 0 ? 0.9 : 1.1;
                    handleZoom(factor);
                  }}
                />

                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-2 right-2 flex gap-2"
                    >
                      <Badge variant="outline" className="text-xs">
                        距离: {stats.distance.toFixed(1)}px
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        最大偏差: {stats.maxDeviation.toFixed(1)}px
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        平均偏差: {stats.avgDeviation.toFixed(1)}px
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {showInfo && <PeakChart />}
            </div>

            {enableExport && (
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("png")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出图像
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("json")}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  导出数据
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCw className="h-4 w-4 mr-2" />
                      重置
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认重置数据？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将清除所有历史数据，且无法恢复。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset}>
                        确认
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
