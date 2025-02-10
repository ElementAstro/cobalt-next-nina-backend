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

import SettingsPanel from "@/components/guiding/badpixel/settings-panel";
import ActionButtons from "@/components/guiding/badpixel/action-buttons";
import BadPixelVisualization from "@/components/guiding/badpixel/badpixel-visualization";

// 定义操作历史记录的类型
interface HistoryRecord {
  hotPixels: number[];
  coldPixels: number[];
  timestamp: string;
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

  // 保存功能（目前未使用，可根据需要启用）
  //  const handleSave = async () => {
  //    try {
  //      // 这里添加保存逻辑
  //      toast({
  //        title: "保存成功",
  //        description: "坏点数据已成功保存",
  //      });
  //    } catch (error) {
  //      toast({
  //        title: "保存失败",
  //        description: error instanceof Error ? error.message : "未知错误",
  //        variant: "destructive",
  //      });
  //    }
  //  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[calc(100vh-1rem)]">
          {/* 左侧面板 */}
          <Card className="md:col-span-1 bg-gray-800/50 backdrop-blur border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  坏点管理
                </h2>
                <ActionButtons
                  resetCorrectionLevels={resetCorrectionLevels}
                  generateBadPixels={generateBadPixels}
                  handleManualAddPixel={addBadPixel}
                  manualPixel={manualPixel}
                  setManualPixel={setManualPixel}
                />
              </div>
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="space-y-4">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        显示设置
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>设置</SheetTitle>
                        <SheetDescription>
                          配置坏点检测和显示参数
                        </SheetDescription>
                      </SheetHeader>
                      <SettingsPanel />
                    </SheetContent>
                  </Sheet>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetCorrectionLevels()}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 中间可视化区域 */}
          <Card className="md:col-span-2 bg-gray-800/50 backdrop-blur border-gray-700">
            <CardContent className="p-4 h-full">
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setVisualMode((v) =>
                          v === "table" ? "graph" : "table"
                        )
                      }
                    >
                      {visualMode === "table" ? (
                        <LayoutGrid className="w-4 h-4 mr-2" />
                      ) : (
                        <LineChart className="w-4 h-4 mr-2" />
                      )}
                      {visualMode === "table" ? "图表模式" : "表格模式"}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-900/50 rounded-lg">
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
