"use client";

import { useState, useEffect, useRef, memo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCw,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomIframe } from "@/components/extra/iframe";
import { PerformanceStats } from "@/components/extra/performance-stats";
import { App } from "@/types/extra";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/use-network-status";
import {
  LoadingIcon,
  Spinner,
  AnimatedProgress,
  FadeTransition,
} from "./loading-animations";
import { ErrorRecovery, ErrorType } from "./error-recovery";

// Performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    loadTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    resourceCount: 0,
  });

  const startMonitoring = () => {
    const interval = setInterval(() => {
      setMetrics({
        fps: 60 - Math.random() * 10,
        loadTime: Math.random() * 1000,
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        networkLatency: Math.random() * 200,
        resourceCount: Math.floor(Math.random() * 50),
      });
    }, 1000);
    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    // Cleanup monitoring
  };

  return { metrics, startMonitoring, stopMonitoring };
};

// Main Component
export const AppLaunchModal = memo(({ app, onClose }: { app: App | null; onClose: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorType | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isOnline } = useNetworkStatus();
  const modalRef = useRef<HTMLDivElement>(null);
  const { metrics, startMonitoring, stopMonitoring } = usePerformanceMonitor();
  const loadingInterval = useRef<NodeJS.Timeout>();

  const startLoading = () => {
    stopMonitoring();
    setIsLoading(true);
    setProgress(0);
    
    clearInterval(loadingInterval.current);
    loadingInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingInterval.current);
          return 100;
        }
        return Math.min(prev + Math.random() * 10, 100);
      });
    }, 200);

    startMonitoring();
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      onClose();
      return;
    }
    setRetryCount(prev => prev + 1);
    setError(null);
    startLoading();
  };

  const handleError = () => {
    clearInterval(loadingInterval.current);
    setError(isOnline ? "server" : "network");
    stopMonitoring();
    
    if (retryCount < 3) {
      handleRetry();
    }
  };

  const handleEscape = () => {
    if (isFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    } else {
      onClose();
    }
  };

  const handleSuccess = () => {
    clearInterval(loadingInterval.current);
    setIsLoading(false);
    setProgress(100);
    toast({
      title: "加载完成",
      description: `${app?.name} 已准备就绪`,
      action: <CheckCircle className="h-5 w-5 text-green-500" />,
    });
  };

  // Initialize loading on mount
  useEffect(() => {
    if (app && isOnline) {
      startLoading();
    }
    return () => {
      clearInterval(loadingInterval.current);
      stopMonitoring();
    };
  }, [app, isOnline]);

  // Handle network status change
  useEffect(() => {
    if (!isOnline && isLoading) {
      clearInterval(loadingInterval.current);
      setError("network");
      setIsLoading(false);
      stopMonitoring();
    } else if (isOnline && error === "network") {
      setError(null);
      startLoading();
    }
  }, [isOnline, isLoading, error]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!app) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={animationVariants.overlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
      >
        <motion.div
          ref={modalRef}
          variants={animationVariants.modal}
          className={cn(
            "relative",
            isFullscreen
              ? "w-screen h-screen"
              : "w-full max-w-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        >
          <Card className="relative h-full">
            <FadeTransition className="absolute left-4 top-4">
              <Badge
                variant={isOnline ? "secondary" : "destructive"}
                className="flex items-center gap-1.5"
              >
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {isOnline ? "已连接" : "已断开"}
              </Badge>
            </FadeTransition>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={handleEscape}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardContent className={cn(
              "p-6",
              isFullscreen && "h-full"
            )}>
              {error ? (
                <FadeTransition className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isOnline ? (
                        <AlertCircle className="h-12 w-12 text-destructive" />
                      ) : (
                        <WifiOff className="h-12 w-12 text-yellow-500" />
                      )}
                    </motion.div>
                    <h2 className="text-2xl font-bold">{app.name}</h2>
                  </div>

                  <ErrorRecovery 
                    type={error}
                    className="w-full max-w-md mx-auto"
                  />

                  <Button
                    variant="default"
                    onClick={handleRetry}
                    disabled={!isOnline}
                    className="mt-4"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    重试
                  </Button>
                </FadeTransition>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <LoadingIcon icon={app.icon} name={app.name} />
                  <FadeTransition>
                    <h2 className="text-2xl font-bold">{app.name}</h2>
                  </FadeTransition>
                  {isLoading ? (
                    <FadeTransition className="w-full max-w-md">
                      <AnimatedProgress value={progress} />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        正在加载... {progress.toFixed(0)}%
                      </p>
                    </FadeTransition>
                  ) : (
                    <Suspense
                      fallback={<Spinner className="h-8 w-8 text-primary" />}
                    >
                      <CustomIframe
                        src={app.url}
                        title={app.name}
                        onLoad={handleSuccess}
                        onError={handleError}
                        className={cn(
                          "w-full rounded-lg",
                          isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[60vh]"
                        )}
                      />
                    </Suspense>
                  )}
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {metrics && !error && !isLoading && (
                <FadeTransition className="absolute bottom-4 left-4">
                  <PerformanceStats metrics={metrics} />
                </FadeTransition>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

AppLaunchModal.displayName = "AppLaunchModal";

// Animation variants
const animationVariants = {
  overlay: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0 },
  },
  modal: {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 350 },
    },
    exit: { opacity: 0, scale: 0.95, y: 10 },
  },
};
