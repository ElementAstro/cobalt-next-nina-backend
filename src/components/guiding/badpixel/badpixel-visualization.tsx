"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import debounce from "lodash/debounce";

// 防抖时间配置
const DEBOUNCE_DELAY = 16; // ~1 frame @ 60fps
import { BadPixelData, VisualMode } from "@/types/guiding/badpixel";

const COLORS = {
  hot: "#ff4444",
  cold: "#4444ff",
};

interface BadPixelVisualizationProps {
  data: BadPixelData;
  visualMode: VisualMode;
}

const BadPixelVisualization = memo(({ data, visualMode }: BadPixelVisualizationProps) => {
  const [isDragging, setIsDragging] = useState(false);
  interface TouchPoint {
    x: number;
    y: number;
  }
  
  interface Transform {
    x: number;
    y: number;
    scale: number;
    lastTouch: TouchPoint | null;
  }

  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
    lastTouch: null
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);

  // 创建防抖的transform更新函数
  const debouncedSetTransform = useCallback(
    debounce((newTransform: typeof transform) => {
      setTransform(newTransform);
    }, DEBOUNCE_DELAY),
    []
  );

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSetTransform.cancel();
    };
  }, [debouncedSetTransform]);
  
  // 响应式查询
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });
  
  // 性能优化：监听响应式变化
  useEffect(() => {
    if (containerRef.current) {
      // 在响应式布局变化时重置变换状态
      setTransform({ x: 0, y: 0, scale: 1, lastTouch: null });
    }
  }, [isMobile, isPortrait]);

  // 性能优化：使用 useEffect 更新 ref
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const currentTransform = transformRef.current;
    const newScale = currentTransform.scale * delta;
    
    // 计算缩放中心点
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 限制缩放范围并计算新的变换
    const scale = Math.min(Math.max(newScale, 0.5), 3);
    const x = mouseX - (mouseX - currentTransform.x) * (scale / currentTransform.scale);
    const y = mouseY - (mouseY - currentTransform.y) * (scale / currentTransform.scale);
    
    const newTransform: Transform = {
      x,
      y,
      scale,
      lastTouch: transformRef.current.lastTouch
    };
    transformRef.current = newTransform;
    debouncedSetTransform(newTransform);
  }, [debouncedSetTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const { clientWidth, clientHeight } = containerRef.current;
    const currentTransform = transformRef.current;
    
    // 计算最大允许偏移量
    const maxOffsetX = Math.max(0, clientWidth * (currentTransform.scale - 1) / 2);
    const maxOffsetY = Math.max(0, clientHeight * (currentTransform.scale - 1) / 2);
    
    // 计算新位置，确保在边界内
    const newX = currentTransform.x + e.movementX;
    const newY = currentTransform.y + e.movementY;
    
    const x = maxOffsetX > 0
      ? Math.min(Math.max(newX, -maxOffsetX), maxOffsetX)
      : 0;
    const y = maxOffsetY > 0
      ? Math.min(Math.max(newY, -maxOffsetY), maxOffsetY)
      : 0;
    
    const newTransform = { ...currentTransform, x, y };
    transformRef.current = newTransform; // 立即更新ref
    debouncedSetTransform(newTransform); // 防抖更新state
  }, [isDragging, debouncedSetTransform]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const step = 20;
    const { clientWidth, clientHeight } = containerRef.current;
    const maxX = clientWidth * (transform.scale - 1) / 2;
    const maxY = clientHeight * (transform.scale - 1) / 2;
    
    setTransform((prev) => {
      let x = prev.x;
      let y = prev.y;
      
      switch(e.key) {
        case 'ArrowLeft': x = Math.max(prev.x - step, -maxX); break;
        case 'ArrowRight': x = Math.min(prev.x + step, maxX); break;
        case 'ArrowUp': y = Math.max(prev.y - step, -maxY); break;
        case 'ArrowDown': y = Math.min(prev.y + step, maxY); break;
        case '+':
        case '=':
          return { ...prev, scale: Math.min(prev.scale * 1.1, 3), lastTouch: prev.lastTouch };
        case '-':
          return { ...prev, scale: Math.max(prev.scale * 0.9, 0.5), lastTouch: prev.lastTouch };
        case '0':
          return { x: 0, y: 0, scale: 1, lastTouch: null };
        default: return prev;
      }
      
      return { ...prev, x, y, lastTouch: prev.lastTouch };
    });
  }, [transform.scale]);

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
      <div
        className="w-full h-[400px] flex items-center justify-center"
        role="alert"
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-4"
        role="status"
        aria-label="加载中"
        aria-busy="true"
      >
        {/* 骨架屏加载动画 */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* 主加载指示器 */}
          <motion.div
            className="relative w-16 h-16"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* 进度文本 */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-gray-400">正在加载坏点数据</p>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: ["0%", "30%", "70%", "90%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </div>
          </motion.div>

          {/* 骨架屏网格预览 */}
          <motion.div
            className="grid grid-cols-5 gap-2 w-full mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.4 }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="aspect-square bg-gray-700 rounded"
                animate={{
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity
                }}
              />
            ))}
          </motion.div>
        </motion.div>
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
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          const touch = e.touches[0];
          setIsDragging(true);
          transformRef.current = {
            ...transformRef.current,
            lastTouch: { x: touch.clientX, y: touch.clientY }
          };
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 1 && isDragging) {
          e.preventDefault();
          const touch = e.touches[0];
          const lastTouch = transformRef.current.lastTouch;
          if (lastTouch) {
            const movementX = touch.clientX - lastTouch.x;
            const movementY = touch.clientY - lastTouch.y;
            handleMouseMove({
              movementX,
              movementY,
              preventDefault: () => {}
            } as unknown as React.MouseEvent);
            transformRef.current.lastTouch = { x: touch.clientX, y: touch.clientY };
          }
        }
      }}
      onTouchEnd={() => {
        setIsDragging(false);
        if (transformRef.current.lastTouch) {
          transformRef.current = {
            ...transformRef.current,
            lastTouch: null
          };
        }
      }}
      style={{
        willChange: isDragging ? 'transform' : 'auto',
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
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
          onClick={() => setTransform({ x: 0, y: 0, scale: 1, lastTouch: null })}
          className="hover:bg-accent"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "icon" : "sm"}
          onClick={() =>
            setTransform((prev) => ({ ...prev, scale: prev.scale * 1.2, lastTouch: prev.lastTouch }))
          }
          className="hover:bg-accent"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size={isMobile ? "icon" : "sm"}
          onClick={() =>
            setTransform((prev) => ({ ...prev, scale: prev.scale * 0.8, lastTouch: prev.lastTouch }))
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
});

BadPixelVisualization.displayName = "BadPixelVisualization";
const arePropsEqual = (prevProps: BadPixelVisualizationProps, nextProps: BadPixelVisualizationProps) => {
  return (
    prevProps.visualMode === nextProps.visualMode &&
    prevProps.data.width === nextProps.data.width &&
    prevProps.data.height === nextProps.data.height &&
    prevProps.data.hotPixels.length === nextProps.data.hotPixels.length &&
    prevProps.data.coldPixels.length === nextProps.data.coldPixels.length
  );
};

export default memo(BadPixelVisualization, arePropsEqual);
