"use client";

import { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCw,
  AlertCircle,
  CheckCircle,
  MonitorSmartphone,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CustomIframe } from "@/components/extra/iframe";
import { PerformanceStats } from "@/components/extra/performance-stats";
import { App } from "@/types/extra";
import { AppSchema } from "@/types/extra/validation";
import { DeviceType } from "@/types/extra/iframe";
import { CustomIframeError } from "../../types/extra/errors";
import {
  getErrorInfo,
  logErrorDetails,
  getRetryDelay,
} from "./app-launch-error";
import { useAppLaunchStore } from "@/stores/extra/app-launch-store";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useHotkeys } from "react-hotkeys-hook";

interface AppLaunchModalProps {
  app: App | null;
  onClose: () => void;
}

const animationVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  modal: {
    hidden: {
      scale: 0.95,
      opacity: 0,
      y: 20,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      scale: 0.95,
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 },
    },
  },
  content: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 200,
      },
    },
    exit: { opacity: 0, y: -20 },
  },
};

const LoadingIcon = memo(({ icon, name }: { icon: string; name: string }) => (
  <div className="relative w-16 h-16">
    <Image
      src={icon}
      alt={name}
      fill
      className="rounded-2xl shadow-lg"
      priority
      sizes="64px"
    />
    <motion.div
      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
));

LoadingIcon.displayName = "LoadingIcon";

const LoadingProgress = memo(({ progress }: { progress: number }) => (
  <motion.div
    variants={animationVariants.content}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-3 w-full max-w-md"
  >
    <Progress
      value={progress}
      className={cn(
        "h-1.5 transition-all duration-300",
        progress >= 100 && "bg-green-500"
      )}
    />
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>正在启动应用</span>
      <span>{progress.toFixed(0)}%</span>
    </div>
  </motion.div>
));

LoadingProgress.displayName = "LoadingProgress";

// 定义一个函数来获取错误消息
const getErrorMessage = (error: string | null): string => {
  if (!error) return "";
  return error;
};

