"use client";

import { motion } from "framer-motion";
import { FC, useMemo } from "react";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
} from "recharts";
import { calculateDensityMap, trendData } from "@/utils/pixel-density";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";

const pixelSchema = z
  .number()
  .min(0, "像素坐标不能小于0")
  .max(4144 * 2822 - 1, "像素坐标超出范围");

// 定义颜色常量
const COLORS = {
  hot: "#ff4444",
  cold: "#4444ff",
  normal: "#44ff44",
};

interface PixelInfoProps {
  data: {
    width: number;
    height: number;
    hotPixels: number[];
    coldPixels: number[];
  };
  visualMode: "table" | "graph";
  isLandscape: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onManualAddPixel: (pixel: number) => void;
  manualPixel: string;
  setManualPixel: (value: string) => void;
}

const PixelInfo: FC<PixelInfoProps> = ({
  data,
  visualMode,
  isLandscape,
  expanded,
  onToggleExpand,
  onManualAddPixel,
  manualPixel,
  setManualPixel,
}) => {
  const { toast } = useToast();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleAddPixel = async () => {
    try {
      const parsedPixel = pixelSchema.parse(Number(manualPixel));
      await onManualAddPixel(parsedPixel);
      setManualPixel("");
      toast({
        title: "成功添加坏点",
        description: `坐标 ${parsedPixel} 已添加`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "输入错误",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "添加失败",
          description: "未知错误",
          variant: "destructive",
        });
      }
    }
  };

  const statistics = useMemo(
    () => ({
      totalBadPixels: data.hotPixels.length + data.coldPixels.length,
      badPixelRatio: (
        ((data.hotPixels.length + data.coldPixels.length) /
          (data.width * data.height)) *
        100
      ).toFixed(4),
      hotToColdRatio: (
        data.hotPixels.length / (data.coldPixels.length || 1)
      ).toFixed(2),
      densityMap: calculateDensityMap(data),
    }),
    [data]
  );

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  const totalPixels = data.width * data.height;
  const hotPixelPercentage = (data.hotPixels.length / totalPixels) * 100;
  const coldPixelPercentage = (data.coldPixels.length / totalPixels) * 100;

  // 准备图表数据
  const distributionData = [
    { name: "热坏点", count: data.hotPixels.length },
    { name: "冷坏点", count: data.coldPixels.length },
  ];

  const pieData = [
    { name: "热坏点", value: hotPixelPercentage },
    { name: "冷坏点", value: coldPixelPercentage },
    { name: "正常", value: 100 - hotPixelPercentage - coldPixelPercentage },
  ];

  // 假设 data.pixels 是一个包含坏点坐标的数组
  const scatterData = [
    ...data.hotPixels.map((pixel) => ({
      x: pixel % data.width,
      y: Math.floor(pixel / data.width),
      type: "hot",
    })),
    ...data.coldPixels.map((pixel) => ({
      x: pixel % data.width,
      y: Math.floor(pixel / data.width),
      type: "cold",
    })),
  ];

  // 添加表格数据展示
  const renderDataTable = () => (
    <Card className="bg-gray-900/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm">详细数据</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {expanded && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>占比</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>热坏点</TableCell>
                <TableCell>{data.hotPixels.length}</TableCell>
                <TableCell>{hotPixelPercentage.toFixed(4)}%</TableCell>
                <TableCell>
                  <Badge
                    variant={hotPixelPercentage > 1 ? "destructive" : "default"}
                  >
                    {hotPixelPercentage > 1 ? "警告" : "正常"}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>冷坏点</TableCell>
                <TableCell>{data.coldPixels.length}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      className={cn("space-y-4", {
        "grid grid-cols-2 gap-4": isLandscape,
        "flex flex-col": !isLandscape,
      })}
    >
      {/* 快速概览和趋势图部分 - 总是使用全宽 */}
      <div className={cn("space-y-4", isLandscape && "col-span-2")}>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900">
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div
                  className={cn(
                    "font-bold text-red-400",
                    isMobile ? "text-xl" : "text-2xl"
                  )}
                >
                  {statistics.totalBadPixels}
                </div>
                <div className="text-xs text-gray-400">总坏点数</div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    "font-bold text-blue-400",
                    isMobile ? "text-xl" : "text-2xl"
                  )}
                >
                  {statistics.badPixelRatio}%
                </div>
                <div className="text-xs text-gray-400">坏点率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 趋势图 - 移动端高度优化 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-4", isMobile && "p-3")}>
            <CardTitle className="text-sm mb-4">坏点变化趋势</CardTitle>
            <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hot" stroke={COLORS.hot} />
                <Line type="monotone" dataKey="cold" stroke={COLORS.cold} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 图表网格布局 */}
      <div
        className={cn(
          "grid gap-4",
          isLandscape ? "col-span-2 grid-cols-2" : "grid-cols-1"
        )}
      >
        {/* 相机信息卡片 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <div className="grid grid-cols-2 gap-2">
              <div className={cn("text-sm", isMobile && "text-xs")}>
                <p className="text-gray-400">分辨率</p>
                <p>
                  {data.width} x {data.height}
                </p>
              </div>
              <div className={cn("text-sm", isMobile && "text-xs")}>
                <p className="text-gray-400">总像素</p>
                <p>{data.width * data.height}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计图表 - 移动端高度优化 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <CardTitle className={cn("text-sm mb-4", isMobile && "mb-2")}>
              坏点分布
            </CardTitle>
            <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="数量">
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? COLORS.hot : COLORS.cold}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 饼图和散点图 - 响应式调整 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <CardTitle className={cn("text-sm mb-4", isMobile && "mb-2")}>
              坏点类型占比
            </CardTitle>
            <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 50 : 80}
                  fill="#8884d8"
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
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 坏点位置分布 */}
        <Card className={cn("bg-gray-900/50", isLandscape && "col-span-2")}>
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <CardTitle className={cn("text-sm mb-4", isMobile && "mb-2")}>
              坏点位置分布
            </CardTitle>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <ScatterChart
                margin={
                  isMobile
                    ? { top: 10, right: 10, bottom: 10, left: 10 }
                    : { top: 20, right: 20, bottom: 20, left: 20 }
                }
              >
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="X" unit="px" />
                <YAxis type="number" dataKey="y" name="Y" unit="px" />
                <ZAxis type="category" dataKey="type" name="类型" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter
                  name="热坏点"
                  data={scatterData.filter(
                    (p: { type: string }) => p.type === "hot"
                  )}
                  fill={COLORS.hot}
                />
                <Scatter
                  name="冷坏点"
                  data={scatterData.filter(
                    (p: { type: string }) => p.type === "cold"
                  )}
                  fill={COLORS.cold}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 控制面板部分 - 总是全宽 */}
      <div className={cn("space-y-4", isLandscape && "col-span-2")}>
        {/* 手动添加坏点 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <Label
              htmlFor="manual-pixel"
              className={cn("text-sm", isMobile && "text-xs")}
            >
              手动添加坏点
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="manual-pixel"
                value={manualPixel}
                onChange={(e) => setManualPixel(e.target.value)}
                placeholder={
                  isMobile ? "输入坐标" : "输入像素坐标 (0 - 11696767)"
                }
                className="flex-1"
              />
              <Button
                onClick={handleAddPixel}
                disabled={!manualPixel}
                size={isMobile ? "sm" : "default"}
              >
                添加
              </Button>
            </div>
          </CardContent>
        </Card>

        {visualMode === "table" && renderDataTable()}

        {/* 进度条 */}
        <Card className="bg-gray-900/50">
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <CardTitle className={cn("text-sm mb-4", isMobile && "mb-2")}>
              处理进度
            </CardTitle>
            <Progress
              value={(scatterData.length / (data.width * data.height)) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default PixelInfo;
