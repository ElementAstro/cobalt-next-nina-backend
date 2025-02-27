// components/widgets/OsWidget.jsx
"use client";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Monitor, Timer, Clock, Network } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";

export default function OsWidget() {
  const { systemInfo } = useSystemStore();

  // 格式化运行时间
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);

    return parts.join(" ");
  };

  // 获取格式化的当前时间
  const getCurrentTime = (): string => {
    const now = new Date();
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  };

  return (
    <AnimatedCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <span>操作系统</span>
        </CardTitle>
        <CardDescription>系统信息与运行状态</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">操作系统</span>
              </div>
              <div className="font-medium">
                {systemInfo.os.type}
                <span className="text-sm ml-1 text-muted-foreground">
                  ({systemInfo.os.platform})
                </span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-3 rounded-md bg-muted/50"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Network className="h-4 w-4" />
                <span className="text-sm">主机名</span>
              </div>
              <div className="font-medium overflow-hidden text-ellipsis">
                {systemInfo.os.hostname}
              </div>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-3 rounded-md bg-muted/50"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-sm">系统运行时间</span>
            </div>
            <div className="font-medium">
              {formatUptime(systemInfo.os.uptime)}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-3 rounded-md bg-muted/50"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">当前时间</span>
            </div>
            <div className="font-medium">{getCurrentTime()}</div>
          </motion.div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
