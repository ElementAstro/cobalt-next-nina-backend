"use client";

import { FC } from "react";
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
import { useBadPixelStore } from "@/stores/guiding/badPixelStore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";

interface BadPixelVisualizationProps {
  data: {
    width: number;
    height: number;
    hotPixels: number[];
    coldPixels: number[];
  };
}

const COLORS = {
  hot: "#ff4444",
  cold: "#4444ff",
};

const BadPixelVisualization: FC<BadPixelVisualizationProps> = ({ data }) => {
  const { options } = useBadPixelStore();
  const [isDragging, setIsDragging] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // 添加响应式查询
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

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

  const heatmapData = useMemo(() => {
    const gridSize = 32;
    const grid = Array(gridSize)
      .fill(0)
      .map(() => Array(gridSize).fill(0));

    const cellWidth = data.width / gridSize;
    const cellHeight = data.height / gridSize;

    [...data.hotPixels, ...data.coldPixels].forEach((pixel) => {
      const x = pixel % data.width;
      const y = Math.floor(pixel / data.width);
      const gridX = Math.floor(x / cellWidth);
      const gridY = Math.floor(y / cellHeight);
      if (gridX < gridSize && gridY < gridSize) {
        grid[gridY][gridX]++;
      }
    });

    return grid.map((row, y) => ({
      name: `Row${y}`,
      ...row.reduce(
        (acc, value, x) => ({
          ...acc,
          [`col${x}`]: value,
        }),
        {}
      ),
    }));
  }, [data]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = transform.scale * (e.deltaY > 0 ? 0.9 : 1.1);
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(newScale, 0.1), 5),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + e.movementX,
      y: prev.y + e.movementY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  if (!data.width || !data.height) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden",
        isPortrait ? "h-[70vh]" : "h-full w-full"
      )}
      variants={variants}
      initial="hidden"
      animate="visible"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 优化工具栏布局 */}
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

      {/* 优化可视化内容容器 */}
      <motion.div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
        className="origin-center h-full"
      >
        {options.displayMode === "scatter" && (
          <div className={cn("w-full", isPortrait ? "h-[60vh]" : "h-full")}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={
                  isMobile
                    ? { top: 10, right: 10, bottom: 40, left: 40 }
                    : { top: 20, right: 20, bottom: 60, left: 60 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="X"
                  domain={[0, data.width]}
                  allowDecimals={false}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Y"
                  domain={[0, data.height]}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const { x, y, type } = payload[0].payload;
                    return (
                      <div
                        className={cn(
                          "bg-background/95 p-2 rounded-lg shadow border",
                          isMobile && "text-sm"
                        )}
                      >
                        <p>
                          位置: ({x}, {y})
                        </p>
                        <p>类型: {type === "hot" ? "热点" : "冷点"}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Scatter name="坏点分布" data={scatterData} fill="#8884d8">
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

        {options.displayMode === "heatmap" && (
          <div
            className={cn(
              "grid gap-px bg-gray-800",
              isPortrait
                ? "grid-cols-[repeat(16,1fr)] h-[60vh]"
                : "grid-cols-[repeat(32,1fr)] h-full w-full"
            )}
          >
            {heatmapData.flatMap((row, y) =>
              (Object.values(row) as number[]).map((value, x) => {
                if (typeof value === "number") {
                  const intensity = Math.min(value / 10, 1); // 归一化强度
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square"
                      style={{
                        backgroundColor: `rgba(255, 68, 68, ${intensity})`,
                      }}
                      title={`Count: ${value}`}
                    />
                  );
                }
                return null;
              })
            )}
          </div>
        )}

        {options.displayMode === "grid" && (
          <div
            className={cn(
              "overflow-auto bg-gray-800",
              isPortrait
                ? "h-[60vh] grid grid-cols-[repeat(auto-fill,minmax(1px,1fr))]"
                : "h-full w-full grid grid-cols-[repeat(auto-fill,minmax(2px,1fr))]",
              "gap-px"
            )}
          >
            {Array.from({ length: data.width * data.height }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square ${
                  data.hotPixels.includes(i)
                    ? "bg-red-500"
                    : data.coldPixels.includes(i)
                    ? "bg-green-500"
                    : "bg-gray-900"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* 优化缩略图导航器 */}
      {!isMobile && (
        <div
          className={cn(
            "absolute w-32 h-32 border border-gray-600 bg-gray-900/50",
            isPortrait ? "bottom-20 right-4" : "bottom-4 right-4"
          )}
        >
          {/* 添加缩略图实现 */}
        </div>
      )}
    </motion.div>
  );
};

export default BadPixelVisualization;
