"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Frown, RefreshCcw, Home, Copy, Camera, Telescope } from "lucide-react";
import html2canvas from "html2canvas";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const config404 = {
  errorCode: "404_PAGE_NOT_FOUND",
  errorMessage: "页面未找到",
  collectingInfoText: "正在收集错误信息...",
  homeButtonText: "返回首页",
  reloadButtonText: "重新加载页面",
  backgroundColor: "bg-[#0b0f19]",
  textColor: "text-white",
  errorDetailsText: "查看详细错误信息",
  feedbackText: "提交错误反馈",
  reportErrorText: "报告错误",
  copyErrorText: "复制错误信息",
  copiedText: "已复制",
  systemInfoText: "系统信息",
  screenshotText: "截图",
  screenshotSuccessText: "截图已保存",
  screenshotErrorText: "截图失败",
  theme: "dark",
};

interface BlueScreen404Props {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isErrorBoundary?: boolean;
}

export default function BlueScreen404({
  error,
  errorInfo,
  isErrorBoundary = false,
}: BlueScreen404Props) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [screenshotStatus, setScreenshotStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showContent) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 1 : 100));
      }, 30);
      return () => clearInterval(interval);
    }
  }, [showContent]);

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      toast.success(t("copiedText"));
    } catch (err) {
      console.error("Failed to copy error details:", err);
      toast.error("复制错误信息失败");
    }
  };

  const handleTakeScreenshot = async () => {
    try {
      setScreenshotStatus("idle");
      const canvas = await html2canvas(document.body);
      const link = document.createElement("a");
      link.download = `error-screenshot-${new Date().toISOString()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      setScreenshotStatus("success");
    } catch (error) {
      console.error("Failed to take screenshot:", error);
      setScreenshotStatus("error");
    }
  };

  const errorDetails = `
    ${t("errorTime")}: ${new Date().toLocaleString()}
    ${t("browser")}: ${
    typeof navigator !== "undefined" ? navigator.userAgent : "N/A"
  }
    ${t("pageURL")}: ${
    typeof window !== "undefined" ? window.location.href : ""
  }
    ${t("errorCode")}: ${
    isErrorBoundary ? error?.name || "UNKNOWN_ERROR" : config404.errorCode
  }
    ${t("errorMessage")}: ${error?.message || config404.errorMessage}
    ${errorInfo ? `\n${t("componentStack")}:\n${errorInfo.componentStack}` : ""}
    ${error?.stack ? `\n${t("errorStack")}:\n${error.stack}` : ""}
  `.trim();

  return (
    <TooltipProvider>
      <div
        className={`min-h-screen ${config404.backgroundColor} ${config404.textColor} p-4 flex flex-col justify-center items-center transition-opacity duration-500 ease-in-out overflow-hidden relative`}
        style={{ opacity: showContent ? 1 : 0 }}
      >
        {/* 星空背景 */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className={`w-full max-w-2xl space-y-4 z-10`}>
          {/* 错误信息卡片 */}
          <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-3">
                <Frown className="h-8 w-8 text-red-400" />
                <CardTitle className="text-2xl font-bold">
                  {isErrorBoundary ? t("fatalAppError") : t("fatalSystemError")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm">
                  {t("errorCode")}:{" "}
                  <Label className="font-mono text-red-400">
                    {isErrorBoundary
                      ? error?.name || "UNKNOWN_ERROR"
                      : config404.errorCode}
                  </Label>
                </p>
                <p className="text-sm">
                  {t("errorMessage")}:{" "}
                  <Label className="text-red-300">
                    {error?.message || config404.errorMessage}
                  </Label>
                </p>
              </div>

              {/* 进度条 */}
              <div className="space-y-1">
                <Progress value={progress} className="h-2 bg-gray-800" />
                <p className="text-xs text-gray-400">
                  {t("collectingInfoText")} {progress}% {t("completed")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 错误详情 */}
          <Collapsible>
            <CollapsibleTrigger className="text-sm">
              <div className="flex items-center space-x-2">
                <Telescope className="h-4 w-4" />
                <Label>{t("viewErrorDetails")}</Label>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
                <CardContent className="relative p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ScrollArea className="h-[240px] w-full rounded-md border border-gray-700 bg-gray-800/50">
                      <div className="p-4">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                          {errorDetails}
                        </pre>
                      </div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </motion.div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleCopyError}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("copyErrorText")}</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary" className="h-12">
              <Link
                href="/"
                className="flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <Label>{t("homeButtonText")}</Label>
              </Link>
            </Button>

            <Button
              variant="secondary"
              className="h-12"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              <Label>{t("reloadButtonText")}</Label>
            </Button>

            <Button
              variant="secondary"
              className="h-12 col-span-2"
              onClick={handleTakeScreenshot}
              disabled={screenshotStatus !== "idle"}
            >
              <Camera className="h-4 w-4 mr-2" />
              {screenshotStatus === "success"
                ? t("screenshotSuccessText")
                : screenshotStatus === "error"
                ? t("screenshotErrorText")
                : t("screenshotText")}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
