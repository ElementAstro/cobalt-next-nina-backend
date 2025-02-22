"use client";

import React, { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Save, Download, RefreshCw } from "lucide-react";
import { useGuidingStore } from "@/stores/guiding/guidingStore";

interface ChartEvent {
  chartX?: number;
  isTooltipActive?: boolean;
}

const HistoryGraph: React.FC = () => {
  const {
    points,
    showTrendLine,
    colors,
    animationSpeed,
    pointRadius,
    lineThickness,
  } = useGuidingStore((state) => state.historyGraph);

  // 状态管理
  const [xAxisType, setXAxisType] = useState<"number" | "category">("number");
  const [yAxisType, setYAxisType] = useState<"number" | "category">("number");
  const [xAxisDomain, setXAxisDomain] = useState<[number, number]>([0, 100]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 100]);
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [lineType, setLineType] = useState<"linear" | "monotone" | "step">(
    "monotone"
  );

  // 动画效果
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // 图表组件
  const Chart = React.memo(() => {
    const chartMargins = useMemo(
      () => ({
        top: 10,
        right: 20,
        left: 10,
        bottom: 5,
      }),
      []
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-[200px] min-h-[200px]"
      >
        <ResponsiveContainer>
          <LineChart
            data={points}
            margin={chartMargins}
            onMouseDown={(e) => {
              if (e && typeof e.chartX === "number") {
                setXAxisDomain([e.chartX, e.chartX + 100]);
              }
            }}
            onMouseMove={(e: ChartEvent) => {
              if (e && e.isTooltipActive && typeof e.chartX === "number") {
                setXAxisDomain([e.chartX - 50, e.chartX + 50]);
              }
            }}
            onMouseUp={() => {
              setXAxisDomain([0, 100]);
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.secondary}
              opacity={0.3}
            />
            <XAxis
              dataKey="x"
              type={xAxisType}
              domain={xAxisDomain}
              stroke={colors.text}
              allowDataOverflow={true}
              tickFormatter={(value) => value.toString()}
              interval="preserveStartEnd"
              height={20}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type={yAxisType}
              domain={yAxisDomain}
              stroke={colors.text}
              allowDataOverflow={true}
              tickFormatter={(value) => value.toFixed(1)}
              interval="preserveStartEnd"
              width={40}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: `1px solid ${colors.primary}`,
                borderRadius: "4px",
                fontSize: "12px",
                padding: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: colors.text }}
              itemStyle={{ color: colors.text }}
              cursor={{ stroke: colors.accent, strokeWidth: 1 }}
            />
            <Line
              type={lineType}
              dataKey="y"
              stroke={colors.primary}
              strokeWidth={lineThickness}
              dot={{ r: pointRadius, fill: colors.primary }}
              activeDot={{
                r: pointRadius + 2,
                fill: colors.accent,
                stroke: colors.background,
              }}
              animationDuration={animationSpeed * 1000}
              isAnimationActive={true}
            />
            {showTrendLine && (
              <Line
                type="monotone"
                dataKey="y"
                stroke={colors.accent}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                animationDuration={animationDuration}
                isAnimationActive={true}
              />
            )}
            <ReferenceLine
              y={50}
              stroke={colors.primary}
              strokeDasharray="3 3"
              label={{
                value: "参考线",
                fill: colors.text,
                fontSize: 10,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    );
  });

  Chart.displayName = "Chart";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full p-4 space-y-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex flex-col space-y-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">历史追踪</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              实时监控导航性能和稳定性
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-grow h-full">
                <Chart />
              </div>
              <Card className="flex-shrink-0 border-0 shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Select
                      value={xAxisType}
                      onValueChange={(value) => {
                        if (value === "number" || value === "category") {
                          setXAxisType(value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 bg-transparent">
                        <SelectValue placeholder="X轴类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">数字</SelectItem>
                        <SelectItem value="category">类别</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={yAxisType}
                      onValueChange={(value) => {
                        if (value === "number" || value === "category") {
                          setYAxisType(value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 bg-transparent">
                        <SelectValue placeholder="Y轴类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">数字</SelectItem>
                        <SelectItem value="category">类别</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setXAxisDomain([0, 100]);
                        setYAxisDomain([0, 100]);
                        toast({
                          title: "已重置",
                          description: "坐标轴范围已恢复默认",
                        });
                      }}
                      className="h-8"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      重置
                    </Button>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8"
                      >
                        <Settings2 className="w-4 h-4 mr-1" />
                        图表设置
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>图表设置</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="axis" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="axis">坐标轴</TabsTrigger>
                          <TabsTrigger value="style">样式</TabsTrigger>
                        </TabsList>
                        <TabsContent value="axis" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm">X轴范围</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={xAxisDomain[0]}
                                  onChange={(e) =>
                                    setXAxisDomain([
                                      Number(e.target.value),
                                      xAxisDomain[1],
                                    ])
                                  }
                                  className="h-8"
                                  type="number"
                                />
                                <span>-</span>
                                <Input
                                  value={xAxisDomain[1]}
                                  onChange={(e) =>
                                    setXAxisDomain([
                                      xAxisDomain[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="h-8"
                                  type="number"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm">Y轴范围</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={yAxisDomain[0]}
                                  onChange={(e) =>
                                    setYAxisDomain([
                                      Number(e.target.value),
                                      yAxisDomain[1],
                                    ])
                                  }
                                  className="h-8"
                                  type="number"
                                />
                                <span>-</span>
                                <Input
                                  value={yAxisDomain[1]}
                                  onChange={(e) =>
                                    setYAxisDomain([
                                      yAxisDomain[0],
                                      Number(e.target.value),
                                    ])
                                  }
                                  className="h-8"
                                  type="number"
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="style" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm">线条类型</label>
                              <Select
                                value={lineType}
                                onValueChange={(value) => {
                                  if (
                                    value === "linear" ||
                                    value === "monotone" ||
                                    value === "step"
                                  ) {
                                    setLineType(value);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="linear">直线</SelectItem>
                                  <SelectItem value="monotone">平滑曲线</SelectItem>
                                  <SelectItem value="step">阶梯线</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm">动画时长 (ms)</label>
                              <Input
                                type="number"
                                value={animationDuration}
                                onChange={(e) =>
                                  setAnimationDuration(Number(e.target.value))
                                }
                                className="h-8"
                                min="0"
                                max="5000"
                                step="100"
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      <DialogFooter className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "设置已应用",
                              description: "图表设置更新成功",
                            });
                          }}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          应用设置
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const svgElement = document.querySelector(
                        ".recharts-wrapper svg"
                      );
                      if (svgElement) {
                        const svgData = new XMLSerializer().serializeToString(
                          svgElement
                        );
                        const blob = new Blob([svgData], {
                          type: "image/svg+xml",
                        });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "history-graph.svg";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        toast({
                          title: "导出成功",
                          description: "图表已导出为SVG格式",
                        });
                      }
                    }}
                    className="w-full h-8"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    导出图表
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default HistoryGraph;
