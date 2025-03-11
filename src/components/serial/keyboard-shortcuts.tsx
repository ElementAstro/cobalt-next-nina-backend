"use client";

import { useEffect } from "react";
import { useSerialStore } from "@/stores/serial";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export function KeyboardShortcuts() {
  const {
    setIsMonitoring,
    isMonitoring,
    clearTerminalData,
    toggleVisualization,
    showVisualization,
  } = useSerialStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+M to toggle monitoring
      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        setIsMonitoring(!isMonitoring);
      }

      // Ctrl+L to clear terminal
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        clearTerminalData();
      }

      // Ctrl+V to toggle visualization
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        toggleVisualization();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isMonitoring,
    setIsMonitoring,
    clearTerminalData,
    toggleVisualization,
    showVisualization,
  ]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a1929] text-white border-gray-700 dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
          <DialogDescription className="text-gray-400">
            提高你的工作效率
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">开始/停止监视</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">
              Ctrl + M
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">清除终端</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">
              Ctrl + L
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">显示/隐藏可视化</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">
              Ctrl + V
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">上一条命令</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">↑</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">下一条命令</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">↓</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">发送命令</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded-md text-sm">
              Enter
            </kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
