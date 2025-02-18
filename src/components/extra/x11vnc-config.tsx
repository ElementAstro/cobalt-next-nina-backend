"use client";

import React, { useEffect } from "react";
import { useForm, Controller, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useX11VNCStore } from "@/stores/extra/x11vnc";
import { useXvfbStore } from "@/store/useExtraStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Terminal,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Network,
  Settings,
  Monitor,
  HardDrive,
  Key,
  Scale,
  Clipboard,
  FileText,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Zod schema for validation
const formSchema = z.object({
  display: z.string().min(1, "Display is required"),
  port: z.string().regex(/^\d+$/, "Must be a valid port number"),
  viewonly: z.boolean(),
  shared: z.boolean(),
  forever: z.boolean(),
  ssl: z.boolean(),
  httpPort: z.string().regex(/^\d*$/, "Must be a valid port number").optional(),
  passwd: z.string().optional(),
  allowedHosts: z.string().optional(),
  logFile: z.string().optional(),
  clipboard: z.boolean(),
  noxdamage: z.boolean(),
  scale: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid scale factor"),
  repeat: z.boolean(),
  bg: z.boolean(),
  rfbauth: z.string().optional(),
});

export default function X11VNCConfig() {
  const { toast } = useToast();
  const store = useX11VNCStore();
  const xvfbStore = useXvfbStore();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display: store.display,
      port: store.port,
      viewonly: store.viewonly,
      shared: store.shared,
      forever: store.forever,
      ssl: store.ssl,
      httpPort: store.httpPort,
      passwd: store.passwd,
      allowedHosts: store.allowedHosts,
      logFile: store.logFile,
      clipboard: store.clipboard,
      noxdamage: store.noxdamage,
      scale: store.scale,
      repeat: store.repeat,
      bg: store.bg,
      rfbauth: store.rfbauth,
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = form;
  const watchAllFields = watch();

  useEffect(() => {
    if (isDirty) {
      Object.entries(watchAllFields).forEach(([key, value]) => {
        store.setConfig(key, value);
      });
      store.generateCommand();
    }
  }, [watchAllFields, store, isDirty]);

  const onSubmit = () => {
    store.generateCommand();
    toast({
      title: "Configuration Generated",
      description: "Your x11vnc command has been generated successfully.",
    });
  };

  const formAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const getAvailableDisplays = () => {
    if (xvfbStore.instances?.length > 0) {
      return xvfbStore.instances.map((instance) => ({
        value: instance.display,
        label: `Xvfb ${instance.display}`,
      }));
    }
    return [];
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-[calc(100vh-4rem)]">
      {/* 主配置卡片 */}
      <motion.div
        className="w-full flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none space-y-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              x11vnc 配置
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* 选项卡导航 - 改为垂直布局 */}
                <Tabs defaultValue="basic" className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-3 gap-2 sticky top-0 z-10 bg-background">
                    <TabsTrigger
                      value="basic"
                      className="flex items-center gap-2 py-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">基本设置</span>
                      <span className="sm:hidden">基本</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      className="flex items-center gap-2 py-2"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span className="hidden sm:inline">高级设置</span>
                      <span className="sm:hidden">高级</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-2 py-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">安全设置</span>
                      <span className="sm:hidden">安全</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto py-4">
                    {/* 基本设置选项卡 */}
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Display 选择器 */}
                        <FormField
                          name="display"
                          control={control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 mb-2">
                                <Monitor className="w-4 h-4" />
                                显示器
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="选择显示器" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableDisplays().map(
                                      ({ value, label }) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* VNC 端口输入框 */}
                        <FormField
                          name="port"
                          control={control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 mb-2">
                                <Network className="w-4 h-4" />
                                VNC 端口
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="5900" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* 基本开关选项 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 p-3 rounded-lg border">
                            <Controller
                              name="viewonly"
                              control={control}
                              render={({ field }) => (
                                <>
                                  <Switch
                                    id="viewonly"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label
                                    htmlFor="viewonly"
                                    className="flex items-center gap-2"
                                  >
                                    {field.value ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                    仅查看模式
                                  </Label>
                                </>
                              )}
                            />
                          </div>

                          {/* ...其他开关选项... */}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ...其他选项卡内容... */}
                  </div>
                </Tabs>

                {/* 生成的命令显示 */}
                <AnimatePresence>
                  {store.command && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Label className="flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        生成的命令:
                      </Label>
                      <div className="relative rounded-md overflow-hidden">
                        <Input
                          value={store.command}
                          readOnly
                          className="font-mono text-sm bg-muted/50"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 提交按钮 */}
                <Button type="submit" className="w-full sm:w-auto">
                  <Terminal className="mr-2 h-4 w-4" />
                  生成命令
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      {/* 状态卡片 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              连接状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">活动连接</p>
                  <p className="text-2xl font-bold mt-1">3</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">网络使用率</p>
                  <p className="text-2xl font-bold mt-1">75%</p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={75} />
                <p className="text-xs text-muted-foreground text-center">
                  当前网络负载
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
