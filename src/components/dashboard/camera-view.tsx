"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Grid3X3,
  Loader2,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useViewerStore } from "@/stores/dashboardStore";
import { LightBox } from "./lightbox";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

export default function CameraViewfinder() {
  const {
    zoom,
    brightness,
    contrast,
    saturation,
    rotation,
    focusPoint,
    setZoom,
    setBrightness,
    setContrast,
    setSaturation,
    setRotation,
    setFocusPoint,
    images,
  } = useViewerStore();

  const viewfinderRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  const handleZoomIn = useCallback(
    () => setZoom(Math.min(zoom + 0.1, 3)),
    [zoom, setZoom]
  );

  const handleZoomOut = useCallback(
    () => setZoom(Math.max(zoom - 0.1, 0.5)),
    [zoom, setZoom]
  );

  const handleRotate = useCallback(
    () => setRotation((rotation + 90) % 360),
    [rotation, setRotation]
  );

  const handleViewfinderClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (viewfinderRef.current) {
        const rect = viewfinderRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setFocusPoint({ x, y });
      }
    },
    [setFocusPoint]
  );

  const handleStartCapture = async () => {
    setIsCapturing(true);
    try {
      if (!viewfinderRef.current) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "无法找到取景器",
        });
        return;
      }

      // 创建离屏 canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "无法创建画布上下文",
        });
        return;
      }

      // 设置 canvas 尺寸
      const width = viewfinderRef.current.clientWidth;
      const height = viewfinderRef.current.clientHeight;
      canvas.width = width;
      canvas.height = height;

      // 应用变换和滤镜效果
      ctx.save();

      // 设置背景色
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // 应用缩放和旋转
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);

      // 绘制主图像
      const image = new Image();
      image.onload = async () => {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(image, 0, 0, width, height);

        // 导出图像
        const dataUrl = canvas.toDataURL("image/png", 0.95);
        const link = document.createElement("a");
        link.download = `capture_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        toast({
          title: "成功",
          description: "图片已保存",
        });
      };

      const canvasElement = await html2canvas(viewfinderRef.current);
      if (viewfinderRef.current) {
        image.src = canvasElement.toDataURL();
      }

      // 如果显示网格，绘制网格
      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;

        // 垂直线
        for (let i = 1; i < 3; i++) {
          const x = (width * i) / 3;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // 水平线
        for (let i = 1; i < 3; i++) {
          const y = (height * i) / 3;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 绘制对焦点
      const focusX = (focusPoint.x / 100) * width;
      const focusY = (focusPoint.y / 100) * height;

      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(focusX, focusY, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "图片生成失败",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      settingsRef.current &&
      !settingsRef.current.contains(e.target as Node)
    ) {
      setTimeout(() => {
        setShowSettings(false);
      }, 100);
    }
  };

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  useEffect(() => {
    // 模拟从相机获取预览流
    const startPreviewStream = async () => {
      try {
        setStreamActive(true);
        // 这里可以添加实际的相机流连接逻辑
        setCurrentImage("/camera-preview-placeholder.jpg");
      } catch {
        toast({
          variant: "destructive",
          title: "错误",
          description: "无法启动相机预览",
        });
      }
    };

    startPreviewStream();
    return () => {
      setStreamActive(false);
      // 清理相机流连接
    };
  }, []);

  const openLightBox = () => {
    setIsLightBoxOpen(true);
  };

  const closeLightBox = () => {
    setIsLightBoxOpen(false);
  };

  return (
    <div className="relative h-[calc(100vh-3rem)] flex flex-col">
      {/* Viewfinder with improved aspect ratio */}
      <div
        ref={viewfinderRef}
        className="relative flex-1 overflow-hidden bg-black cursor-crosshair"
        onClick={handleViewfinderClick}
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
        }}
      >
        {/* 预览图像或实时流 */}
        {streamActive && currentImage && (
          <div className="absolute inset-0">
            <img
              src={currentImage}
              alt="Camera Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        )}

        {/* Focus Point Indicator */}
        <div
          className="absolute w-4 h-4 border-2 border-red-500 rounded-full"
          style={{
            left: `${focusPoint.x}%`,
            top: `${focusPoint.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Compact Controls Bar */}
      <div className="h-12 bg-gray-900/90 backdrop-blur-sm flex items-center justify-between px-2 border-t border-gray-700/50">
        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomOut}
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
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>切换网格</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleRotate}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>旋转90°</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleStartCapture}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>保存图像</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={openLightBox}>
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>查看相册</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Settings Panel - More Compact */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <div ref={settingsRef}>
          <CollapsibleTrigger className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-md">
            <Settings className="h-4 w-4" />
          </CollapsibleTrigger>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                  scale: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  },
                }}
                className="absolute top-0 right-0 bg-black/50 backdrop-blur-sm p-4 space-y-4"
              >
                <CollapsibleContent>
                  <div className="space-y-2">
                    <Label
                      htmlFor="brightness"
                      className="text-sm font-medium text-white"
                    >
                      亮度
                    </Label>
                    <Slider
                      id="brightness"
                      min={0}
                      max={200}
                      step={1}
                      value={[brightness]}
                      onValueChange={([value]) => setBrightness(value)}
                      className="w-48"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="contrast"
                      className="text-sm font-medium text-white"
                    >
                      对比度
                    </Label>
                    <Slider
                      id="contrast"
                      min={0}
                      max={200}
                      step={1}
                      value={[contrast]}
                      onValueChange={([value]) => setContrast(value)}
                      className="w-48"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="saturation"
                      className="text-sm font-medium text-white"
                    >
                      饱和度
                    </Label>
                    <Slider
                      id="saturation"
                      min={0}
                      max={200}
                      step={1}
                      value={[saturation]}
                      onValueChange={([value]) => setSaturation(value)}
                      className="w-48"
                    />
                  </div>
                </CollapsibleContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Collapsible>

      {/* LightBox Component */}
      <AnimatePresence>
        {isLightBoxOpen && (
          <LightBox
            images={images.map((src) => ({
              src,
              alt: "Captured image",
              width: 800,
              height: 600,
            }))}
            initialIndex={0}
            onClose={closeLightBox}
            showThumbnails={true}
            enableZoom={true}
            enableSwipe={true}
            backgroundColor="rgba(0, 0, 0, 0.9)"
            closeOnClickOutside={true}
            autoPlayInterval={0}
            enableFullscreen={true}
            enableDownload={true}
            enableSharing={true}
            showLoadingIndicator={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
