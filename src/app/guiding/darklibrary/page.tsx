"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DarkFieldLibrary from "@/components/guiding/darklibrary/darkfield-library";
import { useDarkFieldStore } from "@/stores/guiding/darkFieldStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  History,
  Settings2,
  Calendar,
  FileDown,
  Plus,
} from "lucide-react";
import StatsCard from "@/components/guiding/darklibrary/stats-card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DarkLibraryPage() {
  const [timeRange, setTimeRange] = useState("30days");
  const store = useDarkFieldStore();
  const { statistics, history, systemStatus } = store;

  // 使用 useCallback 包裹 handleTimeRangeChange，确保依赖正确
  const handleTimeRangeChange = useCallback(
    (value: string) => {
      setTimeRange(value);
      const days = value === "7days" ? 7 : value === "30days" ? 30 : 90;
      store.fetchHistory(days);
    },
    [store]
  );

  // 首次加载时获取数据
  useEffect(() => {
    store.fetchStatistics();
    handleTimeRangeChange("30days");
  }, [store, handleTimeRangeChange]);

  const formatStatValue = (key: string, value: number) => {
    switch (key) {
      case "librarySize":
        return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      case "totalTime":
        return `${(value / 3600).toFixed(1)}h`;
      case "averageExposure":
        return `${value.toFixed(1)}s`;
      case "avgTemperature":
        return `${value.toFixed(1)}°C`;
      case "successRate":
        return `${(value * 100).toFixed(1)}%`;
      case "compression":
        return `${value.toFixed(1)}x`;
      default:
        return value.toString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[100dvh] flex flex-col overflow-hidden bg-background"
    >
      {/* 固定头部 */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="flex-none z-50 bg-background/80 backdrop-blur-lg border-b"
      >
        <div className="px-4 py-3 md:px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex flex-col"
              >
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  暗场库管理
                </h1>
                <p className="text-sm text-muted-foreground">
                  优化您的天文摄影暗场收集
                </p>
              </motion.div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="animate-in fade-in slide-in-from-top-1"
                >
                  专业版
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 animate-in fade-in slide-in-from-top-2">
                  实时同步
                </Badge>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {systemStatus.isCameraConnected && (
                <Badge variant="outline" className="bg-green-500/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  相机已连接
                </Badge>
              )}
              {systemStatus.isTemperatureStable && (
                <Badge variant="outline" className="bg-blue-500/10">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  温度稳定
                </Badge>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 可滚动的主内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-4 mx-auto">
          <Tabs defaultValue="library" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px] sticky top-0 z-10 bg-background/80 backdrop-blur">
              <TabsTrigger value="library">创建暗场库</TabsTrigger>
              <TabsTrigger value="stats">统计信息</TabsTrigger>
              <TabsTrigger value="history">历史记录</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="min-h-[calc(100vh-12rem)]">
              <AnimatePresence mode="wait">
                <DarkFieldLibrary />
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="总帧数"
                  value={statistics.totalFrames}
                  description="所有暗场帧总数"
                  icon={BarChart3}
                />
                <StatsCard
                  title="平均曝光"
                  value={formatStatValue(
                    "averageExposure",
                    statistics.averageExposure
                  )}
                  description="平均曝光时间"
                  icon={Settings2}
                />
                <StatsCard
                  title="最近创建"
                  value={statistics.lastCreated}
                  description="最后更新时间"
                  icon={History}
                />
                <StatsCard
                  title="库大小"
                  value={formatStatValue("librarySize", statistics.librarySize)}
                  description="暗场库占用空间"
                  icon={Settings2}
                />
                <StatsCard
                  title="总曝光时间"
                  value={formatStatValue("totalTime", statistics.totalTime)}
                  description="累计曝光时间"
                  icon={Calendar}
                />
                <StatsCard
                  title="平均温度"
                  value={formatStatValue(
                    "avgTemperature",
                    statistics.avgTemperature
                  )}
                  description="传感器温度"
                  icon={Settings2}
                />
                <StatsCard
                  title="成功率"
                  value={formatStatValue("successRate", statistics.successRate)}
                  description="暗场创建成功率"
                  icon={BarChart3}
                />
                <StatsCard
                  title="压缩率"
                  value={formatStatValue("compression", statistics.compression)}
                  description="平均压缩比例"
                  icon={FileDown}
                />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="h-[calc(100vh-16rem)]">
                <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10">
                  <CardTitle>暗场库历史趋势</CardTitle>
                  <Select
                    value={timeRange}
                    onValueChange={handleTimeRangeChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择时间范围" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">最近7天</SelectItem>
                      <SelectItem value="30days">最近30天</SelectItem>
                      <SelectItem value="90days">最近90天</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)]">
                  <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={history}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString()
                          }
                        />
                        <YAxis stroke="#888888" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid #444444",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="frames"
                          name="帧数"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          name="温度(°C)"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="exposure"
                          name="曝光(s)"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="successCount"
                          name="成功帧数"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalCount"
                          name="总帧数"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 浮动操作按钮 - 调整位置确保不会被遮挡 */}
      <motion.div
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
      >
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={store.startCreation}
        >
          <Plus className="mr-2 h-4 w-4" />
          快速创建
        </Button>
      </motion.div>
    </motion.div>
  );
}
