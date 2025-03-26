"use client";

import { motion } from "framer-motion";
import {
  Settings,
  Wifi,
  HardDrive,
  Cpu,
  Palette,
  Activity,
  LocateIcon,
  Server,
  AlertTriangle,
} from "lucide-react";
import { useClientInfo } from "./use-client-info";
import { InfoCard } from "./info-card";
import { Button } from "@/components/ui/button";

export function ClientInfo() {
  // 修复：从useClientInfo钩子获取返回值
  const { clientInfo, isLoading, error } = useClientInfo();

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-md px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="w-full space-y-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="h-4 rounded-full bg-gradient-to-r from-primary/10 to-primary/5"
                initial={{ opacity: 0.6, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.5,
                  repeatType: "reverse",
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            ))}
          </div>
          <motion.span
            className="text-sm font-medium text-primary/80 mt-2"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            正在获取客户端信息...
          </motion.span>
        </motion.div>
      </div>
    );
  }

  if (error || !clientInfo) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <motion.div
          className="flex flex-col items-center gap-4 text-center max-w-md p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-medium text-destructive">加载失败</h3>
          <p className="text-sm text-muted-foreground">{error || "未知错误"}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            重试
          </Button>
        </motion.div>
      </div>
    );
  }

  // 以下代码现在可以安全访问 clientInfo 属性，因为我们已经检查了它是否存在
  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-background/95 to-background">
      <motion.div
        className="flex-none px-6 py-4 border-b border-border/50 backdrop-blur-sm sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            客户端信息
          </motion.h1>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <motion.div
            className="grid gap-4 sm:gap-5 md:gap-6 lg:gap-7"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  when: "beforeChildren",
                },
              },
            }}
          >
            <InfoCard
              title="系统"
              icon={Settings}
              items={[
                { label: "浏览器", value: clientInfo.browser },
                { label: "操作系统", value: clientInfo.os },
                { label: "设备类型", value: clientInfo.device },
                { label: "屏幕分辨率", value: clientInfo.screen },
                { label: "语言", value: clientInfo.language },
                { label: "时区", value: clientInfo.timezone },
              ]}
            />

            <InfoCard
              title="网络"
              icon={Wifi}
              items={[
                { label: "在线状态", value: clientInfo.online ? "是" : "否" },
                {
                  label: "启用 Cookie",
                  value: clientInfo.cookiesEnabled ? "是" : "否",
                },
                {
                  label: "请勿追踪",
                  value:
                    clientInfo.doNotTrack === null
                      ? "未设置"
                      : clientInfo.doNotTrack
                      ? "启用"
                      : "禁用",
                },
                ...(clientInfo.connection
                  ? [
                      {
                        label: "连接类型",
                        value: clientInfo.connection.effectiveType,
                      },
                      {
                        label: "下行带宽",
                        value: `${clientInfo.connection.downlink} Mbps`,
                      },
                      {
                        label: "往返时间",
                        value: `${clientInfo.connection.rtt} ms`,
                      },
                    ]
                  : []),
              ]}
            />

            <InfoCard
              title="性能"
              icon={Activity}
              items={[
                {
                  label: "内存使用",
                  value: clientInfo.performance.memory || "不可用",
                },
                {
                  label: "页面加载时间",
                  value: clientInfo.performance.loadTime,
                },
              ]}
            />

            {clientInfo.geolocation && (
              <InfoCard
                title="地理位置"
                icon={LocateIcon}
                items={[
                  {
                    label: "纬度",
                    value: clientInfo.geolocation.latitude.toFixed(6),
                  },
                  {
                    label: "经度",
                    value: clientInfo.geolocation.longitude.toFixed(6),
                  },
                ]}
              />
            )}

            <InfoCard
              title="图形"
              icon={Server}
              items={[
                { label: "WebGL 渲染器", value: clientInfo.webGL.renderer },
                { label: "WebGL 厂商", value: clientInfo.webGL.vendor },
              ]}
            />

            <InfoCard
              title="存储"
              icon={HardDrive}
              items={[
                {
                  label: "本地存储项数",
                  value: clientInfo.storage.localStorageSize,
                },
                {
                  label: "会话存储项数",
                  value: clientInfo.storage.sessionStorageSize,
                },
              ]}
            />

            <InfoCard
              title="硬件"
              icon={Cpu}
              items={[
                { label: "CPU 核心数", value: clientInfo.cpu.cores },
                {
                  label: "音频输入设备",
                  value: clientInfo.mediaDevices.audioinput,
                },
                {
                  label: "音频输出设备",
                  value: clientInfo.mediaDevices.audiooutput,
                },
              ]}
            />

            {clientInfo.fonts && (
              <InfoCard
                title="字体"
                icon={Palette}
                items={[
                  { label: "已安装字体数", value: clientInfo.fonts.length },
                  ...clientInfo.fonts.map((font: string, index: number) => ({
                    label: `字体 ${index + 1}`,
                    value: font,
                  })),
                ]}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
