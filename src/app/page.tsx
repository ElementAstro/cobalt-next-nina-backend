"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import CameraViewfinder from "@/components/dashboard/camera-view";
import ExposureControls from "@/components/dashboard/right-sidebar";
import Sidebar, { SidebarItem } from "@/components/dashboard/left-sidebar";
import TopBar from "@/components/dashboard/top-bar";
import { CameraPage } from "@/components/dashboard/camera";
import { FocuserPage } from "@/components/dashboard/focuser";
import { FilterWheelPage } from "@/components/dashboard/filterwheel";
import { TelescopePage } from "@/components/dashboard/telescope";
import SplashScreen from "@/components/splash-screen";
import ErrorBoundary from "@/components/error/error-boundary";
import { toast } from "@/hooks/use-toast";
import { useMediaQuery } from "react-responsive";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useExposureStore, useViewerStore } from "@/stores/dashboardStore";
import { ClientInfo } from "@/components/dashboard/client/client-info";

export default function Dashboard() {
  const [devices, setDevices] = useState<SidebarItem[]>([
    {
      id: "device",
      name: "Device Connection",
      icon: "wifi",
      active: false,
      route: "/device",
    },
    {
      id: "debug",
      name: "Debug",
      icon: "terminal",
      active: false,
      route: "/debug",
    },
    {
      id: "config",
      name: "Configuration",
      icon: "settings",
      active: false,
      route: "/config",
    },
  ]);

  const exposureSettings = useExposureStore((state) => ({
    shutterSpeed: "1/125", // 如有需要，可调整默认值
    iso: String(state.iso),
    aperture: String(state.aperture),
    focusPoint: String(state.focusPoint),
    filterType: state.filterType,
    exposureTime: state.exposureTime,
    exposureMode: state.exposureMode,
    whiteBalance: state.whiteBalance,
    gain: state.gain,
    offset: state.offset,
    binning: state.binning,
  }));

  const [isShooting, setIsShooting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDevice, setSheetDevice] = useState<string | null>(null);
  const capturedImages = useViewerStore((state) => state.images);
  const setCapturedImages = useViewerStore((state) => state.setImages);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const toggleDevice = useCallback((id: string) => {
    setDevices((devices) =>
      devices.map((device) =>
        device.id === id
          ? { ...device, active: !device.active }
          : { ...device, active: false }
      )
    );
    setActiveDevice((prev) => (prev === id ? null : id));
  }, []);

  const handleDragStart = useCallback(() => {
    // Logic for drag start can be added here.
  }, []);

  const handleDragEnd = useCallback(() => {
    // Currently no activeId is used.
  }, []);

  const handleParameterClick = useCallback((parameter: string) => {
    console.log("Parameter clicked:", parameter);
  }, []);

  const handleCapture = useCallback(
    (
      exposureTime: number,
      burstMode: boolean,
      exposureMode: string,
      whiteBalance: string
    ) => {
      if (isShooting) {
        // Toggle pause/resume.
        setIsPaused((prev) => !prev);
      } else {
        // Start new capture.
        setIsShooting(true);
        setIsPaused(false);
        setProgress(0);
        const captureCount = burstMode ? 3 : 1;
        const totalTime = exposureTime * captureCount;

        toast({
          title: "正在捕捉图像",
          description: `${
            burstMode ? "连拍" : "单张"
          }捕捉中，预计耗时 ${totalTime} 秒...`,
          variant: "default",
        });

        const startTime = Date.now();
        const updateProgress = () => {
          const elapsedTime = Date.now() - startTime;
          const newProgress = (elapsedTime / (totalTime * 1000)) * 100;
          setProgress(Math.min(newProgress, 100));

          if (newProgress < 100) {
            captureIntervalRef.current = setTimeout(updateProgress, 100);
          } else {
            setIsShooting(false);
            setProgress(0);

            toast({
              title: "捕捉完成",
              description: `${
                burstMode ? "连拍" : "单张"
              }图像已成功捕捉！曝光模式：${exposureMode}，白平衡：${whiteBalance}`,
              variant: "default",
            });

            // Simulate adding captured images.
            const newImages = [
              ...capturedImages,
              ...Array(captureCount).fill(
                `/placeholder.svg?height=300&width=300`
              ),
            ];
            setCapturedImages(newImages);
          }
        };

        updateProgress();
      }
    },
    [capturedImages, isShooting, setCapturedImages]
  );

  const handlePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleOpenSheet = useCallback((device: string) => {
    setSheetDevice(device);
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setSheetDevice(null);
  }, []);

  const handleLoadPreset = useCallback(() => {
    const preset = localStorage.getItem("exposurePreset");
    if (preset) {
      try {
        const presetData = JSON.parse(preset);
        const exposureStore = useExposureStore.getState();

        // Load each setting from preset
        exposureStore.resetSettings({
          shutterSpeed: presetData.shutterSpeed || "1/125",
          exposureTime: presetData.exposureTime || 60,
          exposureMode: presetData.exposureMode || "Manual",
          iso: presetData.iso || "100",
          aperture: presetData.aperture || "2.8",
          focusPoint: presetData.focusPoint || "50",
          filterType: presetData.filterType || "None",
          gain: presetData.gain || 0,
          offset: presetData.offset || 0,
          binning: presetData.binning || "1x1",
        });

        toast({
          title: "预设加载成功",
          description: "曝光预设已应用到相机设置",
          variant: "default",
        });
      } catch {
        toast({
          title: "加载预设失败",
          description: "预设数据格式无效",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "预设不存在",
        description: "没有找到已保存的曝光预设",
        variant: "default",
      });
    }
  }, []);

  const handleSavePreset = useCallback(() => {
    localStorage.setItem("exposurePreset", JSON.stringify(exposureSettings));
    toast({
      title: "预设保存成功",
      description: "当前曝光设置已保存为预设",
      variant: "default",
    });
  }, [exposureSettings]);

  const renderSheetContent = () => {
    switch (sheetDevice) {
      case "clientInfo":
        return <ClientInfo />;
      case "telescope":
        return <TelescopePage />;
      case "focuser":
        return <FocuserPage />;
      case "filterWheel":
        return <FilterWheelPage />;
      case "camera":
        return <CameraPage />;
      default:
        return null;
    }
  };

  const getSheetTitle = () => {
    switch (sheetDevice) {
      case "clientInfo":
        return "系统信息";
      case "telescope":
        return "望远镜控制";
      case "focuser":
        return "调焦控制";
      case "filterWheel":
        return "滤镜轮控制";
      case "camera":
        return "相机控制";
      default:
        return "设备设置";
    }
  };

  return (
    <>
      <ErrorBoundary>
        <SplashScreen />
        <DndContext
          sensors={sensors}
          modifiers={[restrictToWindowEdges]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            <TopBar onOpenOffcanvas={handleOpenSheet} />
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧边栏 */}
              <div className="w-16 border-r border-border bg-muted/50">
                <Sidebar devices={devices} onToggle={toggleDevice} />
              </div>

              {/* 主内容区域 */}
              <div className="flex-1 relative overflow-hidden flex">
                {/* 相机视场区域 */}
                <div className="flex-1">
                  <CameraViewfinder />
                </div>

                {/* 右侧控制面板 */}
                <div className="w-72 border-l border-border bg-muted/50 p-4">
                  <ExposureControls
                    settings={exposureSettings}
                    onParameterClick={handleParameterClick}
                    onCapture={handleCapture}
                    onPause={handlePause}
                    isShooting={isShooting}
                    isPaused={isPaused}
                    progress={progress}
                    onLoadPreset={handleLoadPreset}
                    onSavePreset={handleSavePreset}
                  />
                </div>
              </div>
            </div>

            {/* 底部缩略图栏 */}
            {capturedImages.length > 0 && (
              <div className="h-24 border-t border-border bg-muted/50">
                <div className="flex items-center h-full p-2 space-x-2 overflow-x-auto">
                  {capturedImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Captured ${idx}`}
                      className="h-full aspect-square object-cover rounded-md hover:ring-2 ring-primary cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 设备控制面板 */}
          <Sheet open={sheetOpen} onOpenChange={handleCloseSheet}>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className="p-4 w-[480px]"
            >
              <SheetHeader>
                <SheetTitle>{getSheetTitle()}</SheetTitle>
                <SheetDescription>
                  {sheetDevice === "clientInfo"
                    ? "查看系统和设备的详细信息"
                    : "在这里你可以调整设备参数"}
                </SheetDescription>
              </SheetHeader>
              {renderSheetContent()}
              <SheetClose asChild>
                <Button variant="ghost">关闭</Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </DndContext>
      </ErrorBoundary>
    </>
  );
}
