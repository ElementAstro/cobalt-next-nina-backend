"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  ZoomIn,
  ZoomOut,
  Compass,
  Grid,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import AladinLiteView from "@/components/skymap/aladin";
import { FOVSettingDialog } from "@/components/skymap/fov";
import { useSkymapStore } from "@/stores/skymap/skymapStore";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ObjectManagement from "@/components/skymap/manager";
import ObjectSearch from "@/components/skymap/search";

const ImageFraming: React.FC = () => {
  const {
    viewState,
    setViewState,
    updateScreenPosition,
    updateTargetCenter,
    calculateFovPoints,
    handleZoom,
    togglePanel,
    toggleNightMode,
  } = useSkymapStore((state) => ({
    viewState: state.viewState,
    setViewState: state.setViewState,
    updateScreenPosition: state.updateScreenPosition,
    updateTargetCenter: state.updateTargetCenter,
    calculateFovPoints: state.calculateFovPoints,
    handleZoom: state.handleZoom,
    togglePanel: state.togglePanel,
    toggleNightMode: state.toggleNightMode,
  }));

  const targets = useSkymapStore((state) => state.targets);
  const setFocusTarget = useSkymapStore((state) => state.changeFocusTarget);
  const updateTwilightData = useSkymapStore((state) => state.saveAllTargets);

  useEffect(() => {
    updateTwilightData();
  }, [updateTwilightData]);

  useEffect(() => {
    const fovXCalc =
      ((57.3 / viewState.fovData.focalLength) *
        viewState.fovData.xPixels *
        viewState.fovData.xPixelSize) /
      1000;
    const fovYCalc =
      ((57.3 / viewState.fovData.focalLength) *
        viewState.fovData.yPixels *
        viewState.fovData.yPixelSize) /
      1000;

    setViewState({
      fovX: fovXCalc,
      fovY: fovYCalc,
      aladinShowFov: Math.max(2 * fovXCalc, 4),
    });
    calculateFovPoints();
  }, [viewState.fovData, setViewState, calculateFovPoints]);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black">
      {/* 主地图容器 - 充分利用空间 */}
      <div className="absolute inset-0 z-0">
        <AladinLiteView
          ra={viewState.targetRa}
          dec={viewState.targetDec}
          fov={viewState.aladinShowFov}
          onCenterChange={updateScreenPosition}
          fov_points={viewState.fovPoints}
          fov_size={viewState.aladinShowFov}
        />
      </div>

      {/* 右侧工具栏 - 优化定位和滚动 */}
      <motion.div
        initial="expanded"
        animate={viewState.rightPanelCollapsed ? "collapsed" : "expanded"}
        variants={{
          expanded: { opacity: 1, x: 0 },
          collapsed: { opacity: 0, x: "100%" },
        }}
        className="fixed right-0 top-0 bottom-0 z-40"
      >
        <Card className="h-full w-64 md:w-72 flex flex-col bg-black/50 backdrop-blur-md border-l border-white/10">
          <CardContent className="flex-1 p-4 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {/* 目标信息区域 */}
                <div className="space-y-2 text-sm">
                  <div className="text-white/90 flex justify-between">
                    <span>当前目标:</span>
                    <span>{targets.find((t) => t.checked)?.name || "无"}</span>
                  </div>
                  <div className="text-white/90 flex justify-between">
                    <span>Ra:</span>
                    <span>{viewState.targetRa.toFixed(5)}</span>
                  </div>
                  <div className="text-white/90 flex justify-between">
                    <span>Dec:</span>
                    <span>{viewState.targetDec.toFixed(5)}</span>
                  </div>
                </div>

                {/* 控制按钮组 */}
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewState({ showFovDialog: true })}
                    className="w-full"
                  >
                    视场参数
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        搜索目标
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>搜索目标</SheetTitle>
                        <SheetDescription>
                          在这里可以搜索你感兴趣的目标
                        </SheetDescription>
                      </SheetHeader>
                      <ObjectSearch />
                      <SheetFooter>
                        <SheetClose asChild>
                          <Button type="button" variant="secondary">
                            关闭
                          </Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        目标管理
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>目标管理</SheetTitle>
                        <SheetDescription>
                          在这里可以管理你添加的目标
                        </SheetDescription>
                      </SheetHeader>
                      <ObjectManagement on_choice_maken={() => {}} />
                      <SheetFooter>
                        <SheetClose asChild>
                          <Button type="button" variant="secondary">
                            关闭
                          </Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
                {/* 工具按钮组 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={updateTargetCenter}
                  >
                    更新中心
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={updateTargetCenter}
                    disabled={targets.find((t) => t.checked) == null}
                  >
                    更新坐标
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setFocusTarget({
                        name: "-",
                        ra: viewState.targetRa,
                        dec: viewState.targetDec,
                        rotation: viewState.cameraRotation,
                        flag: "",
                        tag: "",
                        target_type: "",
                        size: 0,
                        checked: false,
                      })
                    }
                  >
                    新建目标
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {}}
                  >
                    移动居中
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex-none justify-end p-2 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePanel("right")}
              className="text-white/80 hover:text-white"
            >
              {viewState.rightPanelCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* 底部控制栏 - 改进定位和响应式 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[clamp(300px,95%,1024px)] z-40">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert className="bg-black/50 backdrop-blur-md border border-white/10 text-white p-2">
            <div className="flex justify-between items-center text-xs lg:text-sm">
              <span>中心坐标:</span>
              <span>
                Ra: {viewState.screenRa.toFixed(5)}; Dec:{" "}
                {viewState.screenDec.toFixed(5)}
              </span>
            </div>
          </Alert>

          <div className="flex items-center justify-center gap-2 bg-black/50 backdrop-blur-md rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom("in")}
              className="text-white/80 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Slider
              value={[viewState.zoomLevel]}
              min={0.2}
              max={5}
              step={0.1}
              className="w-24"
              onValueChange={([value]) => setViewState({ zoomLevel: value })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom("out")}
              className="text-white/80 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewState({ showGrid: !viewState.showGrid })}
              className={`text-white/80 hover:text-white ${
                viewState.showGrid ? "bg-white/20" : ""
              }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setViewState({
                  showConstellations: !viewState.showConstellations,
                })
              }
              className={`text-white/80 hover:text-white ${
                viewState.showConstellations ? "bg-white/20" : ""
              }`}
            >
              <Compass className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNightMode}
              className="text-white/80 hover:text-white"
            >
              {viewState.nightMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewState({ showTopTools: false })}
              className="bg-black/30 backdrop-blur-sm text-white/80 hover:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Logo - 优化位置和动画 */}
      <motion.div
        className="fixed left-4 top-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full z-50 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{
          duration: 10,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <Image
          src="/atom.png"
          width={32}
          height={32}
          alt="logo"
          className="w-6 h-6"
          priority
        />
      </motion.div>

      <FOVSettingDialog open_dialog={Boolean(viewState.showFovDialog)} />
    </div>
  );
};

export default ImageFraming;
