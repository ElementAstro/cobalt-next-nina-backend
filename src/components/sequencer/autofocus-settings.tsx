"use client";

import { useState } from "react";
import { useMediaQuery } from "react-responsive";
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
  Save,
  RefreshCw,
  AlertTriangle,
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
} from "@/store/useSequencerStore";

export function AutofocusSettings() {
  // 使用 store 中的配置
  const autofocusConfig = useAutofocusConfig();
  const executionStatus = useExecutionStatus();
  const setAutofocusConfig = useSequencerStore(
    (state) => state.setAutofocusConfig
  );
  const runAutofocus = useSequencerStore((state) => state.runAutofocus);

  const deviceStatus = useSequencerStore((state) => state.deviceStatus);
  const focusHistory = useSequencerStore((state) => state.focusHistory);
  const lastFocusTime = useSequencerStore((state) => state.lastFocusTime);
  const checkSystemStatus = useSequencerStore(
    (state) => state.checkSystemStatus
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleConfigChange = (key: string, value: any) => {
    setAutofocusConfig({ [key]: value });
  };

  // 添加自动对焦前的系统检查
  const handleRunAutofocus = async () => {
    const systemReady = await checkSystemStatus();
    if (!systemReady) return;

    if (!deviceStatus.focuser.connected) {
      alert("对焦器未连接");
      return;
    }

    await runAutofocus();
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
    <div className="h-[50vh] overflow-hidden">
      <motion.div
        className="bg-gray-900 rounded-md border border-gray-700 p-1 h-full flex flex-col"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-2 hover:bg-gray-800/50"
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
                  <CollapsibleContent className="p-2 space-y-2">
                    {/* 添加设备状态显示 */}
                    <div className="grid grid-cols-4 gap-1 text-sm">
                      <div className="col-span-2 flex items-center space-x-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            deviceStatus.focuser.connected
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span>对焦器状态</span>
                      </div>
                      <div className="col-span-2">
                        位置: {deviceStatus.focuser.position}
                      </div>
                    </div>

                    {/* 自动对焦设置 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="af-enabled">启用自动对焦</Label>
                        <Switch
                          id="af-enabled"
                          checked={autofocusConfig.enabled}
                          onCheckedChange={(checked) =>
                            handleConfigChange("enabled", checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="af-interval">对焦间隔 (分钟)</Label>
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="af-temp-delta">温度变化阈值 (°C)</Label>
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="af-method">对焦方法</Label>
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
                            <SelectItem value="curvature">曲率分析</SelectItem>
                            <SelectItem value="bahtinov">
                              巴赫金诺夫面具
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="af-filter-change">滤镜更换时对焦</Label>
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
                        <Label htmlFor="af-temp-change">温度变化时对焦</Label>
                        <Switch
                          id="af-temp-change"
                          checked={autofocusConfig.autofocusOnTemperatureChange}
                          onCheckedChange={(checked) =>
                            handleConfigChange(
                              "autofocusOnTemperatureChange",
                              checked
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* 添加对焦质量分析 */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">对焦质量分析</h3>
                      <div className="grid grid-cols-3 gap-1 text-sm">
                        <div>
                          <span className="text-gray-400">最小星数</span>
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

                      {renderFocusQualityChart()}

                      {focusQualityMetrics.focusScoreHistory.length > 0 && (
                        <div className="text-xs text-gray-400">
                          最新对焦得分:{" "}
                          {focusQualityMetrics.focusScoreHistory
                            .slice(-1)[0]
                            .score.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* 状态和操作按钮 */}
                    <div className="flex flex-wrap gap-2 justify-end mt-4">
                      {executionStatus.state === "running" && (
                        <div className="flex items-center text-yellow-500">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span>正在对焦...</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunAutofocus}
                        disabled={
                          executionStatus.state === "running" ||
                          !autofocusConfig.enabled
                        }
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        立即对焦
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          setAutofocusConfig(
                            useSequencerStore.getState().autofocusConfig
                          )
                        }
                        disabled={isSaving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存设置
                      </Button>
                    </div>

                    {/* 添加聚焦历史 */}
                    {renderFocusHistory()}

                    {/* 错误提示 */}
                    {executionStatus.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-900 rounded">
                        <p className="text-red-500 text-sm">
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
