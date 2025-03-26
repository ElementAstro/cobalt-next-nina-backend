"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ScanLine,
} from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalibrationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const { toast } = useToast();
  const animationFrameRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dpr, setDpr] = useState(1);
  const [renderStats, setRenderStats] = useState({
    fps: 0,
    drawTime: 0,
    lastFrameTime: performance.now(),
  });

  const calibrationParams = useCalibrationStore((state) => ({
    showGrid: state.showGrid,
    lineLength: state.lineLength,
    showAnimation: state.showAnimation,
    autoRotate: state.autoRotate,
    rotationSpeed: state.rotationSpeed,
    zoomLevel: state.zoomLevel,
    setZoomLevel: state.setZoomLevel,
  }));

  const [viewMode, setViewMode] = useState<"normal" | "3d">("normal");
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize DPR
    try {
      const newDpr = window.devicePixelRatio || 1;
      if (newDpr < 1 || newDpr > 3) {
        throw new Error(`Invalid device pixel ratio: ${newDpr}`);
      }
      setDpr(newDpr);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Device Pixel Ratio Error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setDpr(1);
    }

    // Initialize worker
    try {
      workerRef.current = new Worker(
        new URL("../../workers/canvas.worker.ts", import.meta.url)
      );

      workerRef.current.onmessage = (event) => {
        const { data } = event;
        if (data.type === "render") {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.putImageData(data.imageData, 0, 0);
          setIsLoading(false);

          // Update render stats
          const now = performance.now();
          setRenderStats((prev) => ({
            fps: Math.round(1000 / (now - prev.lastFrameTime)),
            drawTime: data.drawTime,
            lastFrameTime: now,
          }));
        } else if (data.type === "error") {
          setError(data.error);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "渲染错误",
            description: data.error,
          });
        }
      };

      workerRef.current.onerror = (error) => {
        setError(error.message);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Worker 错误",
          description: error.message,
        });
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      setIsLoading(false);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      workerRef.current?.terminate();
    };
  }, [toast]);

  // Memoized render parameters
  const renderParams = useMemo(
    () => ({
      showGrid: calibrationParams.showGrid,
      lineLength: calibrationParams.lineLength,
      autoRotate: calibrationParams.autoRotate,
      rotationSpeed: calibrationParams.rotationSpeed,
      zoomLevel: calibrationParams.zoomLevel,
      filters,
      viewMode,
      celestialObjects: [],
      calibrationStatus: "idle",
    }),
    [
      calibrationParams.showGrid,
      calibrationParams.lineLength,
      calibrationParams.autoRotate,
      calibrationParams.rotationSpeed,
      calibrationParams.zoomLevel,
      filters,
      viewMode,
    ]
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !workerRef.current) return;

    const render = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      workerRef.current?.postMessage({
        type: "render",
        width,
        height,
        dpr,
        offset,
        ...renderParams,
      });

      if (calibrationParams.showAnimation) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [calibrationParams.showAnimation, offset, dpr, renderParams]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !e.isPrimary) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.isPrimary) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    const step = 0.1;
    const newZoom =
      direction === "in"
        ? calibrationParams.zoomLevel + step
        : calibrationParams.zoomLevel - step;
    const clampedZoom = Math.min(Math.max(0.5, newZoom), 2);
    calibrationParams.setZoomLevel(clampedZoom);
  };

  const handleReset = () => {
    setOffset({ x: 0, y: 0 });
    calibrationParams.setZoomLevel(1);
  };

  return (
    <div className="relative w-full aspect-square">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg z-10"
          >
            <div className="flex flex-col items-center gap-4">
              <RotateCw className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-gray-300">加载中...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg z-10"
          >
            <Card className="bg-destructive/20 border-destructive">
              <div className="p-4 text-center">
                <span className="text-sm text-destructive-foreground">
                  {error}
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.canvas
        ref={canvasRef}
        className={`w-full h-full bg-gray-900 border ${
          isHovering ? "border-primary/50" : "border-gray-700"
        } shadow-inner rounded-lg transition-colors ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        tabIndex={0}
        aria-label="校准画布"
        aria-describedby="canvas-description"
        style={{
          touchAction: "none",
          imageRendering: "crisp-edges",
          outline: isFocus ? "2px solid rgba(59, 130, 246, 0.5)" : "none",
        }}
      />
      <div id="canvas-description" className="sr-only">
        用于显示和交互的校准画布，支持缩放和平移操作
      </div>

      {/* 控制面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-gray-800/90 backdrop-blur-sm rounded-full border border-gray-700 shadow-lg"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleZoom("out")}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>缩小</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleZoom("in")}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>放大</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={handleReset}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>重置视图</p>
            </TooltipContent>
          </Tooltip>

          <Badge variant="secondary" className="bg-gray-700/50 h-6">
            {`${(calibrationParams.zoomLevel * 100).toFixed(0)}%`}
          </Badge>
        </TooltipProvider>
      </motion.div>

      {/* 状态指示器和工具条 */}
      <div className="absolute top-4 left-4 space-y-2">
        <Select
          value={viewMode}
          onValueChange={(value: "normal" | "3d") => setViewMode(value)}
        >
          <SelectTrigger className="w-[120px] bg-gray-800/80 border-gray-700">
            <SelectValue placeholder="查看模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">普通模式</SelectItem>
            <SelectItem value="3d">3D模式</SelectItem>
          </SelectContent>
        </Select>

        <Card className="bg-gray-800/80 border-gray-700 p-2 space-y-2">
          {[
            { label: "亮度", key: "brightness" },
            { label: "对比度", key: "contrast" },
            { label: "饱和度", key: "saturation" },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.label}</span>
                <span>{filters[item.key as keyof typeof filters]}%</span>
              </div>
              <Slider
                value={[filters[item.key as keyof typeof filters]]}
                min={0}
                max={200}
                step={1}
                className="w-[160px]"
                onValueChange={([value]) =>
                  setFilters((prev) => ({ ...prev, [item.key]: value }))
                }
              />
            </div>
          ))}
        </Card>
      </div>

      {/* 性能指标 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Badge variant="outline" className="bg-gray-800/80">
          <ScanLine className="w-4 h-4 mr-2 text-green-400" />
          <span>{renderStats.fps} FPS</span>
        </Badge>
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge variant="outline" className="bg-gray-800/80">
                <Move className="w-4 h-4 mr-2 text-blue-400" />
                <span>平移中</span>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
