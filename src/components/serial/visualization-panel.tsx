"use client";

import { useState, useMemo } from "react";
import { useSerialStore } from "@/stores/serial";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  BarChart3,
  LineChartIcon,
  AreaChartIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ChartType = "line" | "area" | "bar";

// 定义图表数据点类型
interface ChartDataPoint {
  time: string;
  [key: string]: string | number | undefined;
}

const COLORS = {
  temperature: "#ff5555",
  humidity: "#5555ff",
  pressure: "#55aa55",
};

export function VisualizationPanel() {
  const { tabs, activeTabId, clearDataPoints, theme } = useSerialStore();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    temperature: true,
    humidity: true,
    pressure: true,
  });
  const [chartType, setChartType] = useState<ChartType>("line");

  // Get active tab
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId]
  );

  // Get data points from active tab (wrapped in useMemo to avoid dependency changes)
  const dataPoints = useMemo(
    () => activeTab?.dataPoints || [],
    [activeTab?.dataPoints]
  );

  // Format data for chart
  const chartData = useMemo(() => {
    return dataPoints.reduce((acc: ChartDataPoint[], point) => {
      const last = acc[acc.length - 1];
      const time = new Date(point.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      if (last && last.time === time) {
        last[point.type] = point.value;
      } else {
        const newPoint: ChartDataPoint = { time };
        newPoint[point.type] = point.value;
        acc.push(newPoint);
      }

      return acc;
    }, []);
  }, [dataPoints]);

  // Get unique data types
  const dataTypes = useMemo(
    () => Array.from(new Set(dataPoints.map((point) => point.type))),
    [dataPoints]
  );

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleExportData = () => {
    // Create CSV data
    const headers = ["timestamp", ...dataTypes];
    const csvRows = [headers.join(",")];

    chartData.forEach((point: ChartDataPoint) => {
      const row = [
        point.time,
        ...dataTypes.map((type) =>
          point[type] !== undefined ? point[type] : ""
        ),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `serial-data-${new Date().toISOString().slice(0, 19)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (dataPoints.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-700 dark:border-gray-800 transition-colors duration-200">
      <div className="flex justify-between items-center p-2">
        <div className="font-medium text-white flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          数据可视化
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            onClick={handleExportData}
          >
            <Download className="h-3 w-3 mr-1" />
            导出
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            onClick={clearDataPoints}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            清除
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-2">
              <div className="flex flex-wrap justify-between items-center mb-2">
                <div className="flex flex-wrap gap-4">
                  {dataTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${type}`}
                        checked={selectedTypes[type]}
                        onCheckedChange={() => toggleType(type)}
                        style={{
                          backgroundColor: selectedTypes[type]
                            ? COLORS[type as keyof typeof COLORS]
                            : undefined,
                        }}
                      />
                      <Label
                        htmlFor={`check-${type}`}
                        className="text-sm font-medium text-white dark:text-gray-200 capitalize transition-colors duration-200"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center">
                  <Tabs
                    value={chartType}
                    onValueChange={(v) => setChartType(v as ChartType)}
                  >
                    <TabsList className="bg-[#1a2b3d] dark:bg-gray-800 transition-colors duration-200">
                      <TabsTrigger
                        value="line"
                        className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
                      >
                        <LineChartIcon className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="area"
                        className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
                      >
                        <AreaChartIcon className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="bar"
                        className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme === "dark" ? "#444" : "#ccc"}
                      />
                      <XAxis
                        dataKey="time"
                        stroke={theme === "dark" ? "#999" : "#666"}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke={theme === "dark" ? "#999" : "#666"} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            theme === "dark" ? "#1a2b3d" : "#fff",
                          border: `1px solid ${
                            theme === "dark" ? "#2a3b4d" : "#ddd"
                          }`,
                          color: theme === "dark" ? "#fff" : "#000",
                        }}
                      />
                      <Legend />
                      {dataTypes.map(
                        (type) =>
                          selectedTypes[type] && (
                            <Line
                              key={type}
                              type="monotone"
                              dataKey={type}
                              stroke={COLORS[type as keyof typeof COLORS]}
                              activeDot={{ r: 8 }}
                              name={
                                type.charAt(0).toUpperCase() + type.slice(1)
                              }
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              animationDuration={500}
                            />
                          )
                      )}
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme === "dark" ? "#444" : "#ccc"}
                      />
                      <XAxis
                        dataKey="time"
                        stroke={theme === "dark" ? "#999" : "#666"}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke={theme === "dark" ? "#999" : "#666"} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            theme === "dark" ? "#1a2b3d" : "#fff",
                          border: `1px solid ${
                            theme === "dark" ? "#2a3b4d" : "#ddd"
                          }`,
                          color: theme === "dark" ? "#fff" : "#000",
                        }}
                      />
                      <Legend />
                      {dataTypes.map(
                        (type) =>
                          selectedTypes[type] && (
                            <Area
                              key={type}
                              type="monotone"
                              dataKey={type}
                              stroke={COLORS[type as keyof typeof COLORS]}
                              fill={COLORS[type as keyof typeof COLORS] + "40"}
                              name={
                                type.charAt(0).toUpperCase() + type.slice(1)
                              }
                              activeDot={{ r: 8 }}
                              animationDuration={500}
                            />
                          )
                      )}
                    </AreaChart>
                  ) : (
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme === "dark" ? "#444" : "#ccc"}
                      />
                      <XAxis
                        dataKey="time"
                        stroke={theme === "dark" ? "#999" : "#666"}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis stroke={theme === "dark" ? "#999" : "#666"} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            theme === "dark" ? "#1a2b3d" : "#fff",
                          border: `1px solid ${
                            theme === "dark" ? "#2a3b4d" : "#ddd"
                          }`,
                          color: theme === "dark" ? "#fff" : "#000",
                        }}
                      />
                      <Legend />
                      {dataTypes.map(
                        (type) =>
                          selectedTypes[type] && (
                            <Bar
                              key={type}
                              dataKey={type}
                              fill={COLORS[type as keyof typeof COLORS]}
                              name={
                                type.charAt(0).toUpperCase() + type.slice(1)
                              }
                              animationDuration={500}
                            />
                          )
                      )}
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
