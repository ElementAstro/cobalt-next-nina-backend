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
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2 } from "lucide-react";
import { useGuidingStore } from "@/stores/guiding/guidingStore";

interface ChartEvent {
  chartX?: number;
  isTooltipActive?: boolean;
}

const HistoryGraph: React.FC = () => {
  // 获取 store 中的 historyGraph 数据
  const {
    points,
    showTrendLine,
    colors,
    animationSpeed,
    pointRadius,
    lineThickness,
  } = useGuidingStore((state) => state.historyGraph);

  // 本地状态（坐标轴相关设置保留）
  const [xAxisType, setXAxisType] = useState<"number" | "category">("number");
  const [yAxisType, setYAxisType] = useState<"number" | "category">("number");
  const [xAxisDomain, setXAxisDomain] = useState<[number, number]>([0, 100]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 100]);
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [lineType, setLineType] = useState<"linear" | "monotone" | "step">(
    "monotone"
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const Chart = React.memo(() => {
    const chartMargins = useMemo(() => {
      return {
        top: 5,
        right: 10,
        left: 5,
        bottom: 0,
      };
    }, []);

    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={150}>
        <LineChart
          data={points}
          margin={chartMargins}
          onMouseDown={(e) => {
            if (e && typeof e.chartX === "number") {
              const { chartX } = e;
              setXAxisDomain([chartX, chartX + 100]);
            }
          }}
          onMouseMove={(e: ChartEvent) => {
            if (e && e.isTooltipActive && typeof e.chartX === "number") {
              const { chartX } = e;
              setXAxisDomain([chartX - 50, chartX + 50]);
            }
          }}
          onMouseUp={() => {
            setXAxisDomain([0, 100]);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.secondary} />
          <XAxis
            dataKey="x"
            type={xAxisType}
            domain={xAxisDomain}
            stroke="#666"
            allowDataOverflow={true}
            tickFormatter={(value) => value.toString()}
            interval="preserveStartEnd"
            height={20}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type={yAxisType}
            domain={yAxisDomain}
            stroke="#666"
            allowDataOverflow={true}
            tickFormatter={(value) => value.toFixed(1)}
            interval="preserveStartEnd"
            width={30}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              border: "1px solid #333",
              fontSize: "12px",
              padding: "4px",
            }}
            labelStyle={{ fontSize: "10px" }}
            itemStyle={{ fontSize: "10px" }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Line
            type={lineType}
            dataKey="y"
            stroke={colors.primary}
            dot={{ r: pointRadius }}
            strokeWidth={lineThickness}
            animationDuration={animationSpeed * 1000}
            isAnimationActive={false}
          />
          {showTrendLine && (
            <Line
              type="monotone"
              dataKey="y"
              stroke={colors.accent}
              strokeDasharray="5 5"
              animationDuration={animationDuration}
              isAnimationActive={false}
            />
          )}
          <ReferenceLine y={50} stroke="#666" strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    );
  });

  Chart.displayName = "Chart";

  return (
    <motion.div
      className="w-full text-white p-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-grow h-full">
          <Chart />
        </div>
        <Card className="border-gray-800 p-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1 text-xs">
            <Select
              value={xAxisType}
              onValueChange={(value) => {
                if (value === "number" || value === "category") {
                  setXAxisType(value);
                }
              }}
            >
              <SelectTrigger className="h-6 bg-transparent">
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
              <SelectTrigger className="h-6 bg-transparent">
                <SelectValue placeholder="Y轴类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">数字</SelectItem>
                <SelectItem value="category">类别</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2">
                <Settings2 className="w-3 h-3 mr-1" />
                设置
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white max-w-3xl">
              <DialogHeader>
                <DialogTitle>图表设置</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="axis" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="axis">坐标轴</TabsTrigger>
                  <TabsTrigger value="style">样式</TabsTrigger>
                </TabsList>
                <TabsContent value="axis">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-gray-400">X轴范围</label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={xAxisDomain[0]}
                          onChange={(e) =>
                            setXAxisDomain([
                              Number(e.target.value),
                              xAxisDomain[1],
                            ])
                          }
                          className="h-6 bg-transparent w-12"
                        />
                        <span className="text-xs">至</span>
                        <Input
                          value={xAxisDomain[1]}
                          onChange={(e) =>
                            setXAxisDomain([
                              xAxisDomain[0],
                              Number(e.target.value),
                            ])
                          }
                          className="h-6 bg-transparent w-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-gray-400">Y轴范围</label>
                      <div className="flex items-center gap-1">
                        <Input
                          value={yAxisDomain[0]}
                          onChange={(e) =>
                            setYAxisDomain([
                              Number(e.target.value),
                              yAxisDomain[1],
                            ])
                          }
                          className="h-6 bg-transparent w-12"
                        />
                        <span className="text-xs">至</span>
                        <Input
                          value={yAxisDomain[1]}
                          onChange={(e) =>
                            setYAxisDomain([
                              yAxisDomain[0],
                              Number(e.target.value),
                            ])
                          }
                          className="h-6 bg-transparent w-12"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="style">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">线条类型</label>
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
                        <SelectTrigger className="h-6 bg-transparent">
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">直线</SelectItem>
                          <SelectItem value="monotone">平滑曲线</SelectItem>
                          <SelectItem value="step">阶梯线</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">
                        动画时长 (毫秒)
                      </label>
                      <Input
                        type="number"
                        value={animationDuration}
                        onChange={(e) =>
                          setAnimationDuration(Number(e.target.value))
                        }
                        className="h-6 bg-transparent w-full"
                        min="0"
                        max="5000"
                        step="100"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                variant="default"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  toast({
                    title: "设置已应用",
                    description: "图表设置更新成功",
                  });
                }}
              >
                应用设置
              </Button>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </motion.div>
  );
};

export default HistoryGraph;
