"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Focus,
  Thermometer,
  Clock,
  Filter,
  ZoomIn,
  History,
  Save,
  Stars,
  Microscope,
  PlayCircle,
  RefreshCw,
  GaugeCircle,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// 引入 store
import {
  useSequencerStore,
  useAutofocusConfig,
  useExecutionStatus,
  useFocusQualityMetrics,
  SequencerStateData,
} from "@/stores/sequencer";

// 定义自动对焦配置类型
type AutofocusConfigKey = keyof SequencerStateData["autofocusConfig"];
type AutofocusConfigValue = boolean | number | string | Record<string, number>;

export function AutofocusSettings() {
  // 使用 store 中的配置
  const autofocusConfig = useAutofocusConfig();
  const executionStatus = useExecutionStatus();
  const setConfig = useSequencerStore((state) => state.setAutofocusConfig);
  const deviceStatus = useSequencerStore((state) => state.deviceStatus);
  const focusHistory = useSequencerStore((state) => state.focusHistory);
  const lastFocusTime = useSequencerStore((state) => state.lastFocusTime);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 移除未使用的状态
  // const [isSaving, setIsSaving] = useState(false);
  // const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // 类型安全的配置更新
  const handleConfigChange = (
    key: AutofocusConfigKey,
    value: AutofocusConfigValue
  ) => {
    setConfig({ [key]: value });
  };

  // 添加聚焦历史记录显示
  const renderFocusHistory = () => (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-medium">聚焦历史</h3>
      <div className="text-xs text-gray-400">
        上次聚焦: {lastFocusTime?.toLocaleString() || "从未"}
      </div>
      {focusHistory.slice(-3).map((record, index) => (
        <div key={index} className="text-xs grid grid-cols-3 gap-2">
          <span>位置: {record.position}</span>
          <span>温度: {record.temperature}°C</span>
          <span>HFD: {record.hfd}</span>
        </div>
      ))}
    </div>
  );

  const focusQualityMetrics = useFocusQualityMetrics();

  // 修复 Recharts 用法，改用 ResponsiveContainer 和 LineChart 组件
  const renderFocusQualityChart = () => {
    const data = focusQualityMetrics.focusScoreHistory.map((record) => ({
      timestamp: record.timestamp.toISOString(),
      score: record.score,
      hfd: record.hfd,
    }));

    return (
      <div className="h-32 mt-2">
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 20, left: 40 }}
          >
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "none" }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="对焦得分"
              stroke="#4F46E5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="hfd"
              name="HFD"
              stroke="#F59E0B"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="h-[60vh] overflow-hidden">
      {" "}
      {/* 增加高度 */}
      <motion.div
        className="bg-gray-900 rounded-md border border-gray-700 h-full flex flex-col"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-1.5 hover:bg-gray-800/50"
            >
              <div className="flex items-center space-x-2">
                <Focus className="h-4 w-4" />
                <span className="text-sm font-medium">自动聚焦</span>
              </div>
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden flex-1"
              >
                <ScrollArea className="h-full">
                  <CollapsibleContent className="p-2 space-y-1.5">
                    {" "}
                    {/* 减小间距 */}
                    {/* 设备状态显示优化 */}
                    <div className="flex items-center justify-between text-xs bg-gray-800/50 p-1.5 rounded-md">
                      <div className="flex items-center space-x-1">
                        <GaugeCircle className="w-3 h-3" />
                        <span>对焦器状态</span>
                      </div>
                      <span>位置: {deviceStatus.focuser.position}</span>
                    </div>
                    {/* 自动对焦设置网格优化 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {/* 开关设置组 */}
                      <div className="space-y-1.5 bg-gray-800/30 p-1.5 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ZoomIn className="w-3 h-3 text-teal-500" />
                            <Label htmlFor="af-enabled" className="text-xs">
                              启用自动对焦
                            </Label>
                          </div>
                          <Switch
                            id="af-enabled"
                            checked={autofocusConfig.enabled}
                            onCheckedChange={(checked) =>
                              handleConfigChange("enabled", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Filter className="w-3 h-3 text-blue-500" />
                            <Label
                              htmlFor="af-filter-change"
                              className="text-xs"
                            >
                              滤镜更换时对焦
                            </Label>
                          </div>
                          <Switch
                            id="af-filter-change"
                            checked={autofocusConfig.autofocusOnFilterChange}
                            onCheckedChange={(checked) =>
                              handleConfigChange(
                                "autofocusOnFilterChange",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Thermometer className="w-3 h-3 text-red-500" />
                            <Label htmlFor="af-temp-change" className="text-xs">
                              温度变化时对焦
                            </Label>
                          </div>
                          <Switch
                            id="af-temp-change"
                            checked={
                              autofocusConfig.autofocusOnTemperatureChange
                            }
                            onCheckedChange={(checked) =>
                              handleConfigChange(
                                "autofocusOnTemperatureChange",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* 数值设置组 */}
                      <div className="space-y-1.5 bg-gray-800/30 p-1.5 rounded-md">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <Label htmlFor="af-interval" className="text-xs">
                              对焦间隔 (分钟)
                            </Label>
                          </div>
                          <Input
                            id="af-interval"
                            type="number"
                            value={autofocusConfig.interval}
                            onChange={(e) =>
                              handleConfigChange(
                                "interval",
                                parseInt(e.target.value)
                              )
                            }
                            className="h-7 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="af-temp-delta" className="text-xs">
                            温度变化阈值 (°C)
                          </Label>
                          <Input
                            id="af-temp-delta"
                            type="number"
                            value={autofocusConfig.tempDelta}
                            onChange={(e) =>
                              handleConfigChange(
                                "tempDelta",
                                parseFloat(e.target.value)
                              )
                            }
                            className="h-7 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="af-method" className="text-xs">
                            对焦方法
                          </Label>
                          <Select
                            value={autofocusConfig.method}
                            onValueChange={(value) =>
                              handleConfigChange("method", value)
                            }
                          >
                            <SelectTrigger id="af-method">
                              <SelectValue placeholder="选择对焦方法" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hfd">
                                半通量直径 (HFD)
                              </SelectItem>
                              <SelectItem value="curvature">
                                曲率分析
                              </SelectItem>
                              <SelectItem value="bahtinov">
                                巴赫金诺夫面具
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {/* 对焦质量分析优化 */}
                    <div className="space-y-1.5 bg-gray-800/30 p-1.5 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Microscope className="w-3 h-3 text-purple-500" />
                        <h3 className="text-xs font-medium">对焦质量分析</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Stars className="w-3 h-3" />
                            <span>最小星数</span>
                          </div>
                          <Input
                            type="number"
                            value={focusQualityMetrics.minStars}
                            onChange={(e) =>
                              handleConfigChange(
                                "minStars",
                                parseInt(e.target.value)
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-gray-400">目标HFD</span>
                          <Input
                            type="number"
                            value={focusQualityMetrics.targetHFD}
                            onChange={(e) =>
                              handleConfigChange(
                                "targetHFD",
                                parseFloat(e.target.value)
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-gray-400">最大HFD</span>
                          <Input
                            type="number"
                            value={focusQualityMetrics.maxHFD}
                            onChange={(e) =>
                              handleConfigChange(
                                "maxHFD",
                                parseFloat(e.target.value)
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="h-24">
                        {" "}
                        {/* 减小图表高度 */}
                        {renderFocusQualityChart()}
                      </div>
                    </div>
                    {/* 操作按钮和状态优化 */}
                    <div className="flex items-center justify-between mt-2">
                      {executionStatus.state === "running" && (
                        <div className="flex items-center text-yellow-500 text-xs">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          <span>正在对焦...</span>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />
                          开始对焦
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setConfig({
                              ...useSequencerStore.getState().autofocusConfig,
                              method: useSequencerStore.getState()
                                .autofocusConfig.method as
                                | "hfd"
                                | "curvature"
                                | "bahtinov",
                            })
                          }
                          disabled={executionStatus.state === "running"}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          保存设置
                        </Button>
                      </div>
                    </div>
                    {/* 聚焦历史优化 */}
                    <div className="bg-gray-800/30 p-1.5 rounded-md">
                      <div className="flex items-center space-x-2 mb-2">
                        <History className="w-3 h-3 text-gray-400" />
                        <h3 className="text-sm font-medium">聚焦历史</h3>
                      </div>
                      {renderFocusHistory()}
                    </div>
                    {/* 错误提示优化 */}
                    {executionStatus.errors.length > 0 && (
                      <div className="mt-1.5 p-1.5 bg-red-900/20 border border-red-900 rounded-md">
                        <p className="text-red-500 text-xs">
                          {executionStatus.errors.join(", ")}
                        </p>
                      </div>
                    )}
                  </CollapsibleContent>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>
      </motion.div>
    </div>
  );
}
