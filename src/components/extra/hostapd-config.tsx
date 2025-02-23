"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HostapdConfig,
  hostapdConfigSchema,
  CHANNEL_OPTIONS,
} from "@/types/extra/hostapd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Save,
  AlertCircle,
  WifiOff,
  Settings,
  Info,
  Shield,
  Radio,
  Signal,
  Lock,
  EyeOff,
  RotateCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDnsmasqStore } from "@/store/useExtraStore";
import { useHostapdStore } from "@/store/useExtraStore";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
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
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";

// 增强的验证模式
const enhancedHostapdSchema = hostapdConfigSchema.extend({
  ssid: z
    .string()
    .min(1, "SSID 不能为空")
    .max(32, "SSID 不能超过32个字符")
    .regex(/^[a-zA-Z0-9_\- ]+$/, "SSID 只能包含字母、数字、下划线和连字符"),
  wpa_passphrase: z
    .string()
    .min(8, "密码至少需要8个字符")
    .max(63, "密码不能超过63个字符")
    .regex(/[A-Z]/, "密码必须包含至少一个大写字母")
    .regex(/[a-z]/, "密码必须包含至少一个小写字母")
    .regex(/[0-9]/, "密码必须包含至少一个数字")
    .regex(/[\W_]/, "密码必须包含至少一个特殊字符"),
  country_code: z
    .string()
    .length(2, "国家代码必须是2个字符")
    .regex(/^[A-Z]{2}$/, "国家代码必须是2个大写字母"),
});

  default: {
    ssid: "MyWiFi",
    wpa_passphrase: "MyPassword123!",
    interface: "wlan0",
    driver: "nl80211",
    hw_mode: "g",
    channel: 6,
    wpa: 2,
    wpa_key_mgmt: "WPA-PSK",
    wpa_pairwise: "TKIP",
    rsn_pairwise: "CCMP",
    auth_algs: 1,
    country_code: "US",
    ieee80211n: 1,
    ieee80211ac: 1,
    wmm_enabled: 1,
    macaddr_acl: 0,
    ignore_broadcast_ssid: 0,
  },
  performance: {
    ...configPresets.default,
    hw_mode: "a",
    channel: 36,
    ieee80211ac: 1,
    wmm_enabled: 1,
  },
  secure: {
    ...configPresets.default,
    ignore_broadcast_ssid: 1,
    macaddr_acl: 1,
    wpa: 3,
  },
};

// 状态动画变体
const fadeAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const slideAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
};

// 密码强度指示器组件
const PasswordStrength = memo(({ password }: { password: string }) => {
  const getStrength = () => {
    const checks = [
      password.length >= 12,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[\W_]/.test(password),
    ];
    
    const strength = checks.filter(Boolean).length;
    const percentage = (strength / checks.length) * 100;

    if (percentage <= 20) return { value: percentage, color: "bg-red-500", label: "非常弱" };
    if (percentage <= 40) return { value: percentage, color: "bg-orange-500", label: "弱" };
    if (percentage <= 60) return { value: percentage, color: "bg-yellow-500", label: "中等" };
    if (percentage <= 80) return { value: percentage, color: "bg-blue-500", label: "强" };
    return { value: percentage, color: "bg-green-500", label: "非常强" };
  };

  const { value, color, label } = getStrength();

  return (
    <motion.div 
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">密码强度: {label}</p>
    </motion.div>
  );
});

PasswordStrength.displayName = "PasswordStrength";

