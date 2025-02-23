"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDnsmasqStore, DnsmasqConfig } from "@/stores/extra/dnsmasq";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Server,
  Settings,
  ChevronDown,
  ChevronUp,
  Network,
  HardDrive,
  Info,
  RotateCw,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Validation schema
const dnsmasqSchema = z.object({
  listenAddress: z.string().ip("请输入有效的IP地址"),
  port: z.string()
    .regex(/^\d+$/, "端口必须是数字")
    .transform(Number)
    .refine(port => port >= 1 && port <= 65535, "端口必须在1-65535之间"),
  dnsServers: z.string()
    .regex(
      /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(,\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})*$/,
      "请输入以逗号分隔的IP地址列表"
    ),
  cacheSize: z.string()
    .regex(/^\d+$/, "缓存大小必须是数字")
    .transform(Number)
    .refine(size => size >= 0 && size <= 10000, "缓存大小必须在0-10000之间"),
  domainNeeded: z.boolean(),
  bogusPriv: z.boolean(),
  expandHosts: z.boolean(),
  noCacheNegative: z.boolean(),
  strictOrder: z.boolean(),
  noHosts: z.boolean(),
});

// Animation variants
const fadeInOut = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.2,
    }
  },
};

const slideUpDown = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: {
      duration: 0.2,
    }
  },
};

const rotateChevron = {
  initial: { rotate: 0 },
  animate: { rotate: 180 },
};

// Form field definitions
const formFields = [
  {
    name: "listenAddress" as const,
    label: "监听地址",
    type: "text",
    icon: Server,
    description: "DNS服务器监听的IP地址",
    placeholder: "例如: 192.168.1.1",
  },
  {
    name: "port" as const,
    label: "端口",
    type: "text",
    icon: Network,
    description: "DNS服务器监听的端口号 (默认: 53)",
    placeholder: "例如: 53",
  },
  {
    name: "dnsServers" as const,
    label: "上游DNS",
    type: "text",
    icon: Server,
    description: "上游DNS服务器列表，以逗号分隔",
    placeholder: "例如: 8.8.8.8,8.8.4.4",
  },
  {
    name: "cacheSize" as const,
    label: "缓存大小",
    type: "text",
    icon: HardDrive,
    description: "DNS缓存条目的最大数量",
    placeholder: "例如: 1000",
  },
];

const advancedFields = [
  {
    name: "domainNeeded" as const,
    label: "域名校验",
    description: "不转发不包含完整域名的查询",
  },
  {
    name: "bogusPriv" as const,
    label: "私有地址保护",
    description: "不转发私有IP地址的反向查询",
  },
  {
    name: "expandHosts" as const,
    label: "扩展主机名",
    description: "为/etc/hosts中的简单名称添加域名",
  },
  {
    name: "noCacheNegative" as const,
    label: "禁用负缓存",
    description: "不缓存否定(NXDOMAIN)响应",
  },
  {
    name: "strictOrder" as const,
    label: "严格顺序",
    description: "按严格顺序查询上游DNS服务器",
  },
  {
    name: "noHosts" as const,
    label: "禁用hosts",
    description: "不读取/etc/hosts文件",
  },
];

const presets = {
  default: {
    listenAddress: "127.0.0.1",
    port: "53",
    dnsServers: "8.8.8.8,8.8.4.4",
    cacheSize: "1000",
    domainNeeded: true,
    bogusPriv: true,
    expandHosts: false,
    noCacheNegative: false,
    strictOrder: false,
    noHosts: false,
  },
  china: {
    listenAddress: "127.0.0.1",
    port: "53",
    dnsServers: "119.29.29.29,223.5.5.5",
    cacheSize: "2000",
    domainNeeded: true,
    bogusPriv: true,
    expandHosts: true,
    noCacheNegative: false,
    strictOrder: true,
    noHosts: false,
  },
};

