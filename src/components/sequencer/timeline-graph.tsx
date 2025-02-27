"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Lightbulb,
  BarChart3,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import type { TimelinePoint } from "@/stores/sequencer";
import { useMediaQuery } from "react-responsive";
import { useDebouncedCallback } from "use-debounce";

interface ChartData {
  points: { x: number; y: number }[];
  min: number;
  max: number;
  current: number;
}

interface ChartDimensions {
  width: number;
  height: number;
  padding: number;
}

const TimelineCanvas = memo(({ 
  data, 
  dimensions, 
  zoom 
}: { 
  data: ChartData; 
  dimensions: ChartDimensions;
  zoom: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.points.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawChart = () => {
      const { width, height, padding } = dimensions;
      const { points, min, max } = data;

      // 设置高DPI支持
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 绘制网格
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      
      // 横向网格线
      for (let i = 0; i <= 10; i++) {
        const y = padding + ((height - 2 * padding) * i) / 10;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();

        // 添加刻度值
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "right";
        const value = max - ((max - min) * i) / 10;
        ctx.fillText(value.toFixed(1), padding - 5, y + 3);
      }

      // 纵向网格线
      const xStep = Math.max(1, Math.floor(points.length / 10));
      for (let i = 0; i < points.length; i += xStep) {
        const x = padding + ((width - 2 * padding) * i) / (points.length - 1);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // 绘制曲线
      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        padding,
        height - padding - ((height - 2 * padding) * (points[0].y - min)) / (max - min)
      );

      // 使用贝塞尔曲线使线条更平滑
      for (let i = 1; i < points.length; i++) {
        const x = padding + ((width - 2 * padding) * i) / (points.length - 1);
        const y = height - padding - ((height - 2 * padding) * (points[i].y - min)) / (max - min);
        const xc = (x + padding + ((width - 2 * padding) * (i - 1)) / (points.length - 1)) / 2;
        ctx.quadraticCurveTo(xc, y, x, y);
      }
      ctx.stroke();

      // 绘制点
      points.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (points.length - 1);
        const y = height - padding - ((height - 2 * padding) * (point.y - min)) / (max - min);

        // 绘制点的光晕效果
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
        gradient.addColorStop(0, "rgba(20, 184, 166, 0.3)");
        gradient.addColorStop(1, "rgba(20, 184, 166, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 绘制实心点
        ctx.fillStyle = "#14b8a6";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawChart();
  }, [data, dimensions, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 transition-transform duration-200"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: "left center",
      }}
    />
  );
});

TimelineCanvas.displayName = "TimelineCanvas";

const StatisticCard = memo(({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="text-center p-3 bg-gray-800/30 rounded-lg">
    <div className="text-sm text-gray-400">{label}</div>
    <div className={`text-xl font-semibold ${color}`}>
      {value.toFixed(2)}
    </div>
  </div>
));

StatisticCard.displayName = "StatisticCard";

export function TimelineGraph() {
  const [chartData, setChartData] = useState<ChartData>({
    points: [],
    min: 0,
    max: 100,
    current: 0,
  });
  
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 800,
    height: 300,
    padding: 40,
  });
  
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const {
    timeline,
    isRunning,
    startSequence,
    pauseSequence,
    stopSequence,
  } = useSequencerStore();

  // 处理时间线数据
  useEffect(() => {
    if (!timeline.length) return;

    const points = timeline.map((point: TimelinePoint, index: number) => ({
      x: index,
      y: Array.isArray(point.value) ? point.value[0] : point.value,
    }));

    const values = points.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1; // 添加10%的边距

    setChartData({
      points,
      min: min - padding,
      max: max + padding,
      current: values[values.length - 1] || 0,
    });
  }, [timeline]);

  // 处理窗口调整大小
  const handleResize = useDebouncedCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setDimensions({
      width: container.clientWidth,
      height: isMobile ? 200 : 300,
      padding: 40,
    });
  }, 200);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  }, []);

  // 导出数据
  const handleExport = useCallback(() => {
    const data = {
      timeline,
      chartData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeline-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [timeline, chartData]);

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-500" />
            <CardTitle className="text-xl">序列时间线</CardTitle>
            {isRunning && (
              <Badge variant="secondary" className="animate-pulse">
                运行中
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    className="h-8 w-8 p-0"
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>放大</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    className="h-8 w-8 p-0"
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>缩小</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isRunning ? pauseSequence : startSequence}
                    className="h-8"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        暂停
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
                  {isRunning ? "暂停序列" : "开始序列"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopSequence}
                    className="h-8 w-8 p-0"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>停止序列</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    className="h-8 w-8 p-0"
                    disabled={timeline.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>导出数据</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div 
            ref={containerRef}
            className="relative h-[300px] w-full bg-gray-800/30 rounded-lg overflow-hidden"
            role="img"
            aria-label="时间线图表"
          >
            <TimelineCanvas
              data={chartData}
              dimensions={dimensions}
              zoom={zoom}
            />
          </div>

          <AnimatePresence mode="wait">
            {timeline.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-8 text-gray-400"
              >
                <Lightbulb className="w-12 h-12 mb-4 opacity-50" />
                <p>暂无序列数据</p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-center gap-2 p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg mb-4"
                  >
                    <RefreshCw className="w-4 h-4 text-teal-500 animate-spin" />
                    <span className="text-sm text-teal-500">正在更新数据...</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <StatisticCard
                    label="当前值"
                    value={chartData.current}
                    color="text-teal-500"
                  />
                  <StatisticCard
                    label="最大值"
                    value={chartData.max}
                    color="text-green-500"
                  />
                  <StatisticCard
                    label="最小值"
                    value={chartData.min}
                    color="text-blue-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
