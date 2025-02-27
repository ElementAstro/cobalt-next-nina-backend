// components/widgets/NetworkWidget.jsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Network, ArrowDownToLine, ArrowUpToLine, Wifi } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";
import CountUp from "react-countup";

export default function NetworkWidget() {
  const { systemInfo, historicalData, settings } = useSystemStore();
  const [activeTab, setActiveTab] = useState("traffic");

  // 格式化字节数
  const formatBytes = (bytes: number, perSecond = false): string => {
    if (bytes === 0) return "0 Bytes";

    const isDecimal = settings.unitDisplay === "decimal";
    const k = isDecimal ? 1000 : 1024;
    const sizes = isDecimal
      ? ["B", "KB", "MB", "GB", "TB"]
      : ["B", "KiB", "MiB", "GiB", "TiB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    const unit = sizes[i] + (perSecond ? "/s" : "");
    return `${formattedValue} ${unit}`;
  };

  // 准备图表数据
  const chartData = useMemo(() => {
    return Array.from(
      { length: historicalData.network.download.length },
      (_, i) => ({
        name: i,
        download: historicalData.network.download[i],
        upload: historicalData.network.upload[i],
      })
    );
  }, [historicalData.network]);

  return (
    <AnimatedCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <span>网络</span>
        </CardTitle>
        <CardDescription>网络接口与流量监控</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="traffic" className="flex-1">
              流量
            </TabsTrigger>
            <TabsTrigger value="interfaces" className="flex-1">
              接口
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex-1">
              图表
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="traffic" className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ArrowDownToLine className="h-4 w-4 text-green-500" />
                      <span className="text-sm">下载</span>
                    </div>
                    <div className="font-medium text-lg">
                      <CountUp
                        end={systemInfo.network.bytesReceived / 1024 / 1024}
                        decimals={2}
                        duration={1}
                        suffix=" MB"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(systemInfo.network.bytesReceived / 5, true)}{" "}
                      (平均)
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <ArrowUpToLine className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">上传</span>
                    </div>
                    <div className="font-medium text-lg">
                      <CountUp
                        end={systemInfo.network.bytesSent / 1024 / 1024}
                        decimals={2}
                        duration={1}
                        suffix=" MB"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(systemInfo.network.bytesSent / 5, true)}{" "}
                      (平均)
                    </div>
                  </motion.div>
                </div>

                <div className="p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Network className="h-4 w-4" />
                    <span className="text-sm">总流量</span>
                  </div>
                  <div className="font-medium">
                    {formatBytes(
                      systemInfo.network.bytesReceived +
                        systemInfo.network.bytesSent
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interfaces" className="pt-4">
                <div className="space-y-3">
                  {systemInfo.network.interfaces.map((iface, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className="p-3 rounded-md bg-muted/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">{iface.name}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                        活跃
                      </span>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="chart" className="pt-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorDownload"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorUpload"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value) => [
                          formatBytes(value as number, true),
                          "",
                        ]}
                        labelFormatter={() => ""}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        name="下载"
                        dataKey="download"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorDownload)"
                      />
                      <Area
                        type="monotone"
                        name="上传"
                        dataKey="upload"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorUpload)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  网络流量历史记录 (字节/秒)
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
}
