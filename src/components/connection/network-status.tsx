"use client";

import React, { useEffect, useRef } from "react";
import { Wifi, WifiOff, Download, Upload, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { cn } from "@/lib/utils";

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

    const connection = (navigator as { connection?: NetworkConnection })
      .connection;
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-4 p-2 rounded-lg bg-secondary"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {status.online ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <Label
            className={cn(
              "text-sm",
              status.online ? "text-green-500" : "text-red-500"
            )}
          >
            {status.online ? "网络正常" : "网络异常"}
          </Label>
        </div>
        {status.online && (
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <Label className="text-sm">
                速度: {status.downlink?.toFixed(1) || "0"} Mbps
              </Label>
            </div>
            <div className="flex items-center gap-1">
              <Upload className="w-4 h-4" />
              <Label className="text-sm">
                上传: {status.uplink?.toFixed(1) || "0"} Mbps
              </Label>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <Label className="text-sm">
                延迟: {status.rtt?.toFixed(0) || "0"} ms
              </Label>
            </div>
          </div>
        )}
      </div>
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
