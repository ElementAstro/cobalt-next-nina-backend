"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useXvfbStore, XvfbInstance } from "@/stores/extra/xvfb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Save,
  Upload,
  Trash2,
  RefreshCw,
  Monitor,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type XvfbConfig = z.infer<typeof xvfbSchema>;

const xvfbSchema = z.object({
  display: z.string().regex(/^:\d+$/, "Display must be in format :99"),
  resolution: z.string(),
  customResolution: z
    .string()
    .regex(/^\d+x\d+$/, "Must be in format WIDTHxHEIGHT")
    .optional(),
  colorDepth: z.string(),
  screen: z.string().regex(/^\d+$/, "Must be a number"),
  refreshRate: z.number().min(30).max(240),
  memory: z.number().min(64).max(1024).optional(),
  security: z
    .object({
      xauth: z.boolean(),
      tcp: z.boolean(),
      localhostOnly: z.boolean(),
    })
    .optional(),
  logging: z
    .object({
      verbose: z.boolean(),
      logFile: z.string().optional(),
      maxLogSize: z.number().optional(),
    })
    .optional(),
});

type Status = "idle" | "starting" | "running" | "stopping" | "error";
type ConfigField = keyof typeof xvfbSchema.shape;

interface PresetMetadata {
  name: string;
  description?: string;
  tags?: string[];
  createdAt: number;
  lastModified: number;
}

export interface XvfbPreset {
  config: XvfbConfig;
  metadata: PresetMetadata;
}

