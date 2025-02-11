"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBadPixelStore } from "@/stores/guiding/badPixelStore";
import {
  Settings,
  LayoutGrid,
  LineChart,
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

import SettingsPanel from "@/components/guiding/badpixel/settings-panel";
import ActionButtons from "@/components/guiding/badpixel/action-buttons";
import BadPixelVisualization from "@/components/guiding/badpixel/badpixel-visualization";

// 定义操作历史记录的类型
interface HistoryRecord {
  hotPixels: number[];
  coldPixels: number[];
  timestamp: string;
}

interface SaveState {
  loading: boolean;
  lastSaved?: Date;
  error?: string;
}

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
  const [visualMode, setVisualMode] = useState<"table" | "graph">("table");

  // 使用更具体的类型定义
  const [undoStack, setUndoStack] = useState<HistoryRecord[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        generateBadPixels();
      }, options.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, generateBadPixels]);

  // 实现撤销功能
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack([
        ...redoStack,
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
      setUndoStack(undoStack.slice(0, -1));
    }
  };

  // 实现重做功能
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack([
        ...undoStack,
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
      setRedoStack(redoStack.slice(0, -1));
    }
  };

  const handleSave = async () => {
    try {
      setSaveState({ loading: true });

      // 调用保存 API
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
    <div className="h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="h-full p-1 md:p-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 h-full">
          {/* 左侧面板 - 使用更精确的网格比例 */}
          <Card className="md:col-span-3 bg-gray-800/50 backdrop-blur border-gray-700">
            <CardContent className="h-full p-0">
              <div className="flex flex-col h-full">
                {/* 标题区域 - 减小内边距 */}
                <div className="p-2 md:p-3 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                      坏点管理
                    </h2>
                  </div>
                </div>

                {/* 操作按钮区域 - 紧凑布局 */}
                <div className="p-2 md:p-3 border-b border-gray-700">
                  <ActionButtons
                    resetCorrectionLevels={resetCorrectionLevels}
                    generateBadPixels={generateBadPixels}
                    handleManualAddPixel={addBadPixel}
                    manualPixel={manualPixel}
                    setManualPixel={setManualPixel}
                  />
                </div>

                {/* 设置和工具栏 - 更紧凑的间距 */}
                <div className="p-2 md:p-3 border-b border-gray-700">
                  <div className="flex gap-1.5 flex-wrap">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8"
                        >
                          <Settings className="w-4 h-4 mr-1.5" />
                          显示设置
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-80">
                        <SheetHeader>
                          <SheetTitle>设置</SheetTitle>
                          <SheetDescription>
                            配置坏点检测和显示参数
                          </SheetDescription>
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
                        className="flex-1 h-8"
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        className="flex-1 h-8"
                      >
                        <Redo className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetCorrectionLevels()}
                        className="flex-1 h-8"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={saveState.loading}
                        className="flex-1 h-8"
                      >
                        {saveState.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saveState.loading ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 滚动区域 - 自适应高度 */}
                <ScrollArea className="flex-1">
                  <div className="p-2 md:p-3 space-y-2">{/* 滚动内容 */}</div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* 右侧可视化区域 - 优化空间利用 */}
          <Card className="md:col-span-9 bg-gray-800/50 backdrop-blur border-gray-700">
            <CardContent className="h-full p-2 md:p-3">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setVisualMode((v) =>
                          v === "table" ? "graph" : "table"
                        )
                      }
                      className="h-8"
                    >
                      {visualMode === "table" ? (
                        <LayoutGrid className="w-4 h-4 mr-1.5" />
                      ) : (
                        <LineChart className="w-4 h-4 mr-1.5" />
                      )}
                      {visualMode === "table" ? "图表模式" : "表格模式"}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-900/50 rounded-lg overflow-hidden">
                  <BadPixelVisualization data={data} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
