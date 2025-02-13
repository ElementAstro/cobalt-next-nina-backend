"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ConnectionHistoryItem {
  id: number;
  label: string;
  date: string;
  ipAddress: string;
  deviceStatus?: {
    telescopeConnected: boolean;
    cameraConnected: boolean;
    mountConnected: boolean;
  };
  connectionMode?: "telescope" | "camera" | "mount";
}

interface ListItemProps {
  item: ConnectionHistoryItem;
  onDelete: (id: number) => void;
}

const ConnectionHistory: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const { connectionHistory, removeConnectionHistory, clearConnectionHistory } =
    useConnectionStatusStore();

  const [searchTerm, setSearchTerm] = React.useState("");

  const historyItems = useMemo<ConnectionHistoryItem[]>(() => {
    return connectionHistory.map((entry: string, index: number) => ({
      id: index,
      label: entry,
      date: new Date().toLocaleString(),
      ipAddress: entry,
      deviceStatus: {
        telescopeConnected: false,
        cameraConnected: false,
        mountConnected: false,
      },
      connectionMode: "telescope",
    }));
  }, [connectionHistory]);

  const filteredHistory = useMemo(() => {
    return historyItems.filter(
      (entry) =>
        entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyItems, searchTerm]);

  const convertToCSV = (data: ConnectionHistoryItem[]) => {
    const headers = ["日期", "IP地址", "标签"];
    const rows = data.map((item) => [item.date, item.ipAddress, item.label]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportHistory = () => {
    try {
      const csv = convertToCSV(filteredHistory);
      downloadCSV(csv, "connection-history.csv");
      toast({
        title: "导出成功",
        description: "历史记录已成功导出为CSV文件",
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "导出失败",
        description: error.message || "导出历史记录时发生错误",
        variant: "destructive",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 bg-background border-t border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="搜索历史记录..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={exportHistory}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {filteredHistory.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onDelete={() => removeConnectionHistory(item.id)}
              />
            ))}
          </div>

          {connectionHistory.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                variant="destructive"
                onClick={clearConnectionHistory}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                清空所有历史
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ListItem: React.FC<ListItemProps> = React.memo(({ item, onDelete }) => (
  <div className="flex justify-between items-center p-2 hover:bg-accent rounded-md">
    <div className="flex flex-col flex-1">
      <span className="font-medium">{item.label}</span>
      <span className="text-sm text-muted-foreground">{item.date}</span>
      {item.deviceStatus && (
        <div className="flex gap-2 mt-1">
          <Badge
            variant={
              item.deviceStatus.telescopeConnected ? "default" : "secondary"
            }
            className="text-xs"
          >
            望远镜
          </Badge>
          <Badge
            variant={
              item.deviceStatus.cameraConnected ? "default" : "secondary"
            }
            className="text-xs"
          >
            相机
          </Badge>
          <Badge
            variant={item.deviceStatus.mountConnected ? "default" : "secondary"}
            className="text-xs"
          >
            赤道仪
          </Badge>
        </div>
      )}
    </div>
    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
));

ListItem.displayName = "ListItem";

export default React.memo(ConnectionHistory);
