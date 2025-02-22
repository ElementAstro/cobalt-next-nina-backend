import { useState, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Brush,
  ReferenceArea,
  TooltipProps,
} from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface RiseSetChartProps {
  riseTime: string;
  setTime: string;
  transitTime: string;
  transitAltitude: number;
  chartHeight?: number;
  lineColor?: string;
  gridColor?: string;
  axisColor?: string;
  backgroundColor?: string;
  showReferenceLines?: boolean;
  enableZoom?: boolean;
  animationDuration?: number;
}

interface DataPoint {
  time: string;
  altitude: number;
  phase: "rising" | "transit" | "setting";
}

type CustomTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{
    payload: DataPoint;
    value: number;
  }>;
};

export function RiseSetChart({
  riseTime,
  setTime,
  transitTime,
  transitAltitude,
  chartHeight = 300,
  lineColor = "hsl(var(--primary))",
  gridColor = "hsl(var(--border))",
  axisColor = "hsl(var(--muted-foreground))",
  backgroundColor = "hsl(var(--background))",
  showReferenceLines = true,
  enableZoom = false,
  animationDuration = 0.5,
}: RiseSetChartProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  // 生成平滑的数据点
  const generateDataPoints = useCallback((): DataPoint[] => {
    const points: DataPoint[] = [];
    const dataPointCount = 48; // 每30分钟一个数据点

    const parseTimeString = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return new Date(2000, 0, 1, hours, minutes);
    };

    const riseDate = parseTimeString(riseTime);
    const setDate = parseTimeString(setTime);
    const transitDate = parseTimeString(transitTime);

    // 确保时间序列正确
    if (setDate.getTime() < riseDate.getTime()) {
      setDate.setDate(setDate.getDate() + 1);
    }
    if (transitDate.getTime() < riseDate.getTime()) {
      transitDate.setDate(transitDate.getDate() + 1);
    }

    const timeStep = (setDate.getTime() - riseDate.getTime()) / dataPointCount;

    for (let i = 0; i <= dataPointCount; i++) {
      const currentTime = new Date(riseDate.getTime() + i * timeStep);
      const altitude = calculateAltitude(
        currentTime,
        riseDate,
        transitDate,
        setDate,
        transitAltitude
      );

      let phase: "rising" | "transit" | "setting";
      if (currentTime < transitDate) {
        phase = "rising";
      } else if (currentTime.getTime() === transitDate.getTime()) {
        phase = "transit";
      } else {
        phase = "setting";
      }

      points.push({
        time: currentTime.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        altitude: Math.max(0, altitude),
        phase,
      });
    }

    return points;
  }, [riseTime, setTime, transitTime, transitAltitude]);

  const calculateAltitude = (
    current: Date,
    rise: Date,
    transit: Date,
    set: Date,
    maxAlt: number
  ): number => {
    const getMinutes = (date: Date) =>
      date.getHours() * 60 + date.getMinutes();

    const currentMin = getMinutes(current);
    const riseMin = getMinutes(rise);
    const transitMin = getMinutes(transit);
    const setMin = getMinutes(set);

    if (currentMin < riseMin || currentMin > setMin) {
      return 0;
    }

    let position;
    if (currentMin <= transitMin) {
      position = (currentMin - riseMin) / (transitMin - riseMin);
    } else {
      position = 1 - (currentMin - transitMin) / (setMin - transitMin);
    }

    return maxAlt * Math.sin((position * Math.PI) / 2);
  };

  const data = useMemo(() => generateDataPoints(), [generateDataPoints]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrushDomain(null);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (enableZoom && e.button === 0) {
        setIsPanning(true);
      }
    },
    [enableZoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
    },
    [isPanning]
  );

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <Card className="bg-background/95 backdrop-blur-sm p-3">
          <div className="space-y-1">
            <div className="font-medium">{label}</div>
            <div className="text-sm text-muted-foreground">
              高度: {Math.round(data.altitude)}°
            </div>
            <Badge
              variant={
                data.phase === "transit"
                  ? "default"
                  : data.phase === "rising"
                  ? "secondary"
                  : "outline"
              }
            >
              {data.phase === "transit"
                ? "最高点"
                : data.phase === "rising"
                ? "上升"
                : "下降"}
            </Badge>
          </div>
        </Card>
      );
    }
    return null;
  };

  const handleBrushChange = useCallback(
    ({ startIndex, endIndex }: { startIndex?: number; endIndex?: number }) => {
      if (typeof startIndex === 'number' && typeof endIndex === 'number') {
        setBrushDomain([startIndex, endIndex]);
      }
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: animationDuration }}
      className="w-full relative"
      style={{
        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <div className="p-4">
          {enableZoom && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>放大</TooltipContent>
                </UITooltip>

                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>缩小</TooltipContent>
                </UITooltip>

                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>重置</TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}

          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                stroke={axisColor}
                tick={{ fill: axisColor }}
              />
              <YAxis
                domain={[0, 90]}
                stroke={axisColor}
                tick={{ fill: axisColor }}
                label={{
                  value: "高度 (°)",
                  position: "insideLeft",
                  angle: -90,
                  style: { fill: axisColor },
                }}
              />
              {showReferenceLines && (
                <>
                  <ReferenceLine
                    y={transitAltitude}
                    stroke={axisColor}
                    strokeDasharray="5 5"
                    label={{
                      value: "最高点",
                      position: "right",
                      fill: axisColor,
                    }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke={axisColor}
                    strokeDasharray="5 5"
                    label={{
                      value: "地平线",
                      position: "right",
                      fill: axisColor,
                    }}
                  />
                </>
              )}
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="altitude"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: backgroundColor,
                  stroke: lineColor,
                  strokeWidth: 2,
                }}
                animationDuration={animationDuration * 1000}
              />
              {enableZoom && (
                <Brush
                  dataKey="time"
                  height={30}
                  stroke={axisColor}
                  fill={backgroundColor}
                  onChange={handleBrushChange}
                />
              )}
              {brushDomain && (
                <ReferenceArea
                  x1={data[brushDomain[0]].time}
                  x2={data[brushDomain[1]].time}
                  strokeOpacity={0.3}
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>升起: {riseTime}</div>
            <div>最高点: {transitTime}</div>
            <div>落下: {setTime}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
