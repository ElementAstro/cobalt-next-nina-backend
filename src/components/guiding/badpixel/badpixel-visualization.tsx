"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { BadPixelData, VisualMode } from "@/types/guiding/badpixel";

const COLORS = {
  hot: "#ff4444",
  cold: "#4444ff",
};

interface BadPixelVisualizationProps {
  data: BadPixelData;
  visualMode: VisualMode;
}

const BadPixelVisualization = ({ data, visualMode }: BadPixelVisualizationProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 响应式查询
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  // 计算散点图数据
  const scatterData = useMemo(() => {
    const hot = data.hotPixels.map((pixel) => ({
      x: pixel % data.width,
      y: Math.floor(pixel / data.width),
      type: "hot",
    }));

    const cold = data.coldPixels.map((pixel) => ({
      x: pixel % data.width,
      y: Math.floor(pixel / data.width),
      type: "cold",
    }));

    return [...hot, ...cold];
  }, [data]);

  // 初始化加载效果
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // 手势控制
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = transform.scale * (e.deltaY > 0 ? 0.9 : 1.1);
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(newScale, 0.1), 5),
    }));
  }, [transform.scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + e.movementX,
      y: prev.y + e.movementY,
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 计算缩略图视口位置
  const getViewportStyle = useCallback(() => {
    if (!containerRef.current) return {};
    
    const container = containerRef.current;
    const viewportLeft = (-transform.x / container.clientWidth) * 100;
    const viewportTop = (-transform.y / container.clientHeight) * 100;
    
    return {
      left: `${viewportLeft}%`,
      top: `${viewportTop}%`,
      width: `${100 / transform.scale}%`,
      height: `${100 / transform.scale}%`,
      transform: "translate(-50%, -50%)",
    };
  }, [transform]);

  // 渲染前的检查
  if (!data.width || !data.height) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-700" />
          <div className="h-2 w-24 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        isPortrait ? "h-[70vh]" : "h-full w-full"
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 工具栏 */}
      <div
        className={cn(
          "absolute z-10 flex gap-2 backdrop-blur-sm bg-background/80 rounded-lg p-1",
          isPortrait ? "bottom-4 left-1/2 -translate-x-1/2" : "top-4 right-4"
        )}
      >
        <Button
          variant="ghost"
          size={isMobile ? "icon" : "sm"}
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="hover:bg-accent"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "icon" : "sm"}
          onClick={() =>
            setTransform((prev) => ({ ...prev, scale: prev.scale * 1.2 }))
          }
          className="hover:bg-accent"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "icon" : "sm"}
          onClick={() =>
            setTransform((prev) => ({ ...prev, scale: prev.scale * 0.8 }))
          }
          className="hover:bg-accent"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* 可视化内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={visualMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
          className="origin-center h-full"
        >
          {visualMode === "graph" && (
            <div className={cn("w-full", isPortrait ? "h-[60vh]" : "h-full")}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={
                    isMobile
                      ? { top: 10, right: 10, bottom: 40, left: 40 }
                      : { top: 20, right: 20, bottom: 60, left: 60 }
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="X"
                    domain={[0, data.width]}
                    allowDecimals={false}
                    stroke="#666"
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Y"
                    domain={[0, data.height]}
                    allowDecimals={false}
                    stroke="#666"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const { x, y, type } = payload[0].payload;
                      return (
                        <div className={cn(
                          "bg-gray-900/95 p-2 rounded-lg shadow border border-gray-700",
                          isMobile && "text-sm"
                        )}>
                          <p>位置: ({x}, {y})</p>
                          <p>类型: {type === "hot" ? "热点" : "冷点"}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Scatter
                    name="坏点分布"
                    data={scatterData}
                    fill="#8884d8"
                  >
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === "hot" ? COLORS.hot : COLORS.cold}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {visualMode === "grid" && (
            <div
              className={cn(
                "grid bg-gray-800/50",
                isPortrait
                  ? "grid-cols-[repeat(16,1fr)] h-[60vh]"
                  : "grid-cols-[repeat(32,1fr)] h-full w-full",
                "gap-px"
              )}
            >
              {Array.from({ length: data.width * data.height }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i % 100 * 0.001 }}
                  className={cn(
                    "aspect-square",
                    data.hotPixels.includes(i)
                      ? "bg-red-500"
                      : data.coldPixels.includes(i)
                      ? "bg-blue-500"
                      : "bg-gray-900/50"
                  )}
                />
              ))}
            </div>
          )}

          {visualMode === "table" && (
            <div className="w-full h-full p-4 overflow-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">
                      位置
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">
                      类型
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">
                      坐标
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...data.hotPixels, ...data.coldPixels]
                    .slice(0, 100)
                    .map((pixel, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">#{index + 1}</td>
                        <td className="px-4 py-2 text-sm">
                          {data.hotPixels.includes(pixel) ? "热点" : "冷点"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          ({pixel % data.width}, {Math.floor(pixel / data.width)})
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 缩略图导航器 */}
      {!isMobile && (
        <div
          className={cn(
            "absolute w-32 h-32 border border-gray-600 bg-gray-900/50 rounded",
            isPortrait ? "bottom-20 right-4" : "bottom-4 right-4"
          )}
        >
          <div className="relative w-full h-full">
            <div
              className="absolute border-2 border-blue-500"
              style={getViewportStyle()}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BadPixelVisualization;
