"use client";

import { useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Focus,
  ThermometerSun,
  Filter,
  Sparkles,
  ArrowRight,
  RotateCcw,
  MoreVertical,
  Save,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSequencerStore } from "@/stores/sequencer";
import { type AutofocusConfig } from "@/stores/sequencer";

interface SettingRowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}

const SettingRow = memo(({ label, description, icon, children, error }: SettingRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-800/30"
    role="group"
    aria-labelledby={`setting-${label}`}
  >
    <div className="flex items-center gap-3">
      {icon && (
        <div className="text-gray-400 transition-colors group-hover:text-gray-300">
          {icon}
        </div>
      )}
      <div>
        <Label id={`setting-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-gray-400">{description}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </div>
    </div>
    <div>{children}</div>
  </motion.div>
));

SettingRow.displayName = "SettingRow";

export function AutofocusSettings() {
  const { autofocusConfig, setAutofocusConfig } = useSequencerStore();

  const handleConfigChange = useCallback(
    <K extends keyof AutofocusConfig>(
      key: K,
      value: AutofocusConfig[K]
    ) => {
      setAutofocusConfig({ [key]: value });
    },
    [setAutofocusConfig]
  );

  const resetToDefaults = useCallback(() => {
    setAutofocusConfig({
      enabled: false,
      interval: 30,
      method: "hfd",
      minStars: 10,
      targetHFD: 2.5,
      maxHFD: 4.0,
      autofocusOnFilterChange: true,
      autofocusOnTemperatureChange: true,
      stepSize: 10,
      backlash: 0,
      samples: 5,
      tolerance: 0.1,
      maxIterations: 10,
    });
  }, [setAutofocusConfig]);

  const saveToPreset = useCallback(() => {
    // TODO: 保存到预设
  }, []);

  return (
    <Card 
      className="bg-gray-900/50 backdrop-blur-sm border-gray-800"
      role="region"
      aria-label="自动对焦设置"
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="w-5 h-5 text-teal-500" />
            <CardTitle className="text-xl">自动对焦设置</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefaults}
                    className="h-8 w-8 p-0 hover:bg-gray-800/50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">重置为默认设置</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重置为默认设置</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-800/50"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">更多选项</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>更多选项</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={saveToPreset}>
                  <Save className="w-4 h-4 mr-2" />
                  保存为预设
                </DropdownMenuItem>
                <DropdownMenuItem>
                  导入配置
                </DropdownMenuItem>
                <DropdownMenuItem>
                  导出配置
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <SettingRow
            label="启用自动对焦"
            description="在序列执行期间自动进行对焦"
            icon={<Focus className="w-4 h-4" />}
          >
            <Switch
              checked={autofocusConfig.enabled}
              onCheckedChange={(checked) =>
                handleConfigChange("enabled", checked)
              }
              aria-label="启用自动对焦"
            />
          </SettingRow>

          <SettingRow
            label="对焦间隔"
            description="每次自动对焦之间的时间间隔（分钟）"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            <div className="w-44">
              <Slider
                min={5}
                max={120}
                step={5}
                value={[autofocusConfig.interval]}
                onValueChange={([value]) =>
                  handleConfigChange("interval", value)
                }
                aria-label="对焦间隔"
              />
            </div>
          </SettingRow>

          <SettingRow
            label="对焦方法"
            description="选择自动对焦使用的算法"
            icon={<Sparkles className="w-4 h-4" />}
          >
            <Select
              value={autofocusConfig.method}
              onValueChange={(value) =>
                handleConfigChange(
                  "method",
                  value as AutofocusConfig["method"]
                )
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hfd">HFD</SelectItem>
                <SelectItem value="curvature">曲率</SelectItem>
                <SelectItem value="bahtinov">巴赫天诺夫</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            label="切换滤镜时对焦"
            description="在更换滤镜后自动进行对焦"
            icon={<Filter className="w-4 h-4" />}
          >
            <Switch
              checked={autofocusConfig.autofocusOnFilterChange}
              onCheckedChange={(checked) =>
                handleConfigChange("autofocusOnFilterChange", checked)
              }
              aria-label="切换滤镜时对焦"
            />
          </SettingRow>

          <SettingRow
            label="温度变化时对焦"
            description="当温度变化超过阈值时自动对焦"
            icon={<ThermometerSun className="w-4 h-4" />}
          >
            <Switch
              checked={autofocusConfig.autofocusOnTemperatureChange}
              onCheckedChange={(checked) =>
                handleConfigChange(
                  "autofocusOnTemperatureChange",
                  checked
                )
              }
              aria-label="温度变化时对焦"
            />
          </SettingRow>

          {/* 高级设置 */}
          <motion.div 
            className="space-y-4 pt-4 border-t border-gray-800"
            role="region"
            aria-label="高级设置"
          >
            <Label className="text-sm text-gray-400">高级设置</Label>
            
            <SettingRow
              label="步进大小"
              description="每次对焦移动的步数"
            >
              <div className="w-44">
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[autofocusConfig.stepSize]}
                  onValueChange={([value]) =>
                    handleConfigChange("stepSize", value)
                  }
                  aria-label="步进大小"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="反向间隙"
              description="补偿反向运动的间隙"
            >
              <div className="w-44">
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[autofocusConfig.backlash]}
                  onValueChange={([value]) =>
                    handleConfigChange("backlash", value)
                  }
                  aria-label="反向间隙"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="采样数"
              description="每个位置的采样次数"
            >
              <div className="w-44">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[autofocusConfig.samples]}
                  onValueChange={([value]) =>
                    handleConfigChange("samples", value)
                  }
                  aria-label="采样数"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="容差"
              description="HFD 值的接受范围"
            >
              <div className="w-44">
                <Slider
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={[autofocusConfig.tolerance]}
                  onValueChange={([value]) =>
                    handleConfigChange("tolerance", value)
                  }
                  aria-label="容差"
                />
              </div>
            </SettingRow>

            <SettingRow
              label="最大迭代次数"
              description="对焦过程的最大尝试次数"
            >
              <div className="w-44">
                <Slider
                  min={3}
                  max={20}
                  step={1}
                  value={[autofocusConfig.maxIterations]}
                  onValueChange={([value]) =>
                    handleConfigChange("maxIterations", value)
                  }
                  aria-label="最大迭代次数"
                />
              </div>
            </SettingRow>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
