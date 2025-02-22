"use client";

import { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { BadPixelData, VisualMode } from "@/types/guiding/badpixel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PixelInfoProps {
  data: BadPixelData;
  visualMode: VisualMode;
  isLandscape: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onManualAddPixel: (pixel: number) => void;
  manualPixel: string;
  setManualPixel: (value: string) => void;
}

const COLORS = {
  hot: "#ff4444",
  cold: "#4444ff",
  normal: "#44ff44",
};

const PixelInfo = memo(({
  data,
  visualMode,
  isLandscape,
  expanded,
  onToggleExpand,
  onManualAddPixel,
  manualPixel,
  setManualPixel,
}: PixelInfoProps) => {
  const totalPixels = data.width * data.height;
  const hotPixelPercentage = (data.hotPixels.length / totalPixels) * 100;
  const coldPixelPercentage = (data.coldPixels.length / totalPixels) * 100;
  const normalPixelPercentage = 100 - hotPixelPercentage - coldPixelPercentage;

  // 统计数据计算
  const statistics = useMemo(() => ({
    totalBadPixels: data.hotPixels.length + data.coldPixels.length,
    badPixelRatio: ((data.hotPixels.length + data.coldPixels.length) / totalPixels * 100).toFixed(4),
    hotToColdRatio: (data.hotPixels.length / (data.coldPixels.length || 1)).toFixed(2),
    density: (data.hotPixels.length + data.coldPixels.length) / (data.width * data.height),
    hotPixelCount: data.hotPixels.length,
    coldPixelCount: data.coldPixels.length,
  }), [data]);

  // 饼图数据
  const pieData = useMemo(() => [
    { name: "热坏点", value: hotPixelPercentage },
    { name: "冷坏点", value: coldPixelPercentage },
    { name: "正常", value: normalPixelPercentage },
  ], [hotPixelPercentage, coldPixelPercentage, normalPixelPercentage]);

  // 输入处理
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setManualPixel(value);
    }
  }, [setManualPixel]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && manualPixel) {
      onManualAddPixel(Number(manualPixel));
    }
  }, [manualPixel, onManualAddPixel]);

  // 计算进度条颜色
  const progressColor = useMemo(() => {
    const ratio = Number(statistics.badPixelRatio);
    if (ratio > 5) return "bg-red-500";
    if (ratio > 2) return "bg-yellow-500";
    return "bg-green-500";
  }, [statistics.badPixelRatio]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "space-y-4",
        isLandscape && "grid grid-cols-2 gap-4"
      )}
    >
      {/* 概览卡片 */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {statistics.totalBadPixels}
              </div>
              <div className="text-xs text-gray-400">总坏点数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {statistics.badPixelRatio}%
              </div>
              <div className="text-xs text-gray-400">坏点率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {statistics.hotToColdRatio}
              </div>
              <div className="text-xs text-gray-400">热冷比</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分布图 */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <CardTitle className="text-sm mb-4">坏点分布</CardTitle>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  outerRadius={60}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? COLORS.hot
                          : index === 1
                          ? COLORS.cold
                          : COLORS.normal
                      }
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 手动添加区域 */}
      <Card className="bg-gray-900/50 border-gray-800 col-span-full">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label htmlFor="manual-pixel-input">手动添加坏点</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="manual-pixel-input"
                  type="text"
                  value={manualPixel}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="输入像素坐标"
                  className={cn(
                    "bg-gray-800/50",
                    "border-gray-700",
                    "focus:border-blue-500",
                    "placeholder:text-gray-500"
                  )}
                />
                <AnimatePresence>
                  {manualPixel && !/^\d+$/.test(manualPixel) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-6 left-0 flex items-center text-red-400 text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>请输入有效的数字</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onManualAddPixel(Number(manualPixel))}
                      disabled={!manualPixel || !/^\d+$/.test(manualPixel)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      添加
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>添加指定坐标的坏点</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息 */}
      {visualMode === "table" && (
        <Card className="bg-gray-900/50 border-gray-800 col-span-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-sm">详细数据</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="hover:bg-gray-800"
              >
                {expanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>类型</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>占比</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm">
                      <TableRow>
                        <TableCell>热坏点</TableCell>
                        <TableCell>{statistics.hotPixelCount}</TableCell>
                        <TableCell>{hotPixelPercentage.toFixed(4)}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              hotPixelPercentage > 1 ? "destructive" : "default"
                            }
                          >
                            {hotPixelPercentage > 1 ? "警告" : "正常"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>冷坏点</TableCell>
                        <TableCell>{statistics.coldPixelCount}</TableCell>
                        <TableCell>{coldPixelPercentage.toFixed(4)}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              coldPixelPercentage > 1 ? "destructive" : "default"
                            }
                          >
                            {coldPixelPercentage > 1 ? "警告" : "正常"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* 处理进度 */}
      <Card className="bg-gray-900/50 border-gray-800 col-span-full">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between">
              <CardTitle className="text-sm">处理进度</CardTitle>
              <span className="text-sm text-gray-400">
                {statistics.badPixelRatio}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className={cn("h-full transition-all", progressColor)}
                style={{ width: `${Number(statistics.badPixelRatio)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

PixelInfo.displayName = "PixelInfo";

export default PixelInfo;
