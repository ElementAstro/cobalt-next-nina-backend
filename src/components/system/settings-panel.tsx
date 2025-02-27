"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import useSystemStore from "@/stores/system/systemStore";
import { useMediaQuery } from "react-responsive";
import { motion, AnimatePresence } from "framer-motion";
import { successToast, warningToast } from "@/lib/toast";
import { AlertCircle, Save } from "lucide-react";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsPanel({
  open,
  onOpenChange,
}: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, resetSettings } = useSystemStore();
  const isLandscape = useMediaQuery({ orientation: "landscape" });
  const isMobile = useMediaQuery({ maxWidth: 640 });

  // 用于跟踪设置是否已更改
  const [hasChanges, setHasChanges] = useState(false);
  // 本地设置状态
  const [localSettings, setLocalSettings] = useState(settings);

  // 处理设置更改
  const handleSettingChange = (newSettings: Partial<typeof settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...newSettings }));
    setHasChanges(true);
  };

  // 保存设置
  const saveSettings = () => {
    updateSettings(localSettings);
    successToast("设置已保存");
    setHasChanges(false);
  };

  // 重置设置
  const handleResetSettings = () => {
    warningToast("所有设置已重置为默认值");
    resetSettings();
    setLocalSettings(settings);
    setHasChanges(false);
  };

  // 关闭面板前检查是否有未保存的更改
  const handleClose = (open: boolean) => {
    if (!open && hasChanges) {
      warningToast("您有未保存的更改");
      return;
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        className={`${
          isMobile && isLandscape ? "w-[80vw] sm:max-w-md" : "sm:max-w-md"
        } overflow-y-auto`}
      >
        <SheetHeader>
          <SheetTitle>系统监控设置</SheetTitle>
          <SheetDescription>
            自定义您的系统监控面板，更改后需要点击保存。
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-5 relative">
          {/* 有未保存更改时显示提示 */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 right-0 mb-4 flex items-center text-amber-500 text-xs gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>有未保存的更改</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 主题设置 */}
          <div className="space-y-2">
            <h3 className="text-base font-medium sm:text-lg">外观主题</h3>
            <Select
              value={theme}
              onValueChange={(value) => {
                setTheme(value);
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="system">跟随系统</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 刷新间隔 */}
          <div className="space-y-2">
            <h3 className="text-base font-medium sm:text-lg">数据刷新间隔</h3>
            <div className="space-y-4">
              <Slider
                value={[localSettings.refreshInterval / 1000]}
                min={1}
                max={60}
                step={1}
                onValueChange={([value]) =>
                  handleSettingChange({ refreshInterval: value * 1000 })
                }
              />
              <div className="text-xs sm:text-sm flex justify-between items-center">
                <span className="text-muted-foreground">
                  当前间隔: {localSettings.refreshInterval / 1000} 秒
                </span>
              </div>
            </div>
          </div>

          {/* 布局设置 */}
          <div className="space-y-2">
            <h3 className="text-base font-medium sm:text-lg">布局配置</h3>
            <Select
              value={localSettings.layoutConfig.columns.toString()}
              onValueChange={(value) =>
                handleSettingChange({
                  layoutConfig: {
                    ...localSettings.layoutConfig,
                    columns: parseInt(value),
                  },
                })
              }
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="选择列数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">单列布局</SelectItem>
                <SelectItem value="2">双列布局</SelectItem>
                <SelectItem value="3">三列布局</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 可见模块配置 - 改进为更灵活的布局 */}
          <div className="space-y-3">
            <h3 className="text-base font-medium sm:text-lg">可见模块</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              {[
                { id: "cpu", label: "CPU" },
                { id: "memory", label: "内存" },
                { id: "disk", label: "磁盘" },
                { id: "os", label: "操作系统" },
                { id: "network", label: "网络" },
                { id: "gpu", label: "GPU" },
                { id: "processes", label: "进程" },
                { id: "services", label: "服务" },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50"
                >
                  <Switch
                    id={`module-${item.id}`}
                    checked={localSettings.layoutConfig.visibleWidgets.includes(
                      item.id
                    )}
                    onCheckedChange={(checked) => {
                      const newVisibleWidgets = checked
                        ? [
                            ...localSettings.layoutConfig.visibleWidgets,
                            item.id,
                          ]
                        : localSettings.layoutConfig.visibleWidgets.filter(
                            (id) => id !== item.id
                          );

                      handleSettingChange({
                        layoutConfig: {
                          ...localSettings.layoutConfig,
                          visibleWidgets: newVisibleWidgets,
                        },
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor={`module-${item.id}`}
                    className="cursor-pointer text-xs sm:text-sm flex-1"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 告警阈值设置 */}
          <div className="space-y-3">
            <h3 className="text-base font-medium sm:text-lg">告警阈值设置</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between">
                  <Label htmlFor="cpu-threshold" className="text-xs sm:text-sm">
                    CPU 使用率阈值 ({localSettings.alertThresholds.cpu}%)
                  </Label>
                </div>
                <Slider
                  id="cpu-threshold"
                  min={50}
                  max={95}
                  step={5}
                  value={[localSettings.alertThresholds.cpu]}
                  onValueChange={([value]) =>
                    handleSettingChange({
                      alertThresholds: {
                        ...localSettings.alertThresholds,
                        cpu: value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <Label
                    htmlFor="memory-threshold"
                    className="text-xs sm:text-sm"
                  >
                    内存使用率阈值 ({localSettings.alertThresholds.memory}%)
                  </Label>
                </div>
                <Slider
                  id="memory-threshold"
                  min={50}
                  max={95}
                  step={5}
                  value={[localSettings.alertThresholds.memory]}
                  onValueChange={([value]) =>
                    handleSettingChange({
                      alertThresholds: {
                        ...localSettings.alertThresholds,
                        memory: value,
                      },
                    })
                  }
                />
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <Label
                    htmlFor="disk-threshold"
                    className="text-xs sm:text-sm"
                  >
                    磁盘使用率阈值 ({localSettings.alertThresholds.disk}%)
                  </Label>
                </div>
                <Slider
                  id="disk-threshold"
                  min={50}
                  max={95}
                  step={5}
                  value={[localSettings.alertThresholds.disk]}
                  onValueChange={([value]) =>
                    handleSettingChange({
                      alertThresholds: {
                        ...localSettings.alertThresholds,
                        disk: value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* 动画速度 */}
          <div className="space-y-2">
            <h3 className="text-base font-medium sm:text-lg">动画速度</h3>
            <Select
              value={localSettings.animationSpeed}
              onValueChange={(value) =>
                handleSettingChange({
                  animationSpeed: value as "slow" | "normal" | "fast",
                })
              }
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="选择动画速度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">慢速</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="fast">快速</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 单位显示 */}
          <div className="space-y-2">
            <h3 className="text-base font-medium sm:text-lg">存储单位</h3>
            <Select
              value={localSettings.unitDisplay}
              onValueChange={(value) =>
                handleSettingChange({
                  unitDisplay: value as "binary" | "decimal",
                })
              }
            >
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="选择存储单位" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="binary">二进制 (KiB, MiB)</SelectItem>
                <SelectItem value="decimal">十进制 (KB, MB)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 重置按钮 */}
          <div className="pt-2 sm:pt-4">
            <Button
              variant="outline"
              className="w-full h-8 sm:h-9 text-xs sm:text-sm"
              onClick={handleResetSettings}
            >
              重置所有设置
            </Button>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="default"
            className="w-full h-8 sm:h-9 text-xs sm:text-sm"
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            保存设置
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
