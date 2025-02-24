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
} from "lucide-react";
import { useClientInfo } from "./use-client-info";
import { InfoCard } from "./info-card";

export function ClientInfo() {
  const clientInfo = useClientInfo();

  if (!clientInfo) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <motion.div
          className="flex flex-col items-center gap-3"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/50" />
          <span className="text-sm font-medium text-primary">加载中...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-background to-background/95">
      <motion.div
        className="flex-none px-6 py-4 border-b backdrop-blur-sm sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
            客户端信息
          </h1>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            className="grid gap-4 md:gap-6 lg:gap-8"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            }}
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
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

            {/* 其他卡片组件... */}
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
                  ...clientInfo.fonts.map((font, index) => ({
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
