"use client";

import React, { useEffect, useRef } from "react";
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Clock,
  Activity,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface NetworkConnection extends EventTarget {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface ConnectionStats {
  downlink?: number;
  uplink?: number;
  rtt?: number;
  effectiveType?: string;
  bytesReceived?: number;
  bytesSent?: number;
  lastUpdated?: Date;
}

interface NetworkStatusProps {
  status: {
    online: boolean;
    downlink?: number;
    uplink?: number;
    rtt?: number;
  };
}

export function NetworkStatus({ status }: NetworkStatusProps) {
  const statsRef = useRef<ConnectionStats>({});
  const { updateConnectionStats } = useConnectionStatusStore();

  useEffect(() => {
    if (!status.online) return;

    const connection = (navigator as { connection?: NetworkConnection }).connection;
    if (connection) {
      const handleChange = () => {
        const stats: ConnectionStats = {
          downlink:
            typeof connection.downlink === "number"
              ? connection.downlink
              : undefined,
          rtt: typeof connection.rtt === "number" ? connection.rtt : undefined,
          effectiveType: connection.effectiveType || undefined,
        };
        updateConnectionStats(stats);
      };

      connection.addEventListener("change", handleChange);
      return () => connection.removeEventListener("change", handleChange);
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const stats = calculateStats(entries);
      statsRef.current = stats;
      updateConnectionStats(stats);
    });

    observer.observe({ entryTypes: ["resource", "navigation"] });
    return () => observer.disconnect();
  }, [status.online, updateConnectionStats]);

  const getNetworkQuality = () => {
    if (!status.online) return { color: "text-red-500", label: "离线" };
    if (status.rtt && status.rtt > 1000) return { color: "text-red-500", label: "较差" };
    if (status.downlink && status.downlink < 1) return { color: "text-yellow-500", label: "一般" };
    return { color: "text-green-500", label: "良好" };
  };

  const getSignalStrength = () => {
    if (!status.online) return 0;
    if (!status.downlink) return 50;
    return Math.min(100, Math.round((status.downlink / 10) * 100));
  };

  const networkQuality = getNetworkQuality();
  const signalStrength = getSignalStrength();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-card p-4 space-y-4 border shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={false}
            animate={{
              scale: status.online ? [1, 1.2, 1] : 1,
              opacity: status.online ? 1 : 0.5,
            }}
            transition={{ duration: 0.5, repeat: status.online ? Infinity : 0, repeatDelay: 2 }}
            className={cn(
              "p-2 rounded-full",
              status.online ? "bg-green-500/10" : "bg-red-500/10"
            )}
          >
            {status.online ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </motion.div>
          <div>
            <Label className="text-sm font-medium">网络状态</Label>
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm font-medium", networkQuality.color)}>
                {networkQuality.label}
              </span>
              <Activity className={cn("w-4 h-4", networkQuality.color)} />
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: status.online ? 360 : 0 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-muted-foreground/50"
        >
          <RefreshCcw className="w-4 h-4" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">信号强度</span>
          <span className="font-medium">{signalStrength}%</span>
        </div>
        <div className="relative h-2">
          <Progress value={signalStrength} className="h-2" />
          <motion.div
            className="absolute top-0 left-0 w-full h-full opacity-50"
            animate={{
              background: [
                "linear-gradient(90deg, rgba(var(--primary-rgb), 0.2) 0%, rgba(var(--primary-rgb), 0) 100%)",
                "linear-gradient(90deg, rgba(var(--primary-rgb), 0) 0%, rgba(var(--primary-rgb), 0.2) 100%)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
      </div>

      {status.online && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-4 pt-2"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Download className="w-4 h-4" />
                <Label className="text-xs">下载</Label>
              </div>
              <span className="text-sm font-medium">
                {status.downlink?.toFixed(1) || "0"} Mbps
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Upload className="w-4 h-4" />
                <Label className="text-xs">上传</Label>
              </div>
              <span className="text-sm font-medium">
                {status.uplink?.toFixed(1) || "0"} Mbps
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <Label className="text-xs">延迟</Label>
              </div>
              <span className="text-sm font-medium">
                {status.rtt?.toFixed(0) || "0"} ms
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function calculateStats(entries: PerformanceEntry[]): ConnectionStats {
  const stats: ConnectionStats = {
    downlink: 0,
    uplink: 0,
    rtt: 0,
    bytesReceived: 0,
    bytesSent: 0,
    lastUpdated: new Date(),
  };

  entries.forEach((entry) => {
    if (entry instanceof PerformanceResourceTiming) {
      if (stats.bytesReceived !== undefined) {
        stats.bytesReceived += entry.transferSize || 0;
      }
      if (stats.rtt !== undefined) {
        stats.rtt = Math.max(stats.rtt, entry.duration);
      }
    }
  });

  return stats;
}

export default React.memo(NetworkStatus);
