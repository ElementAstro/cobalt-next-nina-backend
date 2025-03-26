"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Settings,
  History,
  AlertTriangle,
  Clock,
  RefreshCcw,
  Bug,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { useConnectionConfigStore } from "@/stores/connection/configStore";
import { useUIStore } from "@/stores/connection/uiStore";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { usePortScanStore } from "@/stores/connection/portScanStore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
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

  const {
    connectionHistory,
    errorHistory,
    clearConnectionHistory,
    isConnected,
  } = useConnectionStatusStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

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

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await saveSettings();
      toast({
        title: "设置保存成功",
        description: "高级配置已成功保存",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "设置保存失败",
        description:
          error instanceof Error ? error.message : "保存过程中发生错误",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

  const prefersReducedMotion = useReducedMotion();

  const fadeInUp = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 1, 1],
      },
    },
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "w-[90vw] max-w-6xl h-[85vh] p-0 overflow-hidden",
          "bg-background/95 dark:bg-gray-900/95",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
          "border border-border/50 rounded-lg shadow-lg",
          "transition-all duration-200",
          isLoading && "opacity-90 cursor-wait"
        )}
        aria-busy={isLoading}
        aria-describedby="loading-status"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-dialog-title"
      >
        <motion.div
          className="h-full flex flex-col"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeInUp}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle
              id="config-dialog-title"
              className="flex items-center gap-2 text-xl font-semibold"
            >
              <Settings className="w-5 h-5 text-primary" />
              配置管理器 - 天文摄影软件
            </DialogTitle>
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2"
                  id="loading-status"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在处理...</span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-muted overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{
                        width: ["0%", "100%"],
                        transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        },
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                <motion.div className="space-y-4" {...fadeInUp}>
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
                            <span className="text-sm flex-1">
                              {selectedFile.name}
                            </span>
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
                      <CardContent>
                        <div className="space-y-6">
                          <AnimatePresence mode="wait">
                            {isLoading ? (
                              <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                      <Skeleton className="h-5 w-28" />
                                      <Skeleton className="h-9 w-full" />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between">
                                  <Skeleton className="h-9 w-24" />
                                  <Skeleton className="h-9 w-24" />
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <motion.div
                                    className="space-y-2"
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Label
                                      htmlFor="connectionTimeout"
                                      className="inline-flex items-center gap-2"
                                    >
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      连接超时 (秒)
                                    </Label>
                                    <div className="relative">
                                      <Input
                                        id="connectionTimeout"
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={connectionTimeout}
                                        onChange={(e) => {
                                          const value = Number(e.target.value);
                                          if (value >= 1 && value <= 300) {
                                            updateSettings({
                                              connectionTimeout: value,
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "w-full pr-10 font-mono",
                                          "transition-shadow duration-200",
                                          "focus-visible:ring-2 focus-visible:ring-primary",
                                          connectionTimeout < 1 ||
                                            (connectionTimeout > 300 &&
                                              "border-red-500")
                                        )}
                                        aria-invalid={
                                          connectionTimeout < 1 ||
                                          connectionTimeout > 300
                                        }
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        秒
                                      </span>
                                    </div>
                                  </motion.div>

                                  <motion.div
                                    className="space-y-2"
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Label
                                      htmlFor="maxRetries"
                                      className="inline-flex items-center gap-2"
                                    >
                                      <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                                      最大重试次数
                                    </Label>
                                    <div className="relative">
                                      <Input
                                        id="maxRetries"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={maxRetries}
                                        onChange={(e) => {
                                          const value = Number(e.target.value);
                                          if (value >= 1 && value <= 10) {
                                            updateSettings({
                                              maxRetries: value,
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "w-full pr-10 font-mono",
                                          "transition-shadow duration-200",
                                          "focus-visible:ring-2 focus-visible:ring-primary",
                                          maxRetries < 1 ||
                                            (maxRetries > 10 &&
                                              "border-red-500")
                                        )}
                                        aria-invalid={
                                          maxRetries < 1 || maxRetries > 10
                                        }
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        次
                                      </span>
                                    </div>
                                  </motion.div>

                                  <motion.div
                                    className="space-y-2"
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Label
                                      htmlFor="debugMode"
                                      className="inline-flex items-center gap-2"
                                    >
                                      <Bug className="w-4 h-4 text-muted-foreground" />
                                      调试模式
                                    </Label>
                                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-transparent">
                                      <Switch
                                        id="debugMode"
                                        checked={debugMode}
                                        onCheckedChange={(checked) =>
                                          updateSettings({ debugMode: checked })
                                        }
                                        className="data-[state=checked]:bg-primary"
                                      />
                                      <motion.span
                                        className="text-sm text-muted-foreground"
                                        animate={{
                                          opacity: [0.5, 1],
                                          scale: [0.95, 1],
                                        }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        {debugMode ? "开启" : "关闭"}
                                      </motion.span>
                                    </div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                onClick={handleSaveSettings}
                                className={cn(
                                  "flex items-center gap-2",
                                  "transition-all duration-200",
                                  "hover:shadow-md",
                                  "active:scale-95",
                                  isSaving && "opacity-70 cursor-wait"
                                )}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                {isSaving ? "保存中..." : "保存设置"}
                              </Button>
                            </motion.div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "flex items-center gap-2",
                                      "transition-all duration-200",
                                      "hover:shadow-md",
                                      "active:scale-95",
                                      "border-primary/20",
                                      "hover:border-primary/50"
                                    )}
                                  >
                                    <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span>主题设置</span>
                                  </Button>
                                </motion.div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className={cn(
                                  "w-40",
                                  "animate-in fade-in-80",
                                  "bg-background/95 backdrop-blur-sm"
                                )}
                              >
                                <DropdownMenuLabel>选择主题</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleThemeChange("light")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Sun className="w-4 h-4" />
                                  浅色模式
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleThemeChange("dark")}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Moon className="w-4 h-4" />
                                  深色模式
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                          <p className="text-sm text-muted-foreground">
                            暂无扫描记录
                          </p>
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
