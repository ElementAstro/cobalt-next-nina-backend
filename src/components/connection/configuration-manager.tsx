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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
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
  Settings,
  History,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useConnectionConfigStore } from "@/stores/connection/configStore";
import { useUIStore } from "@/stores/connection/uiStore";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { usePortScanStore } from "@/stores/connection/portScanStore";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionError {
  code: string;
  message: string;
  timestamp: Date;
}

const configSchema = z.object({
  connectionTimeout: z.number().min(1).max(300),
  maxRetries: z.number().min(1).max(10),
  debugMode: z.boolean(),
  connection: z
    .object({
      ip: z.string().min(1).optional(),
      port: z.number().min(1).max(65535).optional(),
      username: z.string().min(1).optional(),
      password: z.string().min(1).optional(),
      isSSL: z.boolean().optional(),
      rememberLogin: z.boolean().optional(),
    })
    .optional(),
});

interface ConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    config: Partial<{
      ip: string;
      port: number;
      username: string;
      password: string;
      isSSL: boolean;
      rememberLogin: boolean;
      connectionType: "direct" | "proxy";
      proxySettings?: {
        host: string;
        port: number;
        auth?: {
          username: string;
          password: string;
        };
      };
    }>
  ) => void;
}

export function ConfigurationManager({
  isOpen,
  onClose,
  onImport,
}: ConfigurationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(isOpen);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    connectionTimeout,
    maxRetries,
    debugMode,
    updateSettings,
    saveSettings,
    loadSettings,
  } = useConnectionConfigStore();

  const { toggleDarkMode, isDarkMode } = useUIStore();

  const { connectionHistory, errorHistory, clearConnectionHistory, isConnected } =
    useConnectionStatusStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      if (validatedConfig.connectionTimeout) {
        updateSettings({
          connectionTimeout: validatedConfig.connectionTimeout,
          maxRetries: validatedConfig.maxRetries,
          debugMode: validatedConfig.debugMode,
        });
      }

      if (validatedConfig.connection) {
        onImport(validatedConfig.connection);
      }

      toast({
        title: "配置导入成功",
        description: "配置文件已成功导入并验证",
        variant: "default",
      });

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

  const handleSaveSettings = () => {
    saveSettings();
    toast({
      title: "设置保存成功",
      description: "高级配置已成功保存",
      variant: "default",
    });
  };

  const handleThemeChange = (theme: "dark" | "light") => {
    if (theme === "dark" && !isDarkMode) {
      toggleDarkMode();
    }
    if (theme === "light" && isDarkMode) {
      toggleDarkMode();
    }
  };

  const renderErrorHistory = () =>
    errorHistory?.map((error: ConnectionError, idx: number) => (
      <TableRow key={idx}>
        <TableCell className="font-mono">{error.code}</TableCell>
        <TableCell>{error.message}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {new Date(error.timestamp).toLocaleTimeString()}
        </TableCell>
      </TableRow>
    ));

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] p-0 overflow-hidden bg-background border-none dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <motion.div
          className="h-full flex flex-col"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeInUp}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Settings className="w-5 h-5 text-primary" />
              配置管理器 - 天文摄影软件
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="import" className="flex-1 overflow-hidden">
            <TabsList className="w-full px-6 border-b">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                导入配置
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                高级设置
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                错误日志
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="import" className="mt-0">
                <motion.div
                  className="space-y-4"
                  {...fadeInUp}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">导入配置文件</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
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
                          className="flex items-center gap-2 min-w-[120px]"
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

                      <AnimatePresence>
                        {selectedFile && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                          >
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm flex-1">{selectedFile.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedFile(null)}
                              disabled={isLoading}
                            >
                              <XCircle className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </motion.div>
                        )}

                        {importError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Alert variant="destructive">
                              <AlertTriangle className="w-4 h-4" />
                              <AlertTitle>错误</AlertTitle>
                              <AlertDescription>{importError}</AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0">
                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  {...fadeInUp}
                >
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">基本设置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="connectionTimeout">连接超时 (秒)</Label>
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
                          <div className="space-y-2">
                            <Label htmlFor="maxRetries">最大重试次数</Label>
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
                          <div className="space-y-2">
                            <Label htmlFor="debugMode">调试模式</Label>
                            <div className="flex items-center gap-2">
                              <Switch
                                id="debugMode"
                                checked={debugMode}
                                onCheckedChange={(checked) =>
                                  updateSettings({ debugMode: checked })
                                }
                              />
                              <span className="text-sm text-muted-foreground">
                                {debugMode ? "开启" : "关闭"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            onClick={handleSaveSettings}
                            className="flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            保存设置
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                主题设置
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>选择主题</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                                浅色模式
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                                深色模式
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">端口扫描历史</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {usePortScanStore.getState().scanHistory.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>日期</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead>开放端口</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usePortScanStore
                                .getState()
                                .scanHistory.slice(0, 5)
                                .map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.ipAddress}</TableCell>
                                    <TableCell>{item.openPorts}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无扫描记录</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">连接状态</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-sm">
                            {isConnected ? "已连接" : "未连接"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          历史连接次数: {connectionHistory.length}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">设备日历</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Calendar
                          mode="single"
                          selected={new Date()}
                          onSelect={() => {}}
                          className="rounded-md border"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <motion.div {...fadeInUp}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">错误日志</CardTitle>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearConnectionHistory}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        清空历史
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {errorHistory?.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-1/4">错误代码</TableHead>
                              <TableHead className="w-1/2">错误信息</TableHead>
                              <TableHead className="w-1/4">时间</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>{renderErrorHistory()}</TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          暂无错误日志
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