// 网络状态卡片组件
const NetworkStats = memo(({ stats }: { 
  stats: {
    connectedDevices: number;
    networkLoad: number;
    signalStrength: number;
  }
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Signal className="w-5 h-5 text-primary" />
        网络状态
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            label="已连接设备"
            value={stats.connectedDevices}
            icon={Wifi}
          />
          <StatsCard
            label="网络负载"
            value={`${stats.networkLoad}%`}
            icon={Signal}
          />
          <StatsCard
            label="信号强度"
            value={`${stats.signalStrength}%`}
            icon={Radio}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">网络负载</span>
            <span className="font-medium">{stats.networkLoad}%</span>
          </div>
          <Progress 
            value={stats.networkLoad} 
            className={cn(
              "h-2 transition-all duration-300",
              stats.networkLoad > 80 ? "bg-red-500" :
              stats.networkLoad > 60 ? "bg-yellow-500" :
              "bg-primary"
            )}
          />
        </div>
      </div>
    </CardContent>
  </Card>
));

NetworkStats.displayName = "NetworkStats";

// 状态卡片组件
const StatsCard = memo(({ 
  label, 
  value, 
  icon: Icon 
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <motion.div
    className={cn(
      "p-4 rounded-lg border",
      "bg-card/50 backdrop-blur-sm",
      "transition-all duration-200"
    )}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </motion.div>
));

StatsCard.displayName = "StatsCard";

// 主组件
export function HostapdConfigPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [status, setStatus] = useState<"active" | "inactive" | "error">("inactive");
  const [availableChannels, setAvailableChannels] = useState<number[]>(CHANNEL_OPTIONS["2.4GHz"]);
  const [connectionStats, setConnectionStats] = useState({
    connectedDevices: 0,
    networkLoad: 0,
    signalStrength: 0,
  });

  const dnsmasqStore = useDnsmasqStore();
  const hostapdStore = useHostapdStore();

  const form = useForm<HostapdConfig>({
    resolver: zodResolver(enhancedHostapdSchema),
    defaultValues: hostapdStore.config || configPresets.default,
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form;
  const watchHwMode = watch("hw_mode");
  const watchPassword = watch("wpa_passphrase");

  // 监听表单变化
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // 快捷键
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    if (hasChanges) {
      setShowConfirm(true);
    }
  }, { enableOnFormTags: true });

  useHotkeys('mod+r', (e) => {
    e.preventDefault();
    handleReset();
  }, { enableOnFormTags: true });

  // 频道更新
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchHwMode === "a") {
        setAvailableChannels(CHANNEL_OPTIONS["5GHz"]);
        setValue("channel", 36);
      } else {
        setAvailableChannels(CHANNEL_OPTIONS["2.4GHz"]);
        setValue("channel", 6);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [watchHwMode, setValue]);

  // 状态监控
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stats = await fetchConnectionStats();
        setConnectionStats(stats);
      } catch (error) {
        console.error("Failed to fetch connection stats:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 重置配置
  const handleReset = useCallback(() => {
    form.reset(hostapdStore.config);
    toast({
      description: "配置已重置",
      action: <RotateCw className="h-4 w-4" />,
    });
  }, [form, hostapdStore.config]);

  // 应用预设
  const applyPreset = useCallback((preset: keyof typeof configPresets) => {
    form.reset(configPresets[preset]);
    toast({
      description: `已应用${
        preset === 'performance' ? '性能优先' :
        preset === 'secure' ? '安全优先' : '默认'
      }配置`,
    });
  }, [form]);

  // 切换接入点状态
  const handleToggleAP = async () => {
    setIsLoading(true);
    try {
      const newStatus = status === "active" ? "inactive" : "active";
      setStatus(newStatus);

      toast({
        title: `WiFi 接入点${newStatus === "active" ? "已启动" : "已停止"}`,
        description: `接入点已成功${newStatus === "active" ? "激活" : "停用"}`,
        action: newStatus === "active" ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4" />
        ),
      });

      hostapdStore.setConfig(form.getValues());
    } catch (error) {
      setStatus("error");
      toast({
        title: "错误",
        description: "切换接入点状态失败",
        variant: "destructive",
        action: <AlertTriangle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 同步DNS配置
  const syncWithDnsmasq = useCallback(() => {
    if (status === "active" && dnsmasqStore.config) {
      dnsmasqStore.updateConfig({
        ...dnsmasqStore.config,
        listenAddress: form.getValues("interface"),
      });
    }
  }, [status, dnsmasqStore, form]);

  // 保存配置
  const onSubmit = async (values: HostapdConfig) => {
    setIsLoading(true);
    try {
      await hostapdStore.setConfig(values);
      syncWithDnsmasq();
      setHasChanges(false);
      setShowConfirm(false);

      toast({
        title: "配置已保存",
        description: "WiFi配置已成功更新",
        action: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "保存配置失败",
        variant: "destructive",
        action: <AlertTriangle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟获取连接状态
  const fetchConnectionStats = async () => {
    return new Promise<{
      connectedDevices: number;
      networkLoad: number;
      signalStrength: number;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          connectedDevices: Math.floor(Math.random() * 10),
          networkLoad: Math.floor(Math.random() * 100),
          signalStrength: Math.floor(Math.random() * 100),
        });
      }, 500);
    });
  };

  return (
    <div className="p-4 min-h-[calc(100vh-4rem)] flex flex-col gap-4">
      <motion.div
        className="w-full flex-1"
        initial={fadeAnimation.initial}
        animate={fadeAnimation.animate}
        exit={fadeAnimation.exit}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wifi className="w-5 h-5 text-primary" />
                  <span>WiFi 配置</span>
                  <Badge
                    variant={status === "active" ? "default" : "secondary"}
                    className={cn(
                      "ml-2",
                      status === "active" && "bg-green-500/10 text-green-500",
                      status === "error" && "bg-red-500/10 text-red-500"
                    )}
                  >
                    {status === "active" ? "已启动" : 
                     status === "error" ? "错误" : "已停止"}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  配置并管理您的WiFi接入点
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={status === "active" ? "destructive" : "default"}
                  onClick={handleToggleAP}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {status === "active" ? (
                    <WifiOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Wifi className="mr-2 h-4 w-4" />
                  )}
                  {status === "active" ? "停止接入点" : "启动接入点"}
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className={cn(
                          "w-9 h-9",
                          "transition-all duration-200",
                          isAdvancedMode && "border-primary text-primary"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {isAdvancedMode ? "关闭" : "开启"}高级模式
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('default')}
                className="h-8 text-xs"
              >
                默认配置
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('performance')}
                className="h-8 text-xs"
              >
                性能优先
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('secure')}
                className="h-8 text-xs"
              >
                安全优先
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            <Tabs defaultValue="basic" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="py-2">
                  <Settings className="w-4 h-4 mr-2" />
                  基本设置
                </TabsTrigger>
                <TabsTrigger value="security" className="py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  安全设置
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="py-6 space-y-8">
                  <TabsContent value="basic" className="mt-0">
                    <Form {...form}> className="mt-0"
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <motion.div
                          variants={slideAnimation}
                          initial="initial"
                          animate="animate"
                          className="grid gap-6"
                        >
                          <FormField
                            control={control}
                            name="ssid"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Radio className="w-4 h-4 text-primary" />
                                  网络名称 (SSID)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="输入网络名称..."
                                    {...field}
                                    className={cn(
                                      "transition-all duration-200",
                                      errors.ssid && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                  />
                                </FormControl>
                                <FormDescription>
                                  设置WiFi网络的显示名称
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name="hw_mode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Signal className="w-4 h-4 text-primary" />
                                  无线频段
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择无线频段" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="a">
                                      5 GHz (802.11a/n/ac)
                                    </SelectItem>
                                    <SelectItem value="g">
                                      2.4 GHz (802.11b/g/n)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  选择无线网络的工作频段
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {isAdvancedMode && (
                            <motion.div
                              variants={slideAnimation}
                              initial="initial"
                              animate="animate"
                              className="space-y-4"
                            >
                              <FormField
                                control={control}
                                name="channel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                      <Radio className="w-4 h-4 text-primary" />
                                      信道
                                    </FormLabel>
                                    <Select
                                      onValueChange={(value) => field.onChange(Number(value))}
                                      value={field.value.toString()}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="选择信道" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableChannels.map((channel) => (
                                          <SelectItem
                                            key={channel}
                                            value={channel.toString()}
                                          >
                                            信道 {channel}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      选择无线网络的工作信道
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="security">
                    <Form {...form}>
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <motion.div
                          variants={slideAnimation}
                          initial="initial"
                          animate="animate"
                          className="grid gap-6"
                        >
                          <FormField
                            control={control}
                            name="wpa_passphrase"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-primary" />
                                  安全密码
                                </FormLabel>
                                <FormControl>
                                  <Input
                                   laceholder="输入安全密码..."
                                    ..field}
                                    assName={cn(
                                    "transition-all duration-200",
