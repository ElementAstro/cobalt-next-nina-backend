"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import type { TimelinePoint } from "@/stores/sequencer";

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

export function TimelineGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartData, setChartData] = useState<ChartData>({
    points: [],
    min: 0,
    max: 100,
    current: 0,
  });
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 800,
    height: 300,
    padding: 20,
  });
  const [zoom, setZoom] = useState(1);

  const {
    timeline,
    isRunning,
    startSequence,
    pauseSequence,
    stopSequence,
  } = useSequencerStore();

  useEffect(() => {
    const processTimelineData = () => {
      if (!timeline.length) return;

      const points = timeline.map((point: TimelinePoint, index: number) => ({
        x: index,
        y: Array.isArray(point.value) ? point.value[0] : point.value,
      }));

      const values = points.map((p) => p.y);
      setChartData({
        points,
        min: Math.min(...values),
        max: Math.max(...values),
        current: values[values.length - 1] || 0,
      });
    };

    processTimelineData();
  }, [timeline]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.points.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawChart = () => {
      const { width, height, padding } = dimensions;
      const { points, min, max } = chartData;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = padding + ((height - 2 * padding) * i) / 10;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Draw line
      ctx.strokeStyle = "#14b8a6"; // teal-500
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (points.length - 1);
        const y =
          height -
          padding -
          ((height - 2 * padding) * (point.y - min)) / (max - min);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      points.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (points.length - 1);
        const y =
          height -
          padding -
          ((height - 2 * padding) * (point.y - min)) / (max - min);

        ctx.fillStyle = "#14b8a6";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    drawChart();
  }, [chartData, dimensions, zoom]);

  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;

      setDimensions({
        width: container.clientWidth,
        height: 300,
        padding: 20,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.5));

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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative h-[300px] w-full">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              className="absolute inset-0"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "left center",
              }}
            />
          </div>

          {timeline.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 text-gray-400"
            >
              <Lightbulb className="w-12 h-12 mb-4 opacity-50" />
              <p>暂无序列数据</p>
            </motion.div>
          )}

          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 text-teal-500 animate-spin" />
              <span className="text-sm text-teal-500">正在更新数据...</span>
            </motion.div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">当前值</div>
              <div className="text-xl font-semibold text-teal-500">
                {chartData.current.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">最大值</div>
              <div className="text-xl font-semibold text-green-500">
                {chartData.max.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">最小值</div>
              <div className="text-xl font-semibold text-blue-500">
                {chartData.min.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
