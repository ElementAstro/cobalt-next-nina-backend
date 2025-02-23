"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { useHotkeys } from "react-hotkeys-hook";
import {
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Camera,
  X,
  Info,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface CustomIframeProps {
  src: string;
  title: string;
  width?: string | number;
  height?: string | number;
  allowFullScreen?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  errorComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  timeout?: number;
  lazy?: boolean;
  mobileHeight?: string | number;
  desktopHeight?: string | number;
  customStyles?: React.CSSProperties;
  sandboxAttributes?: string;
  allowScripts?: boolean;
  refreshInterval?: number;
  onMessage?: (event: MessageEvent) => void;
  onScreenshot?: (dataUrl: string) => void;
  onDeviceChange?: (device: "mobile" | "tablet" | "desktop") => void;
  showDeviceSelector?: boolean;
  showZoomControls?: boolean;
}

const animationVariants = {
  iframe: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  },
  overlay: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  },
};

const DeviceButton = memo(({ 
  device, 
  currentDevice, 
  onClick, 
  icon: Icon,
  label,
}: {
  device: "mobile" | "tablet" | "desktop";
  currentDevice: string;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant={currentDevice === device ? "default" : "outline"}
        size="icon"
        onClick={onClick}
        className={cn(
          "h-8 w-8",
          "transition-all duration-200",
          currentDevice !== device && "hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
));

DeviceButton.displayName = "DeviceButton";

const ControlButton = memo(({ 
  onClick, 
  icon: Icon,
  label,
  disabled = false,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8",
          "transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5",
          "disabled:opacity-50"
        )}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
));

ControlButton.displayName = "ControlButton";

export const CustomIframe = memo(({
  src,
  title,
  width = "100%",
  height,
  allowFullScreen = false,
  className = "",
  onLoad,
  onError,
  errorComponent,
  loadingComponent,
  timeout = 10000,
  lazy = false,
  mobileHeight = "300px",
  desktopHeight = "500px",
  customStyles = {},
  sandboxAttributes = "",
  allowScripts = false,
  refreshInterval,
  onMessage,
  onScreenshot,
  onDeviceChange,
  showDeviceSelector = true,
  showZoomControls = true,
}: CustomIframeProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [shouldRender, setShouldRender] = useState(!lazy);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentDevice, setCurrentDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();
  
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const currentHeight = isMobile ? mobileHeight : height || desktopHeight;

  // Define core functions first
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(100);
    clearInterval(progressInterval.current);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    clearInterval(progressInterval.current);
    onError?.();
  }, [onError]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setLoadingProgress(0);

    if (iframeRef.current) {
      iframeRef.current.src = src;
    }
  }, [src]);

  const takeScreenshot = useCallback(async () => {
    if (!iframeRef.current) return;

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const iframe = iframeRef.current;

      canvas.width = iframe.clientWidth;
      canvas.height = iframe.clientHeight;

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        context?.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          onScreenshot?.(dataUrl);
          toast({
            title: "截图成功",
            description: "已保存到下载文件夹",
          });
        } catch (error) {
          console.error("Screenshot failed:", error);
          toast({
            title: "截图失败",
            description: "无法访问iframe内容，可能是跨域限制",
            variant: "destructive",
          });
        }
      };

      img.onerror = () => {
        toast({
          title: "截图失败",
          description: "无法加载iframe内容",
          variant: "destructive",
        });
      };

      img.src = iframe.src;
    } catch (error) {
      console.error("Screenshot failed:", error);
      toast({
        title: "截图失败",
        description: "发生未知错误",
        variant: "destructive",
      });
    }
  }, [onScreenshot]);

  const handleZoom = useCallback((action: "in" | "out" | "reset") => {
    startTransition(() => {
      setZoom((prev) => {
        switch (action) {
          case "in":
            return Math.min(prev + 0.1, 2);
          case "out":
            return Math.max(prev - 0.1, 0.5);
          case "reset":
            return 1;
          default:
            return prev;
        }
      });
    });
  }, []);

  const handleDeviceChange = useCallback((device: "mobile" | "tablet" | "desktop") => {
    startTransition(() => {
      setCurrentDevice(device);
      onDeviceChange?.(device);
    });
  }, [onDeviceChange]);

  // Setup effects after function definitions
  useEffect(() => {
    if (lazy) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );

      if (wrapperRef.current) {
        observer.observe(wrapperRef.current);
      }
      return () => observer.disconnect();
    }
  }, [lazy]);

  useEffect(() => {
    if (shouldRender && isLoading) {
      progressInterval.current = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + (100 - prev) * 0.1;
          return Math.min(next, 98);
        });
      }, 500);

      const timer = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }, timeout);

      return () => {
        clearInterval(progressInterval.current);
        clearTimeout(timer);
      };
    }
  }, [isLoading, onError, shouldRender, timeout]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(handleRetry, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, handleRetry]);

  useEffect(() => {
    if (onMessage) {
      const handleMessage = (event: MessageEvent) => {
        if (event.source === iframeRef.current?.contentWindow) {
          onMessage(event);
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [onMessage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Setup keyboard shortcuts after all functions are defined
  useHotkeys('f', () => allowFullScreen && toggleFullscreen());
  useHotkeys('r', handleRetry);
  useHotkeys('s', takeScreenshot);
  useHotkeys('=', () => handleZoom('in'));
  useHotkeys('-', () => handleZoom('out'));
  useHotkeys('0', () => handleZoom('reset'));

  const sandboxProps = allowScripts
    ? { sandbox: `allow-scripts ${sandboxAttributes}`.trim() }
    : sandboxAttributes
    ? { sandbox: sandboxAttributes }
    : {};

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative rounded-lg border overflow-hidden",
        "bg-background/95 backdrop-blur-sm",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-between p-2",
        "bg-muted/50 backdrop-blur-sm border-b",
        "transition-all duration-200"
      )}>
        {showDeviceSelector && (
          <div className="flex items-center gap-2">
            <DeviceButton
              device="mobile"
              currentDevice={currentDevice}
              onClick={() => handleDeviceChange("mobile")}
              icon={Smartphone}
              label="移动端视图"
            />
            <DeviceButton
              device="tablet"
              currentDevice={currentDevice}
              onClick={() => handleDeviceChange("tablet")}
              icon={Tablet}
              label="平板视图"
            />
            <DeviceButton
              device="desktop"
              currentDevice={currentDevice}
              onClick={() => handleDeviceChange("desktop")}
              icon={Monitor}
              label="桌面视图"
            />
          </div>
        )}

        {showZoomControls && (
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={() => handleZoom("out")}
              icon={ZoomOut}
              label="缩小 (-)"
              disabled={zoom <= 0.5}
            />
            <ControlButton
              onClick={() => handleZoom("reset")}
              icon={RefreshCw}
              label="重置缩放 (0)"
            />
            <ControlButton
              onClick={() => handleZoom("in")}
              icon={ZoomIn}
              label="放大 (+)"
              disabled={zoom >= 2}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <ControlButton
            onClick={handleRetry}
            icon={RefreshCw}
            label="刷新 (R)"
          />
          <ControlButton
            onClick={takeScreenshot}
            icon={Camera}
            label="截图 (S)"
          />
          {allowFullScreen && (
            <ControlButton
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              label={`${isFullscreen ? '退出' : '进入'}全屏 (F)`}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            variants={animationVariants.overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute inset-0",
              "flex items-center justify-center",
              "bg-background/80 backdrop-blur-sm",
              "z-10"
            )}
          >
            {loadingComponent || (
              <div className="text-center space-y-4">
                <LoadingSpinner
                  size="lg"
                  variant="primary"
                  speed="normal"
                />
                <div className="text-sm text-muted-foreground">
                  加载中... {Math.round(loadingProgress)}%
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasError && (
          <motion.div
            variants={animationVariants.overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute inset-0",
              "flex items-center justify-center",
              "bg-destructive/10 backdrop-blur-sm",
              "z-10"
            )}
          >
            {errorComponent || (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">
                    加载失败
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    请检查网络连接或刷新重试
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className={cn(
                    "min-w-[100px]",
                    "transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {shouldRender && (
        <motion.div
          variants={animationVariants.iframe}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative"
        >
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            width={width}
            height={currentHeight}
            allowFullScreen={allowFullScreen}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full",
              "bg-background",
              "transition-transform duration-200"
            )}
            style={{
              border: "none",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              ...customStyles,
            }}
            {...sandboxProps}
          />
          
          {zoom !== 1 && (
            <div className={cn(
              "absolute bottom-4 right-4",
              "px-2 py-1 rounded",
              "bg-background/80 backdrop-blur-sm",
              "border shadow-sm",
              "text-xs text-muted-foreground",
              "flex items-center gap-1"
            )}>
              <Info className="h-3 w-3" />
              {Math.round(zoom * 100)}%
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
});

CustomIframe.displayName = "CustomIframe";
