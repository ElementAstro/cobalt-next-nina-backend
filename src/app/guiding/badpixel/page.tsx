"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBadPixelStore } from "@/stores/guiding/badPixelStore";
import {
  Settings,
  TableIcon,
  LayoutGrid,
  BarChart3,
  AlertTriangle,
  Undo,
  Redo,
  RotateCcw,
  Save,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";

import SettingsPanel from "@/components/guiding/badpixel/settings-panel";
import ActionButtons from "@/components/guiding/badpixel/action-buttons";
import BadPixelVisualization from "@/components/guiding/badpixel/badpixel-visualization";
import PixelInfo from "@/components/guiding/badpixel/pixel-info";

import { HistoryRecord, SaveState, VisualMode } from "@/types/guiding/badpixel";

export default function BadPixelInterface() {
  const {
    data,
    options,
    setData,
    resetCorrectionLevels,
    generateBadPixels,
    addBadPixel,
  } = useBadPixelStore();

  const [saveState, setSaveState] = useState<SaveState>({
    loading: false,
  });

  const [manualPixel, setManualPixel] = useState("");
  const [visualMode, setVisualMode] = useState<VisualMode>("grid");
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [undoStack, setUndoStack] = useState<HistoryRecord[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryRecord[]>([]);

  // 响应式查询
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        generateBadPixels();
      }, options.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, generateBadPixels]);

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack((prev) => [
        ...prev,
        {
          hotPixels: data.hotPixels,
          coldPixels: data.coldPixels,
          timestamp: new Date().toISOString(),
        },
      ]);
      setData({
        ...data,
        hotPixels: previousState.hotPixels,
        coldPixels: previousState.coldPixels,
      });
      setUndoStack((prev) => prev.slice(0, -1));
    }
  }, [data, setData, undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack((prev) => [
        ...prev,
        {
          hotPixels: data.hotPixels,
          coldPixels: data.coldPixels,
          timestamp: new Date().toISOString(),
        },
      ]);
      setData({
        ...data,
        hotPixels: nextState.hotPixels,
        coldPixels: nextState.coldPixels,
      });
      setRedoStack((prev) => prev.slice(0, -1));
    }
  }, [data, setData, redoStack]);

  const handleGenerateBadPixels = async () => {
    try {
      setIsGenerating(true);
      await generateBadPixels();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveState({ loading: true });

      const response = await fetch("/api/badpixels/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotPixels: data.hotPixels,
          coldPixels: data.coldPixels,
          timestamp: new Date().toISOString(),
          options: options,
        }),
      });

      if (!response.ok) {
        throw new Error(`保存失败: ${response.statusText}`);
      }

      await response.json();

      setSaveState({
        loading: false,
        lastSaved: new Date(),
      });

      toast({
        title: "保存成功",
        description: "坏点数据已成功保存",
        action: <ToastAction altText="重新加载">重新加载</ToastAction>,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";

      setSaveState({
        loading: false,
        error: errorMessage,
      });

      toast({
        variant: "destructive",
        title: "保存失败",
        description: errorMessage,
        action: (
          <ToastAction altText="重试" onClick={handleSave}>
            重试
          </ToastAction>
        ),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
    >
      <div className="h-full p-1 md:p-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 h-full">
          {/* 左侧控制面板 */}
          <Card className="md:col-span-3 bg-gray-800/50 backdrop-blur border-gray-700">
            <div className="flex flex-col h-full">
              {/* 标题区域 */}
              <div className="p-2 md:p-3 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                    坏点管理
                  </h2>
                </div>
              </div>

              {/* 操作按钮区域 */}
              <div className="p-2 md:p-3 border-b border-gray-700">
                <ActionButtons
                  resetCorrectionLevels={resetCorrectionLevels}
                  generateBadPixels={handleGenerateBadPixels}
                  handleManualAddPixel={addBadPixel}
                  manualPixel={manualPixel}
                  setManualPixel={setManualPixel}
                  isGenerating={isGenerating}
                />
              </div>

              {/* 工具栏 */}
              <div className="p-2 md:p-3 border-b border-gray-700">
                <div className="flex gap-1.5 flex-wrap">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 bg-gray-800/50 hover:bg-gray-700/50"
                      >
                        <Settings className="w-4 h-4 mr-1.5" />
                        显示设置
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side={isMobile ? "bottom" : "right"}
                      className="bg-gray-900/95 border-gray-800"
                    >
                      <SheetHeader>
                        <SheetTitle>设置</SheetTitle>
                        <SheetDescription>配置坏点检测和显示参数</SheetDescription>
                      </SheetHeader>
                      <SettingsPanel />
                    </SheetContent>
                  </Sheet>
                  <div className="flex gap-1 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className="flex-1 h-8 bg-gray-800/50 hover:bg-gray-700/50"
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="flex-1 h-8 bg-gray-800/50 hover:bg-gray-700/50"
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetCorrectionLevels}
                      className="flex-1 h-8 bg-gray-800/50 hover:bg-gray-700/50"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      disabled={saveState.loading}
                      className="flex-1 h-8 bg-gray-800/50 hover:bg-gray-700/50"
                    >
                      {saveState.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 滚动区域 */}
              <ScrollArea className="flex-1 px-2 md:px-3">
                <PixelInfo
                  data={data}
                  visualMode={visualMode}
                  isLandscape={isLandscape}
                  expanded={expanded}
                  onToggleExpand={() => setExpanded(!expanded)}
                  onManualAddPixel={addBadPixel}
                  manualPixel={manualPixel}
                  setManualPixel={setManualPixel}
                />
              </ScrollArea>
            </div>
          </Card>

          {/* 右侧可视化区域 */}
          <Card className="md:col-span-9 bg-gray-800/50 backdrop-blur border-gray-700">
            <div className="h-full p-2 md:p-3">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisualMode("grid")}
                      className={cn(
                        "h-8 bg-gray-800/50 hover:bg-gray-700/50",
                        visualMode === "grid" && "bg-gray-700/50"
                      )}
                    >
                      <LayoutGrid className="w-4 h-4 mr-1.5" />
                      网格
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisualMode("graph")}
                      className={cn(
                        "h-8 bg-gray-800/50 hover:bg-gray-700/50",
                        visualMode === "graph" && "bg-gray-700/50"
                      )}
                    >
                      <BarChart3 className="w-4 h-4 mr-1.5" />
                      图表
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisualMode("table")}
                      className={cn(
                        "h-8 bg-gray-800/50 hover:bg-gray-700/50",
                        visualMode === "table" && "bg-gray-700/50"
                      )}
                    >
                      <TableIcon className="w-4 h-4 mr-1.5" />
                      表格
                    </Button>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={visualMode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 bg-gray-900/50 rounded-lg overflow-hidden"
                  >
                    <BadPixelVisualization data={data} visualMode={visualMode} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
