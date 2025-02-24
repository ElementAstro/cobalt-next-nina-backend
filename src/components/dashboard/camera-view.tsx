"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { useViewerStore } from "@/stores/dashboardStore";
import { LightBox } from "./lightbox";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { Viewfinder } from "./viewer/viewfinder";
import { ControlBar } from "./viewer/control-bar";
import { SettingsPanel } from "./viewer/settings-panel";
import { Histogram } from "./viewer/histogram";

export default function CameraViewfinder() {
  const {
    zoom,
    brightness,
    contrast,
    saturation,
    rotation,
    focusPoint,
    // 添加新的状态
    colorTemperature,
    tint,
    setColorTemperature,
    setTint,
    setZoom,
    setBrightness,
    setContrast,
    setSaturation,
    setRotation,
    setFocusPoint,
    images,
    exposure,
    highlights,
    shadows,
    sharpness,
    histogramEnabled,
    gridType,
    setExposure,
    setHighlights,
    setShadows,
    setSharpness,
    setHistogramEnabled,
    resetAll,
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

  // 使用 react-hotkeys-hook 替换原有快捷键
  useHotkeys("=", handleZoomIn, [zoom]);
  useHotkeys("-", handleZoomOut, [zoom]);
  useHotkeys("r", handleRotate, [rotation]);
  useHotkeys("space", handleStartCapture, []);
  useHotkeys("g", () => setShowGrid(!showGrid), [showGrid]);
  useHotkeys("s", () => setShowSettings(!showSettings), [showSettings]);
  useHotkeys("escape", resetAll, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, [setZoom]);

  const handleRotationChange = useCallback((newRotation: number) => {
    setRotation(newRotation);
  }, [setRotation]);

  return (
    <div className="relative h-[calc(100vh-3rem)] flex flex-col">
      <Viewfinder
        viewfinderRef={viewfinderRef}
        zoom={zoom}
        rotation={rotation}
        brightness={brightness}
        contrast={contrast}
        saturation={saturation}
        showGrid={showGrid}
        streamActive={streamActive}
        currentImage={currentImage}
        focusPoint={focusPoint}
        onClick={handleViewfinderClick}
        highlights={highlights}
        shadows={shadows}
        sharpness={sharpness}
        gridType={gridType}
        colorTemperature={colorTemperature}
        tint={tint}
        onZoomChange={handleZoomChange}
        onRotationChange={handleRotationChange}
      />

      {histogramEnabled && viewfinderRef.current && (
        <Histogram
          imageData={getImageData(viewfinderRef.current)}
          className="absolute bottom-16 right-4"
        />
      )}

      <ControlBar
        zoom={zoom}
        isCapturing={isCapturing}
        showGrid={showGrid}
        showSettings={showSettings}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRotate={handleRotate}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onCapture={handleStartCapture}
        onOpenLightBox={() => setIsLightBoxOpen(true)}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <SettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        brightness={brightness}
        contrast={contrast}
        saturation={saturation}
        onBrightnessChange={setBrightness}
        onContrastChange={setContrast}
        onSaturationChange={setSaturation}
        settingsRef={settingsRef}
        exposure={exposure}
        highlights={highlights}
        shadows={shadows}
        sharpness={sharpness}
        histogramEnabled={histogramEnabled}
        onExposureChange={setExposure}
        onHighlightsChange={setHighlights}
        onShadowsChange={setShadows}
        onSharpnessChange={setSharpness}
        onHistogramToggle={setHistogramEnabled}
        colorTemperature={colorTemperature}
        tint={tint}
        onColorTemperatureChange={(value: number) => {
          // 将开尔文色温转换为RGB颜色矩阵
          setColorTemperature(value);
        }}
        onTintChange={(value: number) => {
          // 调整绿色-品红色平衡
          setTint(value);
        }}
      />

      <AnimatePresence>
        {isLightBoxOpen && (
          <LightBox
            images={images.map((src: string) => ({
              src,
              alt: "Captured image",
              width: 800,
              height: 600,
            }))}
            initialIndex={0}
            onClose={() => setIsLightBoxOpen(false)}
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

// 修复 getImageData 函数的类型
function getImageData(element: HTMLDivElement): ImageData {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 canvas 上下文");

  const rect = element.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // 使用正确的类型转换
  html2canvas(element).then((canvas) => {
    ctx.drawImage(canvas, 0, 0);
  });

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
