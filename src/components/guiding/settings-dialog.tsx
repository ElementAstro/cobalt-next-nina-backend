"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Save, RotateCcw, HelpCircle } from "lucide-react";
import { useGuidingStore } from "@/stores/guiding/guidingStore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SettingsState {
  radius: number;
  exposureTime: number;
  debugMode: boolean;
  colorScheme: "dark" | "light";
  animationSpeed: number;
}

export default function SettingsDialog() {
  const { settings, setSettings } = useGuidingStore();
  const [localSettings, setLocalSettings] = React.useState<SettingsState>({
    ...settings,
    radius: settings.radius ?? 50,
    exposureTime: settings.exposureTime ?? 100,
    debugMode: settings.debugMode ?? false,
    colorScheme: settings.colorScheme ?? "dark",
    animationSpeed: settings.animationSpeed ?? 1,
  });

  const [isSaving, setIsSaving] = React.useState(false);

  // 检查设置是否有更改
  const hasChanges = React.useMemo(() => {
    return Object.keys(settings).some(
      (key) => settings[key as keyof typeof settings] !== localSettings[key as keyof SettingsState]
    );
  }, [settings, localSettings]);

  // 表单验证
  const validateSettings = React.useCallback((settings: SettingsState) => {
    const errors: Partial<Record<keyof SettingsState, string>> = {};

    if (settings.radius <= 0) {
      errors.radius = "搜星半径必须大于0";
    }
    if (settings.exposureTime < 100) {
      errors.exposureTime = "曝光时间不能小于100ms";
    }
    if (settings.animationSpeed <= 0 || settings.animationSpeed > 2) {
      errors.animationSpeed = "动画速度必须在0-2之间";
    }

    return errors;
  }, []);

  const handleReset = () => {
    setLocalSettings({
      ...settings,
      radius: settings.radius ?? 50,
      exposureTime: settings.exposureTime ?? 100,
      debugMode: settings.debugMode ?? false,
      colorScheme: settings.colorScheme ?? "dark",
      animationSpeed: settings.animationSpeed ?? 1,
    });
    toast({
      title: "设置已重置",
      description: "已恢复到最后保存的设置",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const errors = validateSettings(localSettings);
      if (Object.keys(errors).length > 0) {
        throw new Error(Object.values(errors)[0]);
      }

      // 模拟异步保存
      await new Promise((r) => setTimeout(r, 500));

      setSettings(localSettings);
      toast({
        title: "设置已保存",
        description: "所有更改已成功应用",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存设置时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = React.memo(
    ({
      label,
      description,
      children,
      tooltip,
    }: {
      label: string;
      description?: string;
      children: React.ReactNode;
      tooltip?: string;
    }) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="pt-1">{children}</div>
      </div>
    )
  );

  SettingItem.displayName = "SettingItem";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          系统设置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <Tabs defaultValue="interface" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="interface">界面</TabsTrigger>
              <TabsTrigger value="display">显示</TabsTrigger>
            </TabsList>

            <TabsContent value="interface" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>界面设置</CardTitle>
                  <CardDescription>
                    自定义您的界面外观和交互体验
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingItem
                    label="主题设置"
                    tooltip="选择界面的视觉主题"
                  >
                    <Select
                      value={localSettings.colorScheme}
                      onValueChange={(value: "dark" | "light") =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          colorScheme: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">深色</SelectItem>
                        <SelectItem value="light">浅色</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    label="动画速度"
                    tooltip="调整界面动画的播放速度"
                  >
                    <Slider
                      value={[localSettings.animationSpeed]}
                      onValueChange={([value]) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          animationSpeed: value,
                        }))
                      }
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="pt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      当前速度: {localSettings.animationSpeed}x
                    </p>
                  </SettingItem>

                  <SettingItem
                    label="调试模式"
                    tooltip="启用调试模式以获取详细日志"
                  >
                    <Switch
                      checked={localSettings.debugMode}
                      onCheckedChange={(checked) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          debugMode: checked,
                        }))
                      }
                    />
                  </SettingItem>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>显示设置</CardTitle>
                  <CardDescription>调整显示参数和性能选项</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingItem
                    label="搜星半径"
                    tooltip="设置自动搜星的检测范围"
                  >
                    <Input
                      type="number"
                      value={localSettings.radius}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          radius: Number(e.target.value),
                        }))
                      }
                      className={cn(
                        "w-full",
                        localSettings.radius <= 0 && "border-red-500"
                      )}
                    />
                    {localSettings.radius <= 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        搜星半径必须大于0
                      </p>
                    )}
                  </SettingItem>

                  <SettingItem
                    label="曝光时间 (ms)"
                    tooltip="设置相机的曝光时间"
                  >
                    <Input
                      type="number"
                      value={localSettings.exposureTime}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          exposureTime: Number(e.target.value),
                        }))
                      }
                      className={cn(
                        "w-full",
                        localSettings.exposureTime < 100 && "border-red-500"
                      )}
                    />
                    {localSettings.exposureTime < 100 && (
                      <p className="text-xs text-red-500 mt-1">
                        曝光时间不能小于100ms
                      </p>
                    )}
                  </SettingItem>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSaving || !hasChanges}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              {hasChanges && (
                <p className="text-xs text-muted-foreground">有未保存的更改</p>
              )}
            </div>
            <Button type="submit" disabled={isSaving || !hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
