"use client";

import { X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCalibrationStore from "@/stores/guiding/calibrationStore";
import { useMediaQuery } from "react-responsive";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function GuidingConfig() {
  // 使用新版 store 获取校准相关状态（已移除未使用的 settings 和 updateSettings）
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

  const [isLoading, setIsLoading] = useState(false);

  // 示例操作：启动校准
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
    } catch (err) {
      toast({
        title: "启动失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 示例操作：停止校准
  const handleStop = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "停止成功",
        description: "校准程序已停止",
      });
    } catch (err) {
      toast({
        title: "停止失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full mx-auto ${
        isLandscape && isMobile ? "h-screen overflow-auto" : "max-w-4xl"
      } p-2`}
    >
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
                <DialogTitle className="text-lg">校准参数设置</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-3">
                {/* 曝光值 */}
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="exposure" className="text-right text-xs">
                    曝光值
                  </Label>
                  <Input
                    id="exposure"
                    type="number"
                    value={exposure}
                    onChange={(e) => setExposure(Number(e.target.value))}
                    className="col-span-3 h-8 text-xs"
                  />
                </div>
                {/* 放大倍率 */}
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="zoomLevel" className="text-right text-xs">
                    放大倍率
                  </Label>
                  <Input
                    id="zoomLevel"
                    type="number"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="col-span-3 h-8 text-xs"
                  />
                </div>
                {/* 增益 */}
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="gain" className="text-right text-xs">
                    增益
                  </Label>
                  <Input
                    id="gain"
                    type="number"
                    value={gain}
                    onChange={(e) => setGain(Number(e.target.value))}
                    className="col-span-3 h-8 text-xs"
                  />
                </div>
                {/* 旋转速度 */}
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="rotationSpeed" className="text-right text-xs">
                    旋转速度
                  </Label>
                  <Input
                    id="rotationSpeed"
                    type="number"
                    value={rotationSpeed}
                    onChange={(e) => setRotationSpeed(Number(e.target.value))}
                    className="col-span-3 h-8 text-xs"
                  />
                </div>
                {/* 启用自动旋转 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoRotate"
                    checked={autoRotate}
                    onCheckedChange={(checked) =>
                      setAutoRotate(checked as boolean)
                    }
                  />
                  <Label htmlFor="autoRotate">启用自动旋转</Label>
                </div>
                {/* 显示动画 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAnimation"
                    checked={showAnimation}
                    onCheckedChange={(checked) =>
                      setShowAnimation(checked as boolean)
                    }
                  />
                  <Label htmlFor="showAnimation">显示动画</Label>
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
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
              {/* 基础设置 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-sm font-semibold mb-1">基础设置</h3>
                <Table className="text-xs">
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">曝光值</TableCell>
                      <TableCell>{exposure}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">放大倍率</TableCell>
                      <TableCell>{zoomLevel}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">增益</TableCell>
                      <TableCell>{gain}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </motion.div>
              {/* 旋转设置 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold mb-1">旋转设置</h3>
                <Table className="text-xs">
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">旋转速度</TableCell>
                      <TableCell>{rotationSpeed}</TableCell>
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
            <div className="flex items-center justify-end space-x-2 text-xs">
              <Button onClick={handleStart} disabled={isLoading} size="sm">
                {isLoading ? "处理中..." : "启动校准"}
              </Button>
              <Button
                onClick={handleStop}
                variant="destructive"
                disabled={isLoading}
                size="sm"
              >
                停止校准
              </Button>
              <Button onClick={handleRecalibrate} size="sm">
                重新校准
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
