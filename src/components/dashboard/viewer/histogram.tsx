import { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
} from "recharts";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistogramProps {
  imageData: ImageData;
  className?: string;
}

interface HistogramData {
  value: number;
  count: number;
  r: number;
  g: number;
  b: number;
}

export function Histogram({ imageData, className }: HistogramProps) {
  const workerRef = useRef<Worker>();
  const [displayMode, setDisplayMode] = useState<
    "rgb" | "luminance" | "separate"
  >("rgb");
  const [data, setData] = useState<HistogramData[]>([]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/histogram.worker.ts", import.meta.url)
    );
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const handleMessage = (e: MessageEvent) => {
      setData(e.data as HistogramData[]);
    };

    worker.onmessage = handleMessage;
    worker.postMessage({ imageData, displayMode });

    return () => {
      worker.onmessage = null;
    };
  }, [imageData, displayMode]);

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [zoomDomain, setZoomDomain] = useState<{ left: number; right: number }>(
    {
      left: 0,
      right: 255,
    }
  );
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  const handleZoom = () => {
    if (refAreaLeft === null || refAreaRight === null) return;

    const left = Math.min(refAreaLeft, refAreaRight);
    const right = Math.max(refAreaLeft, refAreaRight);

    setZoomDomain({ left, right });
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleZoomOut = () => {
    setZoomDomain({ left: 0, right: 255 });
  };

  const handleDisplayModeChange = (value: string) => {
    setDisplayMode(value as "rgb" | "luminance" | "separate");
  };

  return (
    <div
      className={cn(
        "relative bg-black/30 rounded-lg p-2",
        isMobile ? "w-full h-[120px]" : "w-[300px] h-[150px]",
        className
      )}
    >
      <Select value={displayMode} onValueChange={handleDisplayModeChange}>
        <SelectTrigger className="absolute top-2 left-2 z-10 bg-black/50 text-xs h-7 w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rgb">RGB</SelectItem>
          <SelectItem value="luminance">亮度</SelectItem>
          <SelectItem value="separate">分离通道</SelectItem>
        </SelectContent>
      </Select>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleZoomOut}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          onMouseDown={(e) =>
            e && setRefAreaLeft(e.activeLabel ? parseInt(e.activeLabel) : null)
          }
          onMouseMove={(e) =>
            refAreaLeft &&
            e &&
            setRefAreaRight(e.activeLabel ? parseInt(e.activeLabel) : null)
          }
          onMouseUp={handleZoom}
        >
          <XAxis
            dataKey="value"
            domain={[zoomDomain.left, zoomDomain.right]}
            type="number"
            hide
          />
          <YAxis hide />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as HistogramData;
              return (
                <div className="bg-black/80 p-2 rounded text-xs">
                  <p>亮度: {data.value}</p>
                  <p>R: {data.r}</p>
                  <p>G: {data.g}</p>
                  <p>B: {data.b}</p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="r"
            stroke="#ef4444"
            fill="#ef444420"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="g"
            stroke="#22c55e"
            fill="#22c55e20"
            strokeWidth={1}
          />
          <Area
            type="monotone"
            dataKey="b"
            stroke="#3b82f6"
            fill="#3b82f620"
            strokeWidth={1}
          />

          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill="white"
              fillOpacity={0.1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