export function AppLaunchModal({ app, onClose }: AppLaunchModalProps) {
  const {
    retryCount,
    maxRetries,
    isLoading,
    error,
    incrementRetry,
    resetRetry,
    setLoading,
    setError,
  } = useAppLaunchStore();

  const { isOnline } = useNetworkStatus();
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
  } = usePerformanceMonitor({ interval: 1000 });

  // 预加载资源
  useEffect(() => {
    if (app?.url) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "document";
      link.href = app.url;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [app?.url]);

  // 键盘快捷键
  useHotkeys("esc", onClose, { enableOnFormTags: true });
  useHotkeys("f11", (e) => {
    e.preventDefault();
    toggleFullscreen();
  });

  const toggleFullscreen = useCallback(() => {
    if (!modalRef.current) return;

    if (!isFullscreen) {
      modalRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const startApp = useCallback(() => {
    if (!app || !isOnline) return;

    try {
      AppSchema.parse(app);
    } catch {
      const errorInfo = getErrorInfo(
        {
          type: "security",
          message: "应用配置无效",
          timestamp: Date.now(),
        } as CustomIframeError,
        isOnline
      );
      setError(errorInfo.description);
      return;
    }

    resetRetry();
    setLoading(true);
    setError(null);
    setProgress(0);
    resetMetrics();
    startMonitoring();

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 98);
      });
    }, 200);

    const timer = setTimeout(() => {
      setProgress(100);
      setLoading(false);
      clearInterval(interval);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [
    app,
    isOnline,
    resetRetry,
    setLoading,
    setError,
    resetMetrics,
    startMonitoring,
  ]);

  const handleRetry = useCallback(() => {
    if (retryCount >= maxRetries) return;

    const delay = getRetryDelay(retryCount);
    incrementRetry();

    setTimeout(() => {
      startApp();
    }, delay);
  }, [retryCount, maxRetries, incrementRetry, startApp]);

  const handleError = useCallback(
    (error: CustomIframeError) => {
      const errorInfo = getErrorInfo(error, isOnline);
      setError(errorInfo.description);
      setLoading(false);
      stopMonitoring();

      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: errorInfo.type === "error" ? "destructive" : "default",
        action: <AlertCircle className="h-5 w-5" />,
      });

      logErrorDetails(error, app?.name);
      handleRetry();
    },
    [isOnline, app, setError, setLoading, stopMonitoring, handleRetry]
  );

  // 初始化应用
  useEffect(() => {
    startApp();
    return () => {
      stopMonitoring();
    };
  }, [startApp, stopMonitoring]);

  useEffect(() => {
    if (!isOnline && isLoading) {
      setError("网络连接已断开");
      setLoading(false);
      stopMonitoring();
    } else if (isOnline && error === "网络连接已断开") {
      setLoading(true);
    }
  }, [isOnline, isLoading, error, setError, setLoading, stopMonitoring]);

  const networkStatus = useMemo(
    () => (
      <Badge
        variant={isOnline ? "secondary" : "destructive"}
        className="absolute left-3 top-3 z-10"
      >
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5 mr-1" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 mr-1" />
        )}
        {isOnline ? "已连接" : "已断开"}
      </Badge>
    ),
    [isOnline]
  );

  if (!app) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={animationVariants.overlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-md z-50",
          "flex items-center justify-center overflow-y-auto py-4"
        )}
      >
        <motion.div
          ref={modalRef}
          variants={animationVariants.modal}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "w-full relative mx-4",
            isFullscreen ? "max-w-none min-h-screen" : "max-w-4xl min-h-[80vh]",
            "bg-card/95 backdrop-blur-xl border border-border/50",
            "rounded-xl shadow-2xl transition-all duration-300"
          )}
        >
          <Card className="h-full">
            {networkStatus}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full opacity-75 hover:opacity-100 transition-opacity"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full opacity-75 hover:opacity-100 transition-opacity"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error ? (
              <motion.div
                variants={animationVariants.content}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center h-full p-6 space-y-6"
              >
                <AlertCircle
                  className={cn(
                    "h-16 w-16 text-destructive animate-pulse",
                    !isOnline && "text-yellow-500"
                  )}
                />
                <div className="text-center space-y-2">
                  <h2
                    className={cn(
                      "text-2xl font-bold",
                      !isOnline ? "text-yellow-500" : "text-destructive"
                    )}
                  >
                    {!isOnline ? "网络已断开" : "加载失败"}
                  </h2>
                  <p className="text-muted-foreground">
                    {getErrorMessage(error)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    重试次数: {retryCount}/{maxRetries}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (retryCount < maxRetries) {
                        incrementRetry();
                        setLoading(true);
                      } else {
                        onClose();
                      }
                    }}
                    className="min-w-[120px]"
                    disabled={!isOnline || retryCount >= maxRetries}
                  >
                    <RotateCw
                      className={cn(
                        "mr-2 h-4 w-4",
                        isLoading && "animate-spin"
                      )}
                    />
                    {retryCount < maxRetries ? "重试" : "关闭"}
                  </Button>
                  {!isOnline && (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => window.location.reload()}
                      className="min-w-[120px]"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      刷新页面
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                variants={animationVariants.content}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center h-full p-6 space-y-6"
              >
                <LoadingIcon icon={app.icon} name={app.name} />
                <h2 className="text-2xl font-bold text-center">{app.name}</h2>
                <LoadingProgress progress={progress} />
              </motion.div>
            ) : (
              <>
                <CustomIframe
                  src={app.url}
                  title={app.name}
                  className="w-full h-full rounded-lg"
                  allowFullScreen={true}
                  showDeviceSelector={true}
                  showZoomControls={true}
                  allowScripts={true}
                  lazy={false}
                  timeout={10000}
                  refreshInterval={0}
                  loadingComponent={
                    <motion.div
                      variants={animationVariants.content}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex flex-col items-center justify-center h-full space-y-4"
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">加载中...</p>
                    </motion.div>
                  }
                  errorComponent={
                    <motion.div
                      variants={animationVariants.content}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex flex-col items-center justify-center h-full space-y-4"
                    >
                      <AlertCircle className="h-12 w-12 text-destructive" />
                      <div className="text-center space-y-2">
                        <p className="text-destructive font-medium">加载失败</p>
                        <p className="text-sm text-muted-foreground">
                          请检查网络连接或应用配置
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.reload()}
                          className="min-w-[100px]"
                        >
                          <RotateCw className="mr-2 h-4 w-4" />
                          重试
                        </Button>
                      </div>
                    </motion.div>
                  }
                  onLoad={() => {
                    setError(null);
                    setLoading(false);
                    setProgress(100);
                    toast({
                      title: "应用加载成功",
                      description: `${app.name} 已准备就绪`,
                      action: (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ),
                    });
                  }}
                  onError={() => {
                    const error = new Error(
                      "Custom Iframe Error"
                    ) as CustomIframeError;
                    error.type = "load";
                    error.timestamp = Date.now();
                    handleError(error);
                  }}
                  onDeviceChange={(device: DeviceType) => {
                    toast({
                      title: "设备切换",
                      description: `已切换到${device}视图`,
                      action: <MonitorSmartphone className="h-5 w-5" />,
                    });
                  }}
                  onScreenshot={(dataUrl) => {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `${app.name}-screenshot.png`;
                    link.click();

                    toast({
                      title: "截图已保存",
                      description: "截图已成功保存到下载文件夹",
                      action: (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ),
                    });
                  }}
                  customStyles={{
                    backgroundColor: "var(--background)",
                    borderRadius: "var(--radius)",
                  }}
                />
                {isMonitoring && (
                  <PerformanceStats
                    metrics={metrics}
                    className="absolute bottom-4 left-4 max-w-[300px]"
                  />
                )}
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