export default function XvfbConfigComponent() {
  const {
    config,
    isRunning,
    status,
    logs,
    savedPresets,
    setConfig,
    toggleRunning,
    applyConfig,
    loadConfig,
    saveConfig,
    deletePreset,
    clearLogs,
    restartServer,
    validateConfig,
  } = useXvfbStore();

  const {
    control,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(xvfbSchema),
    defaultValues: {
      display: config.display, // Use config from store directly instead of initialConfig
      resolution: config.resolution,
      customResolution: config.customResolution,
      colorDepth: config.colorDepth,
      screen: config.screen,
      refreshRate: config.refreshRate,
      memory: config.memory || 256,
      security: {
        xauth: config.security.xauth,
        tcp: config.security.tcp,
        localhostOnly: config.security.localhostOnly,
      },
      logging: {
        verbose: config.logging.verbose,
        logFile: config.logging.logFile,
        maxLogSize: config.logging.maxLogSize,
      },
    },
  });

  const [configName, setConfigName] = useState("");
  const [instances, setInstances] = useState<XvfbInstance[]>([]);
  const [activeTab, setActiveTab] = useState<
    "basic" | "advanced" | "instances"
  >("basic");
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  const statusColors: Record<Status, string> = {
    idle: "bg-gray-500",
    starting: "bg-blue-500",
    running: "bg-green-500",
    stopping: "bg-yellow-500",
    error: "bg-red-500",
  };
  const currentStatusColor = statusColors[status];

  const handleChange = (field: ConfigField, value: string | number) => {
    setValue(field, value);
    setConfig({ [field]: value });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRunning) {
        console.log("Xvfb is running with config:", config);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning, config]);

  const addInstance = () => {
    const newInstance: XvfbInstance = {
      id: Date.now().toString(),
      display: `:${99 + instances.length}`,
      config: { ...config },
      status: "idle",
    };
    setInstances([...instances, newInstance]);
  };

  const removeInstance = useCallback((id: string) => {
    setInstances((prev) => prev.filter((instance) => instance.id !== id));
  }, []);

  const exportPreset = useCallback((preset: XvfbPreset) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.metadata.name}.xvfb.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importPreset = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const preset: XvfbPreset = JSON.parse(e.target?.result as string);
            // 确保配置符合 Partial<XvfbConfig> 类型
            const configToApply: Partial<XvfbConfig> = {
              ...preset.config,
              logging: {
                verbose: preset.config.logging?.verbose || false,
                logFile: preset.config.logging?.logFile || "/var/log/xvfb.log",
                maxLogSize: preset.config.logging?.maxLogSize || 10,
              },
            };
            applyConfig(configToApply);
          } catch {
            console.error("导入预设失败：无效的文件格式");
          }
        };
        reader.readAsText(file);
      }
    },
    [applyConfig]
  );

  const handleBatchOperation = useCallback(
    (operation: "start" | "stop" | "delete") => {
      selectedInstances.forEach((id) => {
        switch (operation) {
          case "start":
            // 启动实例，可在此处调用相应逻辑
            break;
          case "stop":
            // 停止实例
            break;
          case "delete":
            removeInstance(id);
            break;
        }
      });
      setSelectedInstances([]);
    },
    [selectedInstances, removeInstance]
  );

  // 导出当前预设（构造元数据）
  const handleExportCurrentPreset = useCallback(() => {
    const metadata: PresetMetadata = {
      name: configName || "untitled",
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    exportPreset({ config, metadata });
  }, [configName, exportPreset, config]);

  // Add safe apply config handler
  const handleSafeApplyConfig = useCallback(() => {
    if (validateConfig()) {
      applyConfig(config);
    }
  }, [validateConfig, applyConfig, config]);

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[calc(100vh-4rem)]">
      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {["basic", "advanced", "instances"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === "basic" && (
            <Card>
              <CardHeader className="flex-none space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Xvfb 配置
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <motion.div
                      key={status}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Badge className={currentStatusColor}>{status}</Badge>
                    </motion.div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={clearLogs}>
                          清除日志
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={restartServer}>
                          重启服务器
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Label
                        htmlFor="display"
                        className="flex items-center gap-1 mb-2"
                      >
                        <Monitor className="h-4 w-4" />
                        显示器
                      </Label>
                      <Input
                        id="display"
                        value={config.display}
                        onChange={(e) =>
                          handleChange("display", e.target.value)
                        }
                        placeholder=":99"
                        className={errors.display ? "border-red-500" : ""}
                      />
                      {errors.display && (
                        <span className="absolute -bottom-5 text-xs text-red-500">
                          {errors.display.message}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Label
                        htmlFor="resolution"
                        className="flex items-center gap-1 mb-2"
                      >
                        <Radio className="h-4 w-4" />
                        分辨率
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          handleChange("resolution", value)
                        }
                        value={config.resolution}
                      >
                        <SelectTrigger
                          className={errors.resolution ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="选择分辨率" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024x768">1024x768</SelectItem>
                          <SelectItem value="1280x1024">1280x1024</SelectItem>
                          <SelectItem value="1920x1080">1920x1080</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* 其他配置字段... */}
                  </div>
                  {/* 预设配置部分 */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="text-lg font-semibold">已保存预设</h3>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="预设名称"
                          value={configName}
                          onChange={(e) => setConfigName(e.target.value)}
                          className="w-full sm:w-40"
                        />
                        <Button
                          onClick={() => saveConfig(configName)}
                          size="icon"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-24">
                      <div className="flex flex-wrap gap-2">
                        {savedPresets.map((preset: XvfbPreset) => (
                          <div
                            key={preset.metadata.name}
                            className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                          >
                            <span className="text-sm font-medium">
                              {preset.metadata.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => loadConfig(preset.metadata.name)}
                                className="h-6 w-6"
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  deletePreset(preset.metadata.name)
                                }
                                className="h-6 w-6 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {/* 导出当前预设 */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={handleExportCurrentPreset}
                      >
                        导出当前预设
                      </Button>
                    </div>
                  </div>
                  {/* 日志部分 */}
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-lg font-semibold">日志</h3>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {logs.map((log, index) => (
                          <div
                            key={index}
                            className={cn("text-xs font-mono p-1 rounded", {
                              "text-red-500 bg-red-500/10":
                                log.type === "error",
                              "text-yellow-500 bg-yellow-500/10":
                                log.type === "warning",
                              "text-blue-500 bg-blue-500/10":
                                log.type === "info",
                            })}
                          >
                            <span className="opacity-50">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>{" "}
                            {log.message}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  {/* 控制按钮 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isRunning}
                        onCheckedChange={toggleRunning}
                        disabled={
                          status === "starting" || status === "stopping"
                        }
                      />
                      <Label>Xvfb {isRunning ? "运行中" : "已停止"}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={restartServer}
                        disabled={!isRunning}
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        重启
                      </Button>
                      <Button
                        onClick={handleSafeApplyConfig}
                        disabled={
                          status === "starting" || status === "stopping"
                        }
                        className="w-full sm:w-auto"
                      >
                        应用配置
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle>高级配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="security.xauth"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label>启用 XAuth</Label>
                        </div>
                      )}
                    />
                    {/* 其他安全选项可在此添加 */}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">日志设置</h3>
                    {/* 日志相关高级设置 */}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">性能设置</h3>
                    {/* 性能相关选项 */}
                  </div>
                  {/* 在高级配置中增加导入预设功能 */}
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium">预设导入</h3>
                    <Input type="file" onChange={importPreset} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "instances" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Xvfb 实例</span>
                  <Button onClick={addInstance} size="sm">
                    添加新实例
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {instances.map((instance) => (
                      <div
                        key={instance.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              显示器 {instance.display}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {instance.config.resolution} -{" "}
                              {instance.config.colorDepth}位色深
                            </span>
                          </div>
                          <Badge
                            className={cn({
                              "bg-gray-500": instance.status === "idle",
                              "bg-blue-500": instance.status === "starting",
                              "bg-green-500": instance.status === "running",
                              "bg-yellow-500": instance.status === "stopping",
                              "bg-red-500": instance.status === "error",
                            })}
                          >
                            {instance.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const configToApply: Partial<XvfbConfig> = {
                                ...instance.config,
                                logging: {
                                  verbose:
                                    instance.config.logging?.verbose || false,
                                  logFile:
                                    instance.config.logging?.logFile ||
                                    "/var/log/xvfb.log",
                                  maxLogSize:
                                    instance.config.logging?.maxLogSize || 10,
                                },
                              };
                              applyConfig(configToApply);
                            }}
                            className="h-8"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            加载配置
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeInstance(instance.id)}
                            className="h-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedInstances.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted">
                    <span className="text-sm">
                      已选择 {selectedInstances.length} 个实例
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchOperation("start")}
                    >
                      批量启动
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchOperation("stop")}
                    >
                      批量停止
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBatchOperation("delete")}
                    >
                      批量删除
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
