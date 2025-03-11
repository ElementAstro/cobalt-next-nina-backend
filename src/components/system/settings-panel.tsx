"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { AlertCircle, Save, RefreshCw, CheckCircle2 } from "lucide-react";

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
  // 保存按钮状态
  const [isSaving, setIsSaving] = useState(false);

  // 当设置面板打开时重置本地设置
  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [open, settings]);

  // 处理设置更改
  const handleSettingChange = (newSettings: Partial<typeof settings>) => {
    setLocalSettings((prev) => ({ ...prev, ...newSettings }));
    setHasChanges(true);
  };

  // 保存设置
  const saveSettings = () => {
    setIsSaving(true);

    // 模拟保存延迟以展示动画效果
    setTimeout(() => {
      updateSettings(localSettings);

      toast.success("设置已保存", {
        description: "您的系统监控设置已成功更新",
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 3000,
      });

      setHasChanges(false);
      setIsSaving(false);
    }, 600);
  };

  // 重置设置
  const handleResetSettings = () => {
    // 添加确认对话框
    toast.warning("确定要重置所有设置吗?", {
      description: "此操作将恢复所有默认设置",
      action: {
        label: "确认重置",
        onClick: () => {
          resetSettings();
          setLocalSettings(settings);
          setHasChanges(false);

          toast("所有设置已重置为默认值", {
            icon: <RefreshCw className="h-4 w-4" />,
            duration: 3000,
          });
        },
      },
      duration: 5000,
    });
  };

  // 关闭面板前检查是否有未保存的更改
  const handleClose = (open: boolean) => {
    if (!open && hasChanges) {
      toast.warning("您有未保存的更改", {
        description: "关闭前请先保存更改或放弃更改",
        action: {
          label: "放弃更改",
          onClick: () => onOpenChange(false),
        },
        cancel: {
          label: "继续编辑",
          onClick: () => onOpenChange(true),
        },
        duration: 5000,
      });
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
                className="absolute top-0 right-0 mb-4 flex items-center text-amber-500 text-xs gap-1 bg-amber-500/10 py-1 px-2 rounded-md"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>有未保存的更改</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 主题设置 */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.div>

          {/* 刷新间隔 */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
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
                {localSettings.refreshInterval / 1000 < 5 && (
                  <span className="text-amber-500 text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    较短的刷新间隔可能影响性能
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* 布局设置 */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
          </motion.div>

          {/* 可见模块配置 - 改进为更灵活的布局 */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-base font-medium sm:text-lg">可见模块</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              {[
                { id: "cpu", label: "CPU", icon: "📊" },
                { id: "memory", label: "内存", icon: "🧠" },
                { id: "disk", label: "磁盘", icon: "💾" },
                { id: "os", label: "操作系统", icon: "🖥️" },
                { id: "network", label: "网络", icon: "🌐" },
                { id: "gpu", label: "GPU", icon: "🎮" },
                { id: "processes", label: "进程", icon: "📝" },
                { id: "services", label: "服务", icon: "⚙️" },
              ].map((item, idx) => (
                <motion.div
                  key={item.id}
                  className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50 border border-transparent hover:border-border"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
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
                    className="cursor-pointer text-xs sm:text-sm flex-1 flex items-center gap-1.5"
                  >
                    <span className="opacity-80">{item.icon}</span> {item.label}
                  </Label>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 告警阈值设置 */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-base font-medium sm:text-lg">告警阈值设置</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between">
                  <Label htmlFor="cpu-threshold" className="text-xs sm:text-sm">
                    CPU 使用率阈值
                  </Label>
                  <span
                    className={`text-xs font-medium ${
                      localSettings.alertThresholds.cpu > 85
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {localSettings.alertThresholds.cpu}%
                  </span>
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
                  className="my-1"
                />
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <Label
                    htmlFor="memory-threshold"
                    className="text-xs sm:text-sm"
                  >
                    内存使用率阈值
                  </Label>
                  <span
                    className={`text-xs font-medium ${
                      localSettings.alertThresholds.memory > 85
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {localSettings.alertThresholds.memory}%
                  </span>
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
                  className="my-1"
                />
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <Label
                    htmlFor="disk-threshold"
                    className="text-xs sm:text-sm"
                  >
                    磁盘使用率阈值
                  </Label>
                  <span
                    className={`text-xs font-medium ${
                      localSettings.alertThresholds.disk > 85
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {localSettings.alertThresholds.disk}%
                  </span>
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
                  className="my-1"
                />
              </div>
            </div>
          </motion.div>

          {/* 动画速度 */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
          </motion.div>

          {/* 单位显示 */}
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
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
          </motion.div>

          {/* 重置按钮 */}
          <motion.div
            className="pt-2 sm:pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="outline"
              className="w-full h-8 sm:h-9 text-xs sm:text-sm"
              onClick={handleResetSettings}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重置所有设置
            </Button>
          </motion.div>
        </div>

        <SheetFooter>
          <Button
            variant="default"
            className="w-full h-8 sm:h-9 text-xs sm:text-sm relative overflow-hidden"
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                保存中...
              </motion.div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存设置
              </>
            )}

            {/* 保存按钮的动画效果 */}
            {hasChanges && !isSaving && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0"
                animate={{ x: ["120%", "-120%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
              />
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
