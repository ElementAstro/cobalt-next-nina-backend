"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import CalibrationCanvas from "./calibration-canvas";
import CalibrationControls from "./calibration-controls";
import CalibrationData from "./calibration-data";
import { motion, AnimatePresence } from "framer-motion";
import useCalibrationStore from "@/stores/guiding/calibrationStore";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Maximize,
  Minimize,
  Save,
  Battery,
  Signal,
  Wifi,
  Camera,
  Thermometer,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PreviewMode from "./PreviewMode";

export default function GuidingCalibration() {
  const { isLandscape, setIsLandscape } = useCalibrationStore();
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [layout, setLayout] = useState<"split" | "full">("split");
  const [panelSizes, setPanelSizes] = useState<number[]>([60, 40]);
  const [activePanel, setActivePanel] = useState<"calibration" | "preview">("calibration");

  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobileLandscape(landscape);
      setIsLandscape(landscape);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    window.screen?.orientation?.addEventListener("change", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.screen?.orientation?.removeEventListener("change", handleResize);
    };
  }, [setIsLandscape]);

  const toggleLayout = () => {
    setLayout((prev) => (prev === "split" ? "full" : "split"));
  };

  const handleLayoutChange = (sizes: number[]) => {
    setPanelSizes(sizes);
  };

  const statusItems = [
    { icon: Signal, text: "信号强度: 良好", color: "text-green-400" },
    { icon: Wifi, text: "已连接", color: "text-blue-400" },
    { icon: Battery, text: "电量: 85%", color: "text-yellow-400" },
    { icon: Camera, text: "相机: 就绪", color: "text-purple-400" },
    { icon: Thermometer, text: "温度: 18°C", color: "text-red-400" },
    { icon: Clock, text: new Date().toLocaleTimeString(), color: "text-cyan-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full mx-auto min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-gray-900"
    >
      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        {/* 状态栏 */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="backdrop-blur-md bg-gray-800/30 rounded-lg border border-gray-700/50 shadow-lg overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <AnimatePresence mode="wait">
                {statusItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <Badge
                      variant="outline"
                      className="bg-gray-800/80 px-3 py-1 hover:bg-gray-700/80 transition-colors"
                    >
                      <item.icon className={`w-4 h-4 mr-2 ${item.color}`} />
                      <span className="text-gray-200">{item.text}</span>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gray-700/50 transition-colors"
                      onClick={toggleLayout}
                    >
                      {layout === "split" ? (
                        <Maximize className="w-4 h-4" />
                      ) : (
                        <Minimize className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{layout === "split" ? "全屏显示" : "分屏显示"}</p>
                  </TooltipContent>
                </Tooltip>

                {layout === "split" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-gray-700/50 transition-colors"
                        onClick={() => setPanelSizes([60, 40])}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>保存当前布局</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Tabs
            value={activePanel}
            onValueChange={(value) => setActivePanel(value as "calibration" | "preview")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
              <TabsTrigger
                value="calibration"
                className="data-[state=active]:bg-gray-700/50 transition-all"
              >
                校准模式
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-gray-700/50 transition-all"
              >
                预览模式
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="calibration" key="calibration">
                <Card className="bg-gray-800/95 border-gray-700 shadow-lg rounded-lg backdrop-blur-sm overflow-hidden">
                  {layout === "split" ? (
                    <ResizablePanelGroup
                      direction={isLandscape || isMobileLandscape ? "horizontal" : "vertical"}
                      className="min-h-[80vh]"
                      onLayout={handleLayoutChange}
                    >
                      <ResizablePanel defaultSize={panelSizes[0]} minSize={40}>
                        <div className="h-full flex flex-col">
                          <div className="flex-grow p-2">
                            <CalibrationCanvas />
                          </div>
                          <div className="p-2">
                            <CalibrationControls />
                          </div>
                        </div>
                      </ResizablePanel>
                      <ResizableHandle className="bg-gray-700/50 hover:bg-gray-600/50 transition-colors" />
                      <ResizablePanel defaultSize={panelSizes[1]} minSize={30}>
                        <div className="h-full overflow-auto">
                          <CalibrationData />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  ) : (
                    <div className="p-4 space-y-4">
                      <CalibrationCanvas />
                      <CalibrationControls />
                      <CalibrationData />
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="preview" key="preview">
                <Card className="bg-gray-800/95 border-gray-700 shadow-lg rounded-lg backdrop-blur-sm overflow-hidden">
                  <div className="p-4">
                    <PreviewMode />
                  </div>
                </Card>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
}
