"use client";

import { memo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBadPixelStore } from "@/stores/guiding/badPixelStore";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  RefreshCcw,
  Clock,
  Shield,
  Database,
  Cloud,
  History,
  Settings2,
  FlaskConical,
  EyeOff,
  Filter,
  Save,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { BadPixelOptions } from "@/types/guiding/badpixel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  description?: string;
  badge?: string;
}

const SettingsSection = memo(({
  icon,
  title,
  children,
  description,
  badge
}: SettingsSectionProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
      </div>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </div>
    <div className="pl-6 space-y-4">{children}</div>
  </div>
));

SettingsSection.displayName = "SettingsSection";

const SettingsPanel = memo(() => {
  const { toast } = useToast();
  const { options, setOptions } = useBadPixelStore();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleRefreshIntervalChange = useCallback((value: number) => {
    if (value < 1000) {
      toast({
        title: "刷新间隔过短",
        description: "刷新间隔不能小于 1000ms",
        variant: "destructive",
      });
      return;
    }
    setOptions({ refreshInterval: value });
    toast({
      title: "已更新刷新间隔",
      description: `自动刷新间隔已设置为 ${value}ms`,
    });
  }, [setOptions, toast]);

  const updateOption = useCallback(<K extends keyof BadPixelOptions>(
    key: K,
    value: BadPixelOptions[K]
  ) => {
    setOptions({ [key]: value });
  }, [setOptions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Accordion
        type="single"
        collapsible
        defaultValue="general"
        className="space-y-4"
      >
        {/* 基本设置 */}
        <AccordionItem value="general" className="border-b-0">
          <AccordionTrigger className="hover:bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-400" />
              <span>基本设置</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4">
            <SettingsSection
              icon={<Globe className="w-4 h-4 text-blue-400" />}
              title="界面语言"
            >
              <Select
                value={options.language}
                onValueChange={(value: "zh" | "en") =>
                  updateOption("language", value)
                }
              >
                <SelectTrigger className={cn("w-[120px]", isMobile && "w-full")}>
                  <SelectValue placeholder="选择语言" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </SettingsSection>

            <Separator className="my-4" />

            <SettingsSection
              icon={<RefreshCcw className="w-4 h-4 text-green-400" />}
              title="自动刷新"
              description="定期更新坏点数据"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">启用自动刷新</span>
                <Switch
                  checked={options.autoRefresh}
                  onCheckedChange={(checked) =>
                    updateOption("autoRefresh", checked)
                  }
                />
              </div>

              <AnimatePresence>
                {options.autoRefresh && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <Label>刷新间隔 (ms)</Label>
                    </div>
                    <Slider
                      value={[options.refreshInterval]}
                      onValueChange={([value]) => handleRefreshIntervalChange(value)}
                      min={1000}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1秒</span>
                      <span>当前: {options.refreshInterval}ms</span>
                      <span>10秒</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SettingsSection>
          </AccordionContent>
        </AccordionItem>

        {/* 显示设置 */}
        <AccordionItem value="display" className="border-b-0">
          <AccordionTrigger className="hover:bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>显示设置</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4">
            <SettingsSection
              icon={<Filter className="w-4 h-4 text-indigo-400" />}
              title="显示模式"
            >
              <Select
                value={options.displayMode}
                onValueChange={(value: "scatter" | "heatmap" | "grid") =>
                  updateOption("displayMode", value)
                }
              >
                <SelectTrigger className={cn("w-[120px]", isMobile && "w-full")}>
                  <SelectValue placeholder="选择显示模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">散点图</SelectItem>
                  <SelectItem value="heatmap">热力图</SelectItem>
                  <SelectItem value="grid">网格图</SelectItem>
                </SelectContent>
              </Select>
            </SettingsSection>

            <Separator className="my-4" />

            <SettingsSection
              icon={<EyeOff className="w-4 h-4 text-violet-400" />}
              title="显示设置"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm">显示覆盖层</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>在图像上显示坏点标记</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Toggle
                    pressed={options.showOverlay}
                    onPressedChange={(pressed) =>
                      updateOption("showOverlay", pressed)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>过滤阈值</Label>
                  <Slider
                    value={[options.filterThreshold]}
                    onValueChange={([value]) =>
                      updateOption("filterThreshold", value)
                    }
                    min={1}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>最低</span>
                    <span>当前: {options.filterThreshold}</span>
                    <span>最高</span>
                  </div>
                </div>
              </div>
            </SettingsSection>
          </AccordionContent>
        </AccordionItem>

        {/* 高级设置 */}
        <AccordionItem value="advanced" className="border-b-0">
          <AccordionTrigger className="hover:bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-yellow-400" />
              <span>高级设置</span>
              {options.advancedMode && (
                <Badge variant="default" className="ml-2 text-xs">
                  已启用
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4">
            <SettingsSection
              icon={<Shield className="w-4 h-4 text-purple-400" />}
              title="高级模式"
              description="启用高级特性和设置"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">启用高级模式</span>
                  <Switch
                    checked={options.advancedMode}
                    onCheckedChange={(checked) =>
                      updateOption("advancedMode", checked)
                    }
                  />
                </div>

                <AnimatePresence>
                  {options.advancedMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>坏点检测敏感度</Label>
                        <Slider
                          value={[options.sensitivity]}
                          onValueChange={([value]) =>
                            updateOption("sensitivity", value)
                          }
                          min={1}
                          max={10}
                          step={0.1}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>低</span>
                          <span>{options.sensitivity}</span>
                          <span>高</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>热点阈值</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Input
                                type="number"
                                value={options.hotPixelThreshold}
                                onChange={(e) =>
                                  updateOption(
                                    "hotPixelThreshold",
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-full"
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>判定为热坏点的亮度阈值</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SettingsSection>
          </AccordionContent>
        </AccordionItem>

        {/* 数据管理 */}
        <AccordionItem value="data" className="border-b-0">
          <AccordionTrigger className="hover:bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>数据管理</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-4">
            <SettingsSection
              icon={<Save className="w-4 h-4 text-green-400" />}
              title="自动保存"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">启用自动保存</span>
                  <Switch
                    checked={options.autoSave}
                    onCheckedChange={(checked) =>
                      updateOption("autoSave", checked)
                    }
                  />
                </div>

                <AnimatePresence>
                  {options.autoSave && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label>保存间隔 (毫秒)</Label>
                      <Input
                        type="number"
                        value={options.saveInterval}
                        onChange={(e) =>
                          updateOption("saveInterval", parseInt(e.target.value))
                        }
                        min={1000}
                        step={1000}
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SettingsSection>

            <Separator className="my-4" />

            <SettingsSection
              icon={<Cloud className="w-4 h-4 text-blue-400" />}
              title="数据备份"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">启用自动备份</span>
                  <Switch
                    checked={options.autoBackup}
                    onCheckedChange={(checked) =>
                      updateOption("autoBackup", checked)
                    }
                  />
                </div>
              </div>
            </SettingsSection>

            <Separator className="my-4" />

            <SettingsSection
              icon={<History className="w-4 h-4 text-indigo-400" />}
              title="历史记录"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-gray-800/50 hover:bg-gray-700/50"
                onClick={() => {
                  toast({
                    title: "功能开发中",
                    description: "历史记录功能即将推出",
                  });
                }}
              >
                查看历史记录
              </Button>
            </SettingsSection>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
});

SettingsPanel.displayName = "SettingsPanel";

export default SettingsPanel;
