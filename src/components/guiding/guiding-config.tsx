"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, Settings, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import useCalibrationStore from "@/stores/guiding/calibrationStore";
import { useMediaQuery } from "react-responsive";
import { toast } from "@/hooks/use-toast";

type SettingChangeHandler<T> = (value: T) => void;

export default function GuidingConfig() {
  const {
    exposure,
    setExposure,
    gain,
    setGain,
    rotationSpeed,
    setRotationSpeed,
    zoomLevel,
    setZoomLevel,
    autoRotate,
    setAutoRotate,
    showAnimation,
    setShowAnimation,
    handleRecalibrate,
  } = useCalibrationStore();

  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });
  const isMobile = useMediaQuery({ query: "(max-width: 640px)" });

  const [isLoading, setIsLoading] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  const handleSettingChange = React.useCallback(
    <T,>(setter: SettingChangeHandler<T>) => {
      return (value: T) => {
        setter(value);
        setIsDirty(true);
      };
    },
    []
  );

  const handleRecalibrateClick = async () => {
    try {
      setIsLoading(true);
      await handleRecalibrate();
      toast({
        title: "重新校准成功",
        description: "所有参数已重置为默认值",
      });
      setIsDirty(false);
    } catch (error) {
      toast({
        title: "重新校准失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setIsLoading(true);
      if (exposure <= 0) {
        throw new Error("曝光值必须大于0");
      }
      toast({
        title: "启动成功",
        description: "校准程序已成功启动",
      });
      setIsDirty(false);
    } catch (error) {
      toast({
        title: "启动失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "停止成功",
        description: "校准程序已停止",
      });
    } catch (error) {
      toast({
        title: "停止失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`w-full mx-auto ${
        isLandscape && isMobile ? "h-screen overflow-auto" : "max-w-4xl"
      } p-4`}
    >
      <Card className="border-0 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-bold">校准参数</CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>校准参数设置</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="exposure" className="text-right text-xs">
                      曝光值 (ms)
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        id="exposure"
                        min={1}
                        max={5000}
                        step={1}
                        value={[exposure]}
                        onValueChange={([value]) => handleSettingChange(setExposure)(value)}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        当前值: {exposure}ms
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="gain" className="text-right text-xs">
                      增益
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        id="gain"
                        min={0}
                        max={100}
                        step={1}
                        value={[gain]}
                        onValueChange={([value]) => handleSettingChange(setGain)(value)}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        当前值: {gain}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="zoomLevel" className="text-right text-xs">
                      缩放倍率
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        id="zoomLevel"
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={[zoomLevel]}
                        onValueChange={([value]) => handleSettingChange(setZoomLevel)(value)}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        当前值: {zoomLevel}x
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-2">
                    <Label htmlFor="rotationSpeed" className="text-right text-xs">
                      旋转速度
                    </Label>
                    <div className="col-span-3">
                      <Slider
                        id="rotationSpeed"
                        min={0}
                        max={100}
                        step={1}
                        value={[rotationSpeed]}
                        onValueChange={([value]) => handleSettingChange(setRotationSpeed)(value)}
                      />
                      <div className="mt-1 text-xs text-muted-foreground">
                        当前值: {rotationSpeed}°/s
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoRotate"
                      checked={autoRotate}
                      onCheckedChange={(checked) =>
                        handleSettingChange(setAutoRotate)(checked as boolean)
                      }
                    />
                    <Label htmlFor="autoRotate" className="text-xs">启用自动旋转</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showAnimation"
                      checked={showAnimation}
                      onCheckedChange={(checked) =>
                        handleSettingChange(setShowAnimation)(checked as boolean)
                      }
                    />
                    <Label htmlFor="showAnimation" className="text-xs">显示动画</Label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <p className="text-xs text-muted-foreground">
              根据您的校准设置，调整参数以达到最佳效果。
            </p>
            <div
              className={`grid ${
                isLandscape && isMobile
                  ? "grid-cols-1 gap-2"
                  : "grid-cols-1 md:grid-cols-2 gap-3"
              }`}
            >
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-semibold mb-1">基础设置</h3>
                <Table className="text-xs">
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">曝光值</TableCell>
                      <TableCell>{exposure}ms</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">放大倍率</TableCell>
                      <TableCell>{zoomLevel}x</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">增益</TableCell>
                      <TableCell>{gain}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-semibold mb-1">旋转设置</h3>
                <Table className="text-xs">
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">旋转速度</TableCell>
                      <TableCell>{rotationSpeed}°/s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">自动旋转</TableCell>
                      <TableCell>{autoRotate ? "启用" : "禁用"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">显示动画</TableCell>
                      <TableCell>{showAnimation ? "启用" : "禁用"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>

        <CardFooter className="flex justify-between px-6 pb-4">
          <div className="flex items-center text-xs text-muted-foreground">
            {isDirty && "有未保存的更改"}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalibrateClick}
              disabled={isLoading}
            >
              <RotateCw className="w-4 h-4 mr-1" />
              重新校准
            </Button>
            <Button 
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
            >
              {isLoading ? "处理中..." : "启动校准"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
              disabled={isLoading}
            >
              停止校准
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
