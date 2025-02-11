"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button as BaseButton } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
const Button = motion(BaseButton);
import { ChevronDown, Search, X } from "lucide-react"; // 移除未使用的图标
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface TargetSetOptions {
  coolCamera: boolean;
  unparkMount: boolean;
  meridianFlip: boolean;
  warmCamera: boolean;
  parkMount: boolean;
  autoCalibrate: boolean;
  logData: boolean;
  autoFocus: boolean;
  dithering: boolean;
  plateSolve: boolean;
  polarAlignment: boolean;
  autoGuide: boolean;
  temperatureControl: boolean;
  weatherMonitoring: boolean;
  safetyChecks: boolean;
}

const DEFAULT_OPTIONS: TargetSetOptions = {
  coolCamera: false,
  unparkMount: true,
  meridianFlip: false,
  warmCamera: false,
  parkMount: false,
  autoCalibrate: false,
  logData: false,
  autoFocus: false,
  dithering: true,
  plateSolve: false,
  polarAlignment: false,
  autoGuide: false,
  temperatureControl: false,
  weatherMonitoring: false,
  safetyChecks: true,
};

interface SwitchOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  description?: string;
  category?: string;
}

function SwitchOption({
  id,
  label,
  checked,
  onChange,
  description,
  category,
}: SwitchOptionProps) {
  return (
    <motion.div
      className="flex items-center space-x-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 relative"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {checked && (
        <motion.div
          className="absolute inset-0 bg-teal-500/10 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="flex-1">
        <Label
          htmlFor={id}
          className="flex flex-col space-y-1 text-sm text-gray-300"
        >
          <div className="flex items-center space-x-2">
            <span>{label}</span>
            {category && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-400">
                {category}
              </span>
            )}
          </div>
          {description && (
            <span className="text-xs text-gray-400">{description}</span>
          )}
        </Label>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-teal-500"
      />
    </motion.div>
  );
}

export function TargetSetHeader() {
  const { errors, clearErrors, targets, activeTargetId, updateTarget } =
    useSequencerStore();

  useEffect(() => {
    if (errors.length > 0) {
      setTimeout(clearErrors, 5000);
    }
  }, [errors, clearErrors]); // 添加 clearErrors 到依赖数组

  const [options, setOptions] = useState<TargetSetOptions>({
    ...DEFAULT_OPTIONS,
    dithering: true, // 保留默认启用的重要选项
    safetyChecks: true,
    unparkMount: true,
  });
  const [isStartOptionsCollapsed, setIsStartOptionsCollapsed] = useState(true);
  const [isEndOptionsCollapsed, setIsEndOptionsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const updateOption = (key: keyof TargetSetOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 完善toggleAll的实现
  const toggleAll = (category: "start" | "end", value: boolean) => {
    const startOptionsMap = {
      coolCamera: true,
      unparkMount: true,
      meridianFlip: true,
      autoFocus: true,
      dithering: true,
      polarAlignment: true,
      autoGuide: true,
    };

    const endOptionsMap = {
      warmCamera: true,
      parkMount: true,
      autoCalibrate: true,
      logData: true,
      plateSolve: true,
      temperatureControl: true,
      weatherMonitoring: true,
      safetyChecks: true,
    };

    const targetOptions =
      category === "start" ? startOptionsMap : endOptionsMap;

    setOptions((prev) => ({
      ...prev,
      ...Object.keys(targetOptions).reduce(
        (acc, key) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ),
    }));

    // 显示操作成功的反馈
    toast({
      title: `已${value ? "启用" : "禁用"}所有${
        category === "start" ? "开始" : "结束"
      }选项`,
      variant: value ? "default" : "destructive",
      className: value ? "bg-teal-500" : "bg-blue-500",
    });
  };

  const filteredOptions = (
    optionsList: {
      id: string;
      label: string;
      description?: string;
      category?: string;
    }[]
  ) => {
    return optionsList.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.description &&
          option.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const startOptions = filteredOptions([
    {
      id: "cool-camera",
      label: "Cool Camera",
      description: "保持相机冷却",
      category: "Temperature",
    },
    {
      id: "unpark-mount",
      label: "Unpark Mount",
      description: "解锁安装架",
      category: "Mount",
    },
    {
      id: "meridian-flip",
      label: "Meridian Flip",
      description: "经过子午线时翻转安装架",
      category: "Mount",
    },
    {
      id: "polar-alignment",
      label: "Polar Alignment",
      description: "自动极轴校准",
      category: "Alignment",
    },
    {
      id: "auto-guide",
      label: "Auto Guide",
      description: "自动导星",
      category: "Guiding",
    },
  ]);

  const endOptions = filteredOptions([
    {
      id: "warm-camera",
      label: "Warm Camera",
      description: "加热相机",
      category: "Temperature",
    },
    {
      id: "park-mount",
      label: "Park Mount",
      description: "锁定安装架",
      category: "Mount",
    },
    {
      id: "auto-calibrate",
      label: "Auto Calibrate",
      description: "自动校准",
      category: "Calibration",
    },
    {
      id: "log-data",
      label: "Log Data",
      description: "记录数据日志",
      category: "Logging",
    },
    {
      id: "plate-solve",
      label: "Plate Solve",
      description: "自动解析星图",
      category: "Imaging",
    },
    {
      id: "temperature-control",
      label: "Temperature Control",
      description: "自动温度调节",
      category: "Temperature",
    },
    {
      id: "weather-monitoring",
      label: "Weather Monitoring",
      description: "实时天气监控",
      category: "Safety",
    },
    {
      id: "safety-checks",
      label: "Safety Checks",
      description: "安全系统检查",
      category: "Safety",
    },
  ]);

  return (
    <motion.div
      className="bg-gray-900/50 p-4 rounded-lg space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      layout
    >
      <header className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-200">目标集配置</h2>
          <div className="h-4 w-px bg-gray-700" />
          <Select
            value={activeTargetId || ""}
            onValueChange={(value) =>
              updateTarget(value, {
                id: value,
                name: "",
                coordinates: {
                  ra: { h: 0, m: 0, s: 0 },
                  dec: { d: 0, m: 0, s: 0 },
                  rotation: 0,
                },
                tasks: [],
                settings: {
                  ...DEFAULT_OPTIONS,
                  delayStart: "",
                  sequenceMode: "loop",
                  startTime: "",
                  endTime: "",
                  duration: "",
                },
              })
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择目标" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((target) => (
                <SelectItem key={target.id} value={target.id}>
                  {target.name || `目标 ${target.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索选项..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-gray-800/50 border-gray-700"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700/50"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Options Panel */}
        <Collapsible
          open={!isStartOptionsCollapsed}
          onOpenChange={(open) => setIsStartOptionsCollapsed(!open)}
          className="bg-gray-800/30 rounded-lg p-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-3"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-200">起始选项</h3>
                <Badge variant="secondary" className="text-xs">
                  {startOptions.length}个选项
                </Badge>
              </div>
              <ChevronDown
                className={`h-4 w-4 transform transition-transform duration-200 ${
                  !isStartOptionsCollapsed ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>

          <AnimatePresence>
            {!isStartOptionsCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CollapsibleContent>
                  <div className="space-y-2 p-2">
                    {startOptions.map((option) => (
                      <SwitchOption
                        key={option.id}
                        {...option}
                        checked={options[option.id as keyof TargetSetOptions]}
                        onChange={() =>
                          updateOption(option.id as keyof TargetSetOptions)
                        }
                      />
                    ))}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAll("start", true)}
                        className="text-teal-500 hover:bg-teal-500/10"
                      >
                        启用全部
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAll("start", false)}
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        禁用全部
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>

        {/* End Options Panel */}
        <Collapsible
          open={!isEndOptionsCollapsed}
          onOpenChange={(open) => setIsEndOptionsCollapsed(!open)}
          className="bg-gray-800/30 rounded-lg p-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center p-3"
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-200">结束选项</h3>
                <Badge variant="secondary" className="text-xs">
                  {endOptions.length}个选项
                </Badge>
              </div>
              <ChevronDown
                className={`h-4 w-4 transform transition-transform duration-200 ${
                  !isEndOptionsCollapsed ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>

          <AnimatePresence>
            {!isEndOptionsCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CollapsibleContent>
                  <div className="space-y-2 p-2">
                    {endOptions.map((option) => (
                      <SwitchOption
                        key={option.id}
                        {...option}
                        checked={options[option.id as keyof TargetSetOptions]}
                        onChange={() =>
                          updateOption(option.id as keyof TargetSetOptions)
                        }
                      />
                    ))}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAll("end", true)}
                        className="text-teal-500 hover:bg-teal-500/10"
                      >
                        启用全部
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAll("end", false)}
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        禁用全部
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>
      </div>
    </motion.div>
  );
}
