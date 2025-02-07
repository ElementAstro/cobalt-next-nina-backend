"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useGuiderStore } from "@/stores/guidingStore";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Power,
  PlayCircle,
  StopCircle,
  Settings2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Navigation,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function GuiderPage() {
  const guider = useGuiderStore();
  const [isLandscape, setIsLandscape] = useState(false);

  const handleResize = useCallback(() => {
    setIsLandscape(window.innerWidth > window.innerHeight);
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      handleResize();
      const container = document.querySelector(".container");
      if (container) {
        if (window.innerWidth > window.innerHeight) {
          container.classList.add("landscape");
        } else {
          container.classList.remove("landscape");
        }
      }
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleResize]);

  useEffect(() => {
    guider.getGuiderInfo();
    guider.getGuideStepsHistory();
  }, [guider]);

  const handleConnect = async () => {
    try {
      await guider.connect();
      toast.success("成功连接到导星器");
    } catch (error) {
      toast.error((error as Error).message || "无法连接到导星器", {
        duration: 5000,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await guider.disconnect();
      toast.success("成功断开与导星器的连接");
    } catch (error) {
      toast.error((error as Error).message || "无法断开与导星器的连接", {
        duration: 5000,
      });
    }
  };

  const handleStartGuiding = async (calibrate = false) => {
    try {
      await guider.startGuiding(calibrate);
      toast.success("导星已开始");
    } catch (error) {
      toast.error((error as Error).message || "无法启动导星", {
        duration: 5000,
      });
    }
  };

  const handleStopGuiding = async () => {
    try {
      await guider.stopGuiding();
      toast.success("导星已停止");
    } catch (error) {
      toast.error((error as Error).message || "无法停止导星", {
        duration: 5000,
      });
    }
  };

  const handleClearCalibration = async () => {
    try {
      await guider.clearCalibration();
      toast.success("校准数据已清除");
    } catch (error) {
      toast.error((error as Error).message || "无法清除校准数据", {
        duration: 5000,
      });
    }
  };

  const guidingData =
    guider.guideStepsHistory?.GuideSteps.map((step) => ({
      x: step.Id,
      yRA: step.RADistanceRaw,
      yDEC: step.DECDistanceRaw,
    })) || [];

  return (
    <motion.div
      className={cn(
        "container mx-auto p-4 h-[calc(100vh-4rem)]",
        "flex flex-col gap-4",
        isLandscape ? "landscape-mode" : ""
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={cn(
          "flex-1 grid gap-4 overflow-hidden",
          "grid-cols-1",
          isLandscape ? "grid-cols-2 max-h-[calc(100vh-8rem)]" : ""
        )}
      >
        {/* Guider Status Panel */}
        <Card className="overflow-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-6 w-6 animate-pulse" />
              导星器状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Power className="w-4 h-4" />
                  连接状态
                </Label>
                <Badge
                  variant={guider.isConnected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {guider.isConnected ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {guider.isConnected ? "已连接" : "未连接"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  导星状态
                </Label>
                <Badge
                  variant={guider.isGuiding ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {guider.isGuiding ? (
                    <Activity className="w-3 h-3 animate-pulse" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                  {guider.isGuiding ? "导星中" : "停止"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>赤经误差</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.RMSError?.RA?.Arcseconds.toFixed(2)}{" "}
                  arcsec
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>赤纬误差</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.RMSError?.Dec?.Arcseconds.toFixed(2)}{" "}
                  arcsec
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>总误差</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.RMSError?.Total?.Arcseconds.toFixed(2)}{" "}
                  arcsec
                </Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>像素比例</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.PixelScale}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>上次导星步进 (RA)</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.LastGuideStep?.RADistanceRaw}
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label>上次导星步进 (DEC)</Label>
                <Label className="font-mono">
                  {guider.guiderInfo?.LastGuideStep?.DECDistanceRaw}
                </Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
                onClick={() => handleStartGuiding()}
                disabled={!guider.isConnected}
              >
                {guider.isGuiding ? (
                  <>
                    <StopCircle className="w-4 h-4 animate-spin" />
                    停止导星
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    开始导星
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guider Control Panel */}
        <Card className="overflow-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                导星器控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">连接</TabsTrigger>
                  <TabsTrigger value="guiding">导星</TabsTrigger>
                  <TabsTrigger value="advanced">高级</TabsTrigger>
                </TabsList>

                <TabsContent value="connection">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>连接状态</Label>
                      {guider.isConnected ? (
                        <Button
                          variant="destructive"
                          onClick={handleDisconnect}
                          disabled={guider.isLoading}
                        >
                          断开连接
                        </Button>
                      ) : (
                        <Button
                          onClick={handleConnect}
                          disabled={guider.isLoading}
                        >
                          连接
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="guiding">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>导星状态</Label>
                      {guider.isGuiding ? (
                        <Button
                          variant="destructive"
                          onClick={handleStopGuiding}
                          disabled={guider.isLoading}
                        >
                          停止导星
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartGuiding()}
                          disabled={guider.isLoading}
                        >
                          开始导星
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced">
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>校准设置</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>清除校准数据</Label>
                            <Button
                              onClick={handleClearCalibration}
                              disabled={guider.isLoading || !guider.isConnected}
                            >
                              清除
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </motion.div>
        </Card>
      </div>

      {/* Guiding Graph */}
      <Card className="overflow-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            导星图表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {guidingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={guidingData}
                  margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    label={{ value: "步进", position: "bottom", offset: 0 }}
                  />
                  <YAxis
                    label={{
                      value: "误差 (像素)",
                      angle: -90,
                      position: "left",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="yRA"
                    stroke="#8884d8"
                    name="RA"
                  />
                  <Line
                    type="monotone"
                    dataKey="yDEC"
                    stroke="#82ca9d"
                    name="DEC"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Label>暂无导星数据</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
