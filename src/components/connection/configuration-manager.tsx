"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  Upload,
  FileText,
  XCircle,
  CheckCircle,
  Home,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useConnectionConfigStore } from "@/stores/connection/configStore";
import { useUIStore } from "@/stores/connection/uiStore";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { usePortScanStore } from "@/stores/connection/portScanStore";

// 定义配置类型
interface ConfigData {
  connectionTimeout: number;
  maxRetries: number;
  debugMode: boolean;
}

interface ConnectionError {
  code: string;
  message: string;
  timestamp: Date;
}

const configSchema = z.object({
  connectionTimeout: z.number().min(1).max(300),
  maxRetries: z.number().min(1).max(10),
  debugMode: z.boolean(),
});

interface ConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: ConfigData) => void;
}

export function ConfigurationManager({
  isOpen,
  onClose,
  onImport,
}: ConfigurationManagerProps) {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(isOpen);
  // Import config state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced settings store
  const {
    connectionTimeout,
    maxRetries,
    debugMode,
    updateSettings,
    saveSettings,
    loadSettings,
  } = useConnectionConfigStore();
  // Connection store (for history and dark mode)
  const { toggleDarkMode, isDarkMode } = useUIStore();

  const {
    connectionHistory,
    errorHistory,
    clearConnectionHistory,
    isConnected,
  } = useConnectionStatusStore();

  // On mount load advanced settings
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  // File change handler for importing configuration
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsLoading(true);
    setImportStatus("idle");
    setImportError(null);

    try {
      const fileContent = await readFileAsText(file);
      const config = JSON.parse(fileContent);
      const validatedConfig = configSchema.parse(config);
      toast({
        title: "配置导入成功",
        description: "配置文件已成功导入并验证",
        variant: "default",
      });
      // Update advanced settings in store and notify parent
      updateSettings(validatedConfig);
      onImport(validatedConfig);
      setImportStatus("success");
      onClose();
    } catch (error) {
      setImportStatus("error");
      if (error instanceof z.ZodError) {
        setImportError(
          "配置文件格式无效: " + error.errors.map((e) => e.message).join(", ")
        );
      } else {
        setImportError("无法读取或解析配置文件");
      }
      toast({
        title: "配置导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("无法读取文件"));
      reader.readAsText(file);
    });

  // Handler for saving advanced settings
  const handleSaveSettings = () => {
    saveSettings();
    toast({
      title: "设置保存成功",
      description: "高级配置已成功保存",
      variant: "default",
    });
  };

  // For theme change via dropdown demo
  const handleThemeChange = (theme: "dark" | "light") => {
    if (theme === "dark" && !isDarkMode) {
      toggleDarkMode();
    }
    if (theme === "light" && isDarkMode) {
      toggleDarkMode();
    }
  };

  // 渲染错误历史列表
  const renderErrorHistory = () =>
    errorHistory?.map((error: ConnectionError, idx: number) => (
      <TableRow key={idx}>
        <TableCell>{error.code}</TableCell>
        <TableCell>{error.message}</TableCell>
        <TableCell>{new Date(error.timestamp).toLocaleTimeString()}</TableCell>
      </TableRow>
    ));

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] p-6 dark:bg-gray-900 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Save className="w-6 h-6" />
            配置管理器 - 天文摄影软件
          </DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="import"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="import">导入配置</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-4">
            <TabsContent value="import" className="space-y-4 min-h-[400px]">
              <div>
                <Label className="block text-sm font-medium mb-2">
                  导入配置文件
                </Label>
                <div className="flex space-x-2 items-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : importStatus === "success" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    导入
                  </Button>
                </div>
              </div>
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    disabled={isLoading}
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              )}
              {importError && (
                <Alert className="p-2">
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription className="text-sm">
                    {importError}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor="connectionTimeout"
                        className="text-sm font-medium mb-1"
                      >
                        连接超时 (秒)
                      </Label>
                      <Input
                        id="connectionTimeout"
                        type="number"
                        value={connectionTimeout}
                        onChange={(e) =>
                          updateSettings({
                            connectionTimeout: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="maxRetries"
                        className="text-sm font-medium mb-1"
                      >
                        最大重试次数
                      </Label>
                      <Input
                        id="maxRetries"
                        type="number"
                        value={maxRetries}
                        onChange={(e) =>
                          updateSettings({ maxRetries: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label
                        htmlFor="debugMode"
                        className="text-sm font-medium mb-1"
                      >
                        调试模式
                      </Label>
                      <div className="flex items-center">
                        <Switch
                          id="debugMode"
                          checked={debugMode}
                          onCheckedChange={(checked) =>
                            updateSettings({ debugMode: checked })
                          }
                        />
                        <span className="ml-2 text-sm">
                          {debugMode ? "开启" : "关闭"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={handleSaveSettings}
                      className="flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      保存设置
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Home className="w-4 h-4" />
                          主题
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-40">
                        <DropdownMenuLabel>选择主题</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleThemeChange("light")}
                        >
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleThemeChange("dark")}
                        >
                          Dark
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        当前连接信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>连接状态: {isConnected ? "已连接" : "未连接"}</p>
                      <p>历史记录: {connectionHistory.length} 次</p>
                    </CardContent>
                  </Card>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="errorHistory">
                      <AccordionTrigger className="text-sm">
                        错误日志
                      </AccordionTrigger>
                      <AccordionContent>
                        {errorHistory?.length ? (
                          <Table>
                            <TableCaption>最近错误日志</TableCaption>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/3">代码</TableHead>
                                <TableHead className="w-1/3">信息</TableHead>
                                <TableHead className="w-1/3">时间</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>{renderErrorHistory()}</TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            暂无错误日志
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    扫描历史
                  </Label>
                  {usePortScanStore.getState().scanHistory.length > 0 ? (
                    <Table>
                      <TableCaption>端口扫描历史</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>开放端口</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usePortScanStore.getState().scanHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.ipAddress}</TableCell>
                            <TableCell>{item.openPorts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      暂无扫描记录
                    </p>
                  )}
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-2">
                    选择日期
                  </Label>
                  <Calendar
                    mode="single"
                    selected={new Date()}
                    onSelect={() => {}}
                    className="rounded-lg border w-full"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <Button
            variant="destructive"
            onClick={clearConnectionHistory}
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            清空连接历史
          </Button>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
