"use client";

import { useState, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Filter,
  RefreshCw,
  Clock,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";

// 数据验证Schema
const CalibrationDataSchema = z.object({
  raStars: z.number().min(0),
  decStars: z.number().min(0),
  cameraAngle: z.number(),
  orthogonalError: z.number(),
  raSpeed: z.number().min(0),
  decSpeed: z.number().min(0),
});

const CalibrationSettingsSchema = z.object({
  modifiedAt: z.string(),
  focalLength: z.number().positive(),
  resolution: z.string(),
  raDirection: z.string(),
  decValue: z.number(),
  rotationAngle: z.number(),
});

interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

export default function CalibrationData() {
  const { data, settings } = useCalibrationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRate] = useState(85); // Removed unused setter
  const [activeTab, setActiveTab] = useState("calibration");

  // 状态配置
  const statusConfigs: Record<string, StatusConfig> = {
    excellent: {
      color: "text-green-400",
      bgColor: "bg-green-400/20",
      borderColor: "border-green-400",
      icon: CheckCircle2,
      text: "优秀",
    },
    good: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
      borderColor: "border-yellow-400",
      icon: AlertTriangle,
      text: "良好",
    },
    poor: {
      color: "text-red-400",
      bgColor: "bg-red-400/20",
      borderColor: "border-red-400",
      icon: XCircle,
      text: "不佳",
    },
  };

  // 数据验证
  const validateData = useCallback(() => {
    try {
      CalibrationDataSchema.parse(data);
      CalibrationSettingsSchema.parse(settings);
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "数据验证失败",
          description: e.errors[0].message,
        });
        setError(e.errors[0].message);
      }
      return false;
    }
  }, [data, settings]);

  // 图表数据处理
  const chartData = useMemo(() => {
    const timestamps = Array.from({ length: 20 }, (_, i) => {
      const time = new Date();
      time.setMinutes(time.getMinutes() - (20 - i));
      return time.toLocaleTimeString();
    });

    return timestamps.map((time) => ({
      name: time,
      ra: Number((Math.random() * 2 - 1).toFixed(3)),
      dec: Number((Math.random() * 2 - 1).toFixed(3)),
      error: Number(Math.abs(Math.random()).toFixed(3)),
    }));
  }, []);

  // 刷新数据处理
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!validateData()) {
        return;
      }
      toast({
        title: "刷新成功",
        description: "校准数据已更新",
      });
    } catch (error) {
      setError(typeof error === 'string' ? error : '刷新失败');
      toast({
        variant: "destructive",
        title: "刷新失败",
        description: "请稍后重试",
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateData]);

  // 导出数据处理
  const handleExport = useCallback(() => {
    try {
      const exportData = JSON.stringify({ data, settings }, null, 2);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calibration-data-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "导出成功",
        description: "校准数据已导出到文件",
      });
    } catch (error) {
      setError(typeof error === 'string' ? error : '导出失败');
      toast({
        variant: "destructive",
        title: "导出失败",
        description: "请稍后重试",
      });
    }
  }, [data, settings]);

  const getCalibrationStatus = () => {
    if (successRate >= 90) return "excellent";
    if (successRate >= 70) return "good";
    return "poor";
  };

  const status = getCalibrationStatus();
  const currentStatus = statusConfigs[status];
  const StatusIcon = currentStatus.icon;

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-gray-700 bg-gray-800/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              校准状态
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "px-2 py-1",
                currentStatus.bgColor,
                currentStatus.borderColor
              )}
            >
              <StatusIcon className={cn("w-4 h-4 mr-1", currentStatus.color)} />
              <span className={currentStatus.color}>{currentStatus.text}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-700 bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{successRate}%</div>
                  <div className="text-sm text-gray-400">成功率</div>
                  <Progress
                    value={successRate}
                    className="h-2 mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{data.orthogonalError.toFixed(2)}°</div>
                  <div className="text-sm text-gray-400">正交误差</div>
                  <Progress
                    value={Math.abs(data.orthogonalError) * 10}
                    className="h-2 mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">{data.cameraAngle.toFixed(2)}°</div>
                  <div className="text-sm text-gray-400">相机角度</div>
                  <Progress
                    value={(data.cameraAngle + 180) / 3.6}
                    className="h-2 mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-700 bg-gray-800/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-gray-300">校准数据趋势</CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          isLoading ? "animate-spin" : ""
                        }`}
                      />
                      刷新
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>刷新校准数据</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400"
                      onClick={handleExport}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>导出校准数据</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <CardDescription className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            最近20分钟校准数据趋势
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                domain={[-1.5, 1.5]}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg">
                        <p className="text-sm text-gray-300 mb-1">{label}</p>
                        <p className="text-sm text-blue-400">
                          赤经: {typeof payload[0].value === 'number' ? payload[0].value.toFixed(3) : payload[0].value}
                        </p>
                        <p className="text-sm text-green-400">
                          赤纬: {typeof payload[1].value === 'number' ? payload[1].value.toFixed(3) : payload[1].value}
                        </p>
                        <p className="text-sm text-red-400">
                          误差: {typeof payload[2].value === 'number' ? payload[2].value.toFixed(3) : payload[2].value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: 10,
                }}
              />
              <ReferenceLine y={0} stroke="#4b5563" />
              <Line
                type="monotone"
                dataKey="ra"
                name="赤经"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="dec"
                name="赤纬"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="error"
                name="误差"
                stroke="#f87171"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Brush
                dataKey="name"
                height={20}
                stroke="#4b5563"
                fill="#1f2937"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-gray-700 bg-gray-800/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              详细数据
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>筛选数据</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
              <TabsTrigger
                value="calibration"
                className="data-[state=active]:bg-gray-600/50"
              >
                校准数据
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gray-600/50"
              >
                赤道仪设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calibration">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      赤经坐标:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.raStars}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      赤纬坐标:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.decStars}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      相机角度:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.cameraAngle.toFixed(1)}°
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      正交误差:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.orthogonalError.toFixed(1)}°
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      赤经速率:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.raSpeed}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      赤纬速率:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {data.decSpeed}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="settings">
              <Table>
                <TableBody>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      修改时间:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.modifiedAt}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      焦距:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.focalLength}mm
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      分辨率:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.resolution}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      赤道仪方位:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.raDirection}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-gray-400 text-xs">
                      赤经值:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.decValue}
                    </TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      旋转绝对值:
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {settings.rotationAngle}°
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            最后更新: {new Date().toLocaleTimeString()}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
