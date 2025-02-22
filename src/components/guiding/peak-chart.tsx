"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePeakChartStore } from "@/stores/guiding/peakStore";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Square,
  Eye,
  EyeOff,
  Crosshair,
  Download,
  Settings2,
  Save,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export function PeakChart() {
  const height = usePeakChartStore((state) => state.height);
  const width = usePeakChartStore((state) => state.width);
  const strokeColor = usePeakChartStore((state) => state.strokeColor);
  const strokeWidth = usePeakChartStore((state) => state.strokeWidth);
  const showGrid = usePeakChartStore((state) => state.showGrid);
  const setHeight = usePeakChartStore((state) => state.setHeight);
  const setWidth = usePeakChartStore((state) => state.setWidth);
  const setStrokeColor = usePeakChartStore((state) => state.setStrokeColor);
  const setStrokeWidth = usePeakChartStore((state) => state.setStrokeWidth);
  const setShowGrid = usePeakChartStore((state) => state.setShowGrid);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [peakStats, setPeakStats] = useState({
    mainPeak: 0,
    fwhm: 0,
    snr: 0,
    centroid: 0,
    background: 0,
  });
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [measurementHistory, setMeasurementHistory] = useState<
    Array<{
      timestamp: number;
      fwhm: number;
      snr: number;
    }>
  >([]);

  // 生成示例数据
  const generatePeakData = useCallback(() => {
    const data = [];
    for (let x = -50; x <= 50; x++) {
      const y =
        Math.exp(-(x * x) / 200) * 100 + // 主峰
        Math.exp(-(x * x) / 800) * 30 + // 次峰
        Math.random() * 5; // 噪声
      data.push({ x, y });
    }
    return data;
  }, []);

  const data = useCallback(() => generatePeakData(), [generatePeakData]);

  // 分析峰值数据
  const analyzePeak = useCallback(
    (peakData: { x: number; y: number }[]) => {
      const values = peakData.map((p) => p.y);
      const max = Math.max(...values);
      const background = Math.min(...values);
      const maxIndex = values.indexOf(max);

      // 计算半高宽
      const halfMax = (max + background) / 2;
      let leftHalf = maxIndex;
      let rightHalf = maxIndex;

      while (leftHalf > 0 && values[leftHalf] > halfMax) leftHalf--;
      while (rightHalf < values.length - 1 && values[rightHalf] > halfMax)
        rightHalf++;

      const fwhm = rightHalf - leftHalf;
      const snr = (max - background) / Math.sqrt(background);

      // 计算质心
      let weightedSum = 0;
      let sumIntensity = 0;
      peakData.forEach((point) => {
        weightedSum += point.y * point.x;
        sumIntensity += point.y;
      });
      const centroid = weightedSum / sumIntensity;

      setPeakStats({
        mainPeak: max,
        fwhm,
        snr,
        centroid,
        background,
      });

      setMeasurementHistory((prev) =>
        [...prev, { timestamp: Date.now(), fwhm, snr }].slice(-100)
      );
    },
    [setPeakStats]
  );

  const handleZoom = useCallback(
    (factor: number) => {
      setZoomLevel((prev) => {
        const newZoom = Math.max(0.1, Math.min(10, prev * factor));
        toast({
          title: "缩放已更新",
          description: `当前缩放比例: ${newZoom.toFixed(2)}x`,
        });
        return newZoom;
      });
    },
    []
  );

  // 绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 设置背景
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    if (showGrid) {
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 应用缩放和平移
    ctx.save();
    ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // 绘制数据
    const points = data();
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth / zoomLevel;

    points.forEach((point, i) => {
      const x = ((point.x + 50) / 100) * width;
      const y = height - (point.y / 100) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // 绘制测量标记
    if (showMeasurements) {
      // FWHM 标记
      const fwhmY = height - (peakStats.mainPeak / 2) * (height / 100);
      ctx.beginPath();
      ctx.strokeStyle = "#ff4444";
      ctx.setLineDash([5, 5]);
      ctx.moveTo(0, fwhmY);
      ctx.lineTo(width, fwhmY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 峰值标记
      const peakX = ((peakStats.centroid + 50) / 100) * width;
      ctx.beginPath();
      ctx.strokeStyle = "#44ff44";
      ctx.moveTo(peakX, 0);
      ctx.lineTo(peakX, height);
      ctx.stroke();
    }

    // 绘制十字准线
    if (showCrosshair) {
      ctx.strokeStyle = "#ffffff33";
      ctx.lineWidth = 1 / zoomLevel;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    ctx.restore();
  }, [
    width,
    height,
    showGrid,
    strokeColor,
    strokeWidth,
    zoomLevel,
    panOffset,
    showMeasurements,
    showCrosshair,
    peakStats,
    data,
  ]);

  // 动画循环
  useEffect(() => {
    let animationFrameId: number;
    let lastDrawTime = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;

    const animate = (timestamp: number) => {
      if (timestamp - lastDrawTime >= frameInterval) {
        draw();
        analyzePeak(data());
        lastDrawTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [draw, analyzePeak, data]);

  const handlePointerEvents = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return;

      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 1) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      setPanOffset({
        x: panOffset.x + (clientX - dragStart.x) / zoomLevel,
        y: panOffset.y + (clientY - dragStart.y) / zoomLevel,
      });
      setDragStart({ x: clientX, y: clientY });
    },
    [isDragging, dragStart, panOffset, zoomLevel]
  );

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full space-y-4"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">峰值分析</CardTitle>
          <CardDescription>实时监测和分析信号峰值特征</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(1.2)}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom(0.8)}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMeasurements(!showMeasurements)}
                className="h-8 w-8 p-0"
              >
                {showMeasurements ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCrosshair(!showCrosshair)}
                className="h-8 w-8 p-0"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            </div>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Square className="h-4 w-4 mr-2" />
                  统计信息
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">峰值统计</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">FWHM</p>
                      <p className="text-sm font-medium">
                        {peakStats.fwhm.toFixed(2)} px
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SNR</p>
                      <p className="text-sm font-medium">
                        {peakStats.snr.toFixed(2)} db
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">峰值</p>
                      <p className="text-sm font-medium">
                        {peakStats.mainPeak.toFixed(0)} ADU
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">本底</p>
                      <p className="text-sm font-medium">
                        {peakStats.background.toFixed(0)} ADU
                      </p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full rounded-lg border border-border bg-background"
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={handlePointerEvents}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  setIsDragging(true);
                  setDragStart({
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                  });
                }
              }}
              onTouchMove={handlePointerEvents}
              onTouchEnd={() => setIsDragging(false)}
              style={{ touchAction: "none" }}
            />

            <div className="absolute bottom-2 right-2 flex gap-2">
              <Badge variant="outline" className="text-xs">
                平均FWHM:{" "}
                {(
                  measurementHistory.reduce((acc, curr) => acc + curr.fwhm, 0) /
                  Math.max(1, measurementHistory.length)
                ).toFixed(2)}{" "}
                px
              </Badge>
              <Badge variant="outline" className="text-xs">
                平均SNR:{" "}
                {(
                  measurementHistory.reduce((acc, curr) => acc + curr.snr, 0) /
                  Math.max(1, measurementHistory.length)
                ).toFixed(2)}{" "}
                db
              </Badge>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings2 className="w-4 h-4 mr-2" />
                  图表设置
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>图表设置</DialogTitle>
                  <DialogDescription>
                    调整图表的显示参数和性能选项
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>图表尺寸</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">宽度</Label>
                        <Slider
                          value={[width]}
                          onValueChange={(value) => setWidth(value[0])}
                          min={200}
                          max={1000}
                          step={50}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">高度</Label>
                        <Slider
                          value={[height]}
                          onValueChange={(value) => setHeight(value[0])}
                          min={100}
                          max={500}
                          step={50}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>线条样式</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">颜色</Label>
                        <Select value={strokeColor} onValueChange={setStrokeColor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="#ffffff">白色</SelectItem>
                            <SelectItem value="#ff0000">红色</SelectItem>
                            <SelectItem value="#00ff00">绿色</SelectItem>
                            <SelectItem value="#0000ff">蓝色</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">线宽</Label>
                        <Slider
                          value={[strokeWidth]}
                          onValueChange={(value) => setStrokeWidth(value[0])}
                          min={1}
                          max={5}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label>显示网格</Label>
                    <Select
                      value={showGrid ? "show" : "hide"}
                      onValueChange={(value) => setShowGrid(value === "show")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">显示</SelectItem>
                        <SelectItem value="hide">隐藏</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">取消</Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "设置已保存",
                        description: "图表设置已成功更新",
                      });
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存设置
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const canvas = canvasRef.current;
                if (canvas) {
                  const link = document.createElement("a");
                  link.download = "peak-chart.png";
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                  toast({
                    title: "导出成功",
                    description: "图表已保存为PNG格式",
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              导出图表
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