export function DnsmasqConfigPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { config, isAdvancedOpen, updateConfig, toggleAdvanced, saveConfig } = useDnsmasqStore();

  const form = useForm<DnsmasqConfig>({
    defaultValues: config,
    resolver: zodResolver(dnsmasqSchema),
  });

  const { control, handleSubmit, formState: { errors, isDirty }, reset } = form;

  // 检测表单变化
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // 快捷键
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    if (hasChanges) {
      setShowConfirm(true);
    }
  });

  useHotkeys('mod+r', (e) => {
    e.preventDefault();
    handleReset();
  });

  const handleReset = useCallback(() => {
    reset(config);
    toast({
      description: "配置已重置",
      action: <RotateCw className="h-4 w-4" />,
    });
  }, [config, reset]);

  const handleSave = async (data: DnsmasqConfig) => {
    try {
      setIsLoading(true);
      updateConfig(data);
      await saveConfig();
      setHasChanges(false);
      toast({
        title: "保存成功",
        description: "DNS配置已更新",
        action: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "发生未知错误",
        variant: "destructive",
        action: <AlertTriangle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const applyPreset = (preset: keyof typeof presets) => {
    reset(presets[preset]);
    toast({
      description: `已应用${preset === 'china' ? '中国' : '默认'}预设`,
    });
  };

  return (
    <div className="w-full p-4 flex flex-col min-h-screen">
      <motion.div
        className="flex-1 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-primary" />
                <span>DNS配置</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                    未保存
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleReset}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">重置更改 (Ctrl+R)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <CardDescription className="text-sm flex items-center gap-2">
              <span>配置本地DNS服务</span>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => applyPreset('default')}
              >
                默认配置
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => applyPreset('china')}
              >
                中国配置
              </Button>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <form id="dnsmasq-form" onSubmit={handleSubmit(handleSave)} className="space-y-6">
                <motion.div
                  variants={{
                    animate: {
                      transition: {
                        staggerChildren: 0.1,
                      }
                    }
                  }}
                  initial="initial"
                  animate="animate"
                >
                  {/* 基本设置 */}
                  <div className="space-y-4">
                    {formFields.map((field) => (
                      <motion.div
                        key={field.name}
                        variants={fadeInOut}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <field.icon className="h-4 w-4 text-primary" />
                          </div>
                          <Label 
                            htmlFor={field.name}
                            className="text-sm font-medium flex items-center gap-1.5"
                          >
                            {field.label}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-[200px]"
                                >
                                  <p className="text-xs">{field.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                        </div>

                        <Controller
                          name={field.name}
                          control={control}
                          render={({ field: { value, ...props } }) => (
                            <div className="relative">
                              <Input
                                {...props}
                                id={field.name}
                                value={String(value)}
                                className={cn(
                                  "w-full h-9 text-sm",
                                  "transition-all duration-200",
                                  "hover:border-primary/50",
                                  "focus:ring-2 focus:ring-primary/20",
                                  errors[field.name] && "border-red-500 focus:border-red-500"
                                )}
                                placeholder={field.placeholder}
                              />
                            </div>
                          )}
                        />

                        {errors[field.name] && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-500"
                          >
                            {errors[field.name]?.message}
                          </motion.p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* 高级选项按钮 */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleAdvanced}
                      className={cn(
                        "w-full h-9 justify-between",
                        "transition-all duration-200",
                        "hover:bg-primary/5 hover:border-primary/50"
                      )}
                    >
                      <span className="text-sm font-medium">高级选项</span>
                      <motion.span
                        variants={rotateChevron}
                        animate={isAdvancedOpen ? "animate" : "initial"}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {isAdvancedOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </motion.span>
                    </Button>
                  </div>

                  {/* 高级选项内容 */}
                  <AnimatePresence>
                    {isAdvancedOpen && (
                      <motion.div
                        variants={slideUpDown}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-3 pt-2"
                      >
                        {advancedFields.map((field) => (
                          <motion.div
                            key={field.name}
                            variants={fadeInOut}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg",
                              "transition-all duration-200",
                              "hover:bg-primary/5"
                            )}
                          >
                            <Controller
                              name={field.name}
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <Checkbox
                                  id={field.name}
                                  checked={value as boolean}
                                  onCheckedChange={onChange}
                                  className={cn(
                                    "mt-0.5 h-4 w-4",
                                    "data-[state=checked]:bg-primary",
                                    "data-[state=checked]:border-primary"
                                  )}
                                />
                              )}
                            />
                            <div className="space-y-1 flex-1">
                              <Label
                                htmlFor={field.name}
                                className="text-sm font-medium"
                              >
                                {field.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </form>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t bg-muted/50">
            <div className="flex items-center justify-between w-full pt-4">
              <p className="text-xs text-muted-foreground">
                按 Ctrl+S 保存配置
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-9 px-4"
                >
                  重置
                </Button>
                <Button
                  type="submit"
                  form="dnsmasq-form"
                  className="h-9 px-4"
                  disabled={isLoading || !hasChanges}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>保存配置确认</AlertDialogTitle>
            <AlertDialogDescription>
              确定要保存当前的DNS配置吗？这可能会影响网络服务的运行。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSubmit(handleSave)()}
            >
              确认保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
