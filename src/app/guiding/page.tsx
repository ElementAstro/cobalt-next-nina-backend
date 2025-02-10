"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { getColorScheme, useGuidingStore } from "@/stores/guiding/guidingStore";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";

import { GuideImage } from "@/components/guiding/guide-image";
import HistoryGraph from "@/components/guiding/history-graph";
import { TargetDiagram } from "@/components/guiding/target-diagram";
import { Card, CardContent } from "@/components/ui/card";

export default function TelescopeGuiding() {
  const { settings, setSettings, tracking, historyGraph } = useGuidingStore();

  // 从calibrationStore获取校准数据
  const calibrationData = useCalibrationStore((state) => state.data);

  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    timestamp: Date.now(),
  });
  const [guideImage, setGuideImage] = useState<string | null>(null);
  const [colors, setColors] = useState(getColorScheme("dark"));
  const [isLoading, setIsLoading] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  // 更新颜色主题
  useEffect(() => {
    setColors(getColorScheme(settings.colorScheme));
  }, [settings.colorScheme]);

  // 初始化引导图像及实时更新当前位置
  useEffect(() => {
    if (!guideImage) {
      setGuideImage("/test-guide-image.jpg");
    }

    const interval = setInterval(() => {
      const newPosition = {
        x: currentPosition.x + (Math.random() * 0.4 - 0.2),
        y: currentPosition.y + (Math.random() * 0.4 - 0.2),
        timestamp: Date.now(),
      };
      setCurrentPosition(newPosition);

      if (settings.autoGuide) {
        setCurrentPosition({
          x: currentPosition.x * 0.95,
          y: currentPosition.y * 0.95,
          timestamp: Date.now(),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPosition, settings.autoGuide, guideImage]);

  // 处理图像上传逻辑
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setGuideImage(e.target?.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetView = useCallback(() => {
    setSettings({
      xScale: 100,
      yScale: '+/-4"',
      trendLine: true,
      correction: true,
      exposureTime: 30,
    });
  }, [setSettings]);

  // 注册快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f") setSettings({ correction: !settings.correction });
      if (e.key === "t") setSettings({ trendLine: !settings.trendLine });
      if (e.key === "r") resetView();
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [settings, resetView, setSettings]);

  // 计算图像指标，使用校准store数据
  const stats = useMemo(() => {
    const peakSNR = 10 * Math.log10(Math.abs(tracking.value));
    const hfd = calibrationData.raSpeed
      ? parseFloat(calibrationData.raSpeed.split(" ")[0]) / tracking.flow
      : 0;
    return {
      fwhm: (2.355 * hfd).toFixed(2),
      peak: Math.round(tracking.value * 1000),
      background: Math.round(tracking.mod * 10),
      snr: peakSNR.toFixed(2),
      hfd: hfd.toFixed(2),
    };
  }, [tracking, calibrationData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-screen"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col md:flex-row md:space-x-4 h-full">
          {/* 主图像区域 */}
          <div className="flex-1 relative flex flex-col">
            <div className="flex-1 relative min-h-0">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                  <div className="loader"></div>
                </div>
              )}
              {/* 上传图像按钮 */}
              <Button
                className="absolute top-2 right-2 z-20"
                variant="outline"
                onClick={() => uploadInputRef.current?.click()}
              >
                上传图像
              </Button>
              <input
                type="file"
                ref={uploadInputRef}
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <GuideImage
                imageUrl={guideImage}
                colors={colors}
                crosshairSize={20}
                showGrid={true}
                height="100%"
                shapes={[
                  {
                    type: "circle",
                    position: {
                      x: currentPosition.x,
                      y: currentPosition.y,
                    },
                    radius: 5,
                    color: colors.accent,
                  },
                ]}
              />
            </div>
            <div className="h-[40vh]">
              <HistoryGraph />
            </div>
          </div>
          {/* 辅助信息与设置 */}
          <div className="w-full md:w-1/3 flex flex-col space-y-4 p-4">
            <TargetDiagram
              radius={settings.radius || 50}
              currentPosition={currentPosition}
              colors={colors}
              animationSpeed={settings.animationSpeed || 1}
              showStats={true}
              enableExport={true}
              canvasSize={{ width: 100, height: 100 }}
              showInfo={true}
              crosshairColor={colors.secondary}
              circleCount={3}
              pointSize={4}
            />
            <Card>
              <CardContent className="text-xs space-y-1.5 font-mono items-center p-2">
                <div className="flex justify-between">
                  <span>Mid row FWHM:</span>
                  <span>{stats.fwhm}&quot;</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak:</span>
                  <span>{stats.peak}</span>
                </div>
                <div className="flex justify-between">
                  <span>Background:</span>
                  <span>{stats.background}</span>
                </div>
                <div className="flex justify-between">
                  <span>SNR:</span>
                  <span>{stats.snr} db</span>
                </div>
                <div className="flex justify-between">
                  <span>HFD:</span>
                  <span className="text-2xl font-bold">{stats.hfd}&quot;</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-xs space-y-1.5 font-mono items-center p-2">
                <div className="flex justify-between">
                  <span>跟踪状态:</span>
                  <span
                    className={`font-bold ${
                      settings.autoGuide ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {settings.autoGuide ? "自动跟踪中" : "待机"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>曝光时间:</span>
                  <span>{settings.exposureTime} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>累计时间:</span>
                  <span>
                    {(historyGraph.points.length * settings.exposureTime) /
                      1000}
                    s
                  </span>
                </div>
              </CardContent>
            </Card>
            {/* 设置面板放在Sheet中 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">设置</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-md">
                <SheetHeader>
                  <SheetTitle>引导设置</SheetTitle>
                  <SheetDescription>调整系统参数</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <span>自动跟踪</span>
                    <Switch
                      checked={settings.autoGuide}
                      onCheckedChange={(value) =>
                        setSettings({ autoGuide: value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>校正模式</span>
                    <Switch
                      checked={settings.correction}
                      onCheckedChange={(value) =>
                        setSettings({ correction: value })
                      }
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span>曝光时间 (ms)</span>
                    <Input
                      type="number"
                      value={settings.exposureTime}
                      onChange={(e) =>
                        setSettings({ exposureTime: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span>缩放比例</span>
                    <Input
                      type="number"
                      value={settings.zoom}
                      onChange={(e) =>
                        setSettings({ zoom: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button>关闭设置</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
