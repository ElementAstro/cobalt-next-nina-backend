"use client";

import { useState } from "react";
import { useSerialStore } from "@/stores/serial";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Download, Upload, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AccentColor, ThemeMode } from "@/types/serial/types";

export function SettingsPanel() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    showTimestamps,
    setShowTimestamps,
    exportSettings,
    importSettings,
    clearTerminalData,
    clearDataPoints,
  } = useSerialStore();

  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const { toast } = useToast();

  const handleExport = () => {
    const settings = exportSettings();
    setImportText(settings);

    toast({
      title: "Settings exported",
      description: "Your settings have been exported to the text area below.",
    });
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast({
        title: "Import failed",
        description: "Please paste your settings JSON first.",
        variant: "destructive",
      });
      return;
    }

    try {
      importSettings(importText);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      toast({
        title: "Import failed",
        description: `The settings JSON is invalid or corrupted. ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    clearTerminalData();
    clearDataPoints();

    toast({
      title: "Data cleared",
      description: "All terminal data and visualization data has been cleared.",
    });
  };

  const accentColors: AccentColor[] = [
    "purple",
    "blue",
    "green",
    "orange",
    "red",
    "pink",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#0a1929] text-white border-gray-700 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
        <SheetHeader>
          <SheetTitle className="text-white">设置</SheetTitle>
          <SheetDescription className="text-gray-400">
            自定义您的串口调试界面
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="appearance" className="mt-6">
          <TabsList className="bg-[#1a2b3d] dark:bg-gray-800 transition-colors duration-200">
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
            >
              外观
            </TabsTrigger>
            <TabsTrigger
              value="behavior"
              className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
            >
              行为
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
            >
              数据
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">主题</h3>
              {/* 修复3: 使用明确的类型代替any */}
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeMode)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">深色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">浅色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="theme-system" />
                  <Label htmlFor="theme-system">系统</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">强调色</h3>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    className={cn(
                      "h-8 capitalize",
                      accentColor === color &&
                        "ring-2 ring-white ring-offset-2 ring-offset-[#0a1929] dark:ring-offset-gray-900"
                    )}
                    style={{
                      backgroundColor: `var(--${color}-600)`,
                      borderColor: `var(--${color}-700)`,
                    }}
                    onClick={() => setAccentColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-timestamps">显示时间戳</Label>
              <Switch
                id="show-timestamps"
                checked={showTimestamps}
                onCheckedChange={setShowTimestamps}
              />
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">导入/导出设置</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
                <Button
                  variant="outline"
                  className="bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
                  onClick={handleImport}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  导入
                </Button>
              </div>

              <Textarea
                className="h-32 mt-2 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
                placeholder="粘贴设置 JSON 到这里..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">数据管理</h3>
              <p className="text-sm text-gray-400">
                清除所有终端数据和可视化数据。此操作不可撤销。
              </p>
              <Button
                variant="destructive"
                className="mt-2"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                清除所有数据
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
