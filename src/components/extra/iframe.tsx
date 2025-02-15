"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";

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
  loadingComponent?: React.ReactNode; // 添加 loadingComponent 属性
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

export const CustomIframe: React.FC<CustomIframeProps> = ({
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
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [shouldRender, setShouldRender] = useState(!lazy);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentDevice, setCurrentDevice] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const currentHeight = isMobile ? mobileHeight : height || desktopHeight;

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
    if (shouldRender) {
      const timer = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isLoading, onError, shouldRender, timeout]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
        }
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, src]);

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
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
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
      img.onload = () => {
        context?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        onScreenshot?.(dataUrl);
      };

      // 注意：这需要同源策略允许
      img.src = iframe.src;
    } catch (error) {
      console.error("Screenshot failed:", error);
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

  const handleDeviceChange = useCallback(
    (device: "mobile" | "tablet" | "desktop") => {
      startTransition(() => {
        setCurrentDevice(device);
        onDeviceChange?.(device);
      });
    },
    [onDeviceChange]
  );
  const sandboxProps = allowScripts
    ? { sandbox: `allow-scripts ${sandboxAttributes}`.trim() }
    : sandboxAttributes
    ? { sandbox: sandboxAttributes }
    : {};

  return (
    <div
      ref={wrapperRef}
      id="custom-iframe-wrapper"
      className={`custom-iframe-wrapper relative ${className}`}
    >
      {/* 控制面板 */}
      <div className="controls-panel flex items-center justify-between p-2 bg-gray-100 border-b">
        {showDeviceSelector && (
          <div className="device-selector flex gap-2">
            <button
              onClick={() => handleDeviceChange("mobile")}
              className={`p-2 rounded ${
                currentDevice === "mobile"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <Smartphone />
            </button>
            <button
              onClick={() => handleDeviceChange("tablet")}
              className={`p-2 rounded ${
                currentDevice === "tablet"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <Tablet />
            </button>
            <button
              onClick={() => handleDeviceChange("desktop")}
              className={`p-2 rounded ${
                currentDevice === "desktop"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <Monitor />
            </button>
          </div>
        )}

        {showZoomControls && (
          <div className="zoom-controls flex gap-2">
            <button
              onClick={() => handleZoom("out")}
              className="p-2 rounded bg-gray-200"
            >
              <ZoomOut />
            </button>
            <button
              onClick={() => handleZoom("reset")}
              className="p-2 rounded bg-gray-200"
            >
              <RefreshCw />
            </button>
            <button
              onClick={() => handleZoom("in")}
              className="p-2 rounded bg-gray-200"
            >
              <ZoomIn />
            </button>
          </div>
        )}

        <div className="action-buttons flex gap-2">
          <button onClick={handleRetry} className="p-2 rounded bg-gray-200">
            <RefreshCw />
          </button>
          <button onClick={takeScreenshot} className="p-2 rounded bg-gray-200">
            <Camera />
          </button>
          {allowFullScreen && (
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded bg-gray-200"
            >
              {isFullscreen ? <Minimize /> : <Maximize />}
            </button>
          )}
        </div>
      </div>

      {/* 替换原有的加载状态显示 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-indicator absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            {loadingComponent || (
              <LoadingSpinner
                size="lg"
                variant="primary"
                speed="normal"
                label={`加载中... ${Math.round(loadingProgress)}%`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 优化错误状态显示 */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="error-message absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm"
          >
            {errorComponent || (
              <div className="text-center space-y-4">
                <p className="text-destructive font-medium">
                  加载失败，请稍后重试
                </p>
                <Button variant="destructive" size="sm" onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {shouldRender && (
        <>
          <motion.iframe
            ref={iframeRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: isLoading ? 0 : 1,
              scale: isLoading ? 0.95 : 1,
            }}
            transition={{ duration: 0.3 }}
            src={src}
            title={title}
            width={width}
            height={currentHeight}
            allowFullScreen={allowFullScreen}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              border: "none",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              ...customStyles,
            }}
            {...sandboxProps}
          />
          {allowFullScreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 right-2 bg-gray-800 text-white p-2 rounded-full opacity-50 hover:opacity-100 transition-opacity"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          )}
        </>
      )}
    </div>
  );
};
