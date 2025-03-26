import { useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eye, EyeOff, Sliders, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HistogramProps {
  imageData: ImageData;
  className?: string;
  customColorSpace?: string;
  colorChannels?: {
    name: string;
    key: string;
    color: string;
  }[];
}

interface HistogramData {
  value: number;
  count: number;
  r: number;
  g: number;
  b: number;
  [key: string]: number; // 支持自定义通道
}

export function Histogram({
  imageData,
  className,
  customColorSpace,
  colorChannels,
}: HistogramProps) {
  const workerRef = useRef<Worker>();
  const [displayMode, setDisplayMode] = useState<
    "rgb" | "luminance" | "separate" | "single" | "custom"
  >(customColorSpace ? "custom" : "rgb");
  const [data, setData] = useState<HistogramData[]>([]);
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [activeChannel, setActiveChannel] = useState<string>("r");
  const [visibleChannels, setVisibleChannels] = useState<
    Record<string, boolean>
  >({
    r: true,
    g: true,
    b: true,
  });
  const [smoothing, setSmoothing] = useState<number>(0);
  const [logScale, setLogScale] = useState<boolean>(false);

  // 默认或自定义通道颜色配置
  const channels = colorChannels || [
    { name: "红色", key: "r", color: "#ef4444" },
    { name: "绿色", key: "g", color: "#22c55e" },
    { name: "蓝色", key: "b", color: "#3b82f6" },
  ];

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
      let histogramData = e.data as HistogramData[];

      // 应用平滑处理
      if (smoothing > 0) {
        histogramData = applySmoothing(histogramData, smoothing);
      }

      // 应用对数缩放
      if (logScale) {
        histogramData = applyLogScale(histogramData);
      }

      setData(histogramData);
    };

    worker.onmessage = handleMessage;
    worker.postMessage({
      imageData,
      displayMode,
      customChannels: customColorSpace ? channels.map((c) => c.key) : undefined,
    });

    return () => {
      worker.onmessage = null;
    };
  }, [imageData, displayMode, smoothing, logScale, customColorSpace, channels]);

  // 应用高斯平滑
  const applySmoothing = (
    data: HistogramData[],
    factor: number
  ): HistogramData[] => {
    if (factor === 0) return data;

    const kernelSize = Math.ceil(factor * 10) * 2 + 1;
    const sigma = factor * 2;
    const kernel = gaussianKernel(kernelSize, sigma);

    return convolve(data, kernel);
  };

  // 计算高斯核
  const gaussianKernel = (size: number, sigma: number): number[] => {
    const kernel = [];
    const mean = (size - 1) / 2;
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - mean;
      const g = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel.push(g);
      sum += g;
    }

    // 归一化
    return kernel.map((v) => v / sum);
  };

  // 卷积操作
  const convolve = (
    data: HistogramData[],
    kernel: number[]
  ): HistogramData[] => {
    const result = JSON.parse(JSON.stringify(data)) as HistogramData[];
    const kernelCenter = Math.floor(kernel.length / 2);

    // 对每个通道应用卷积
    channels.forEach((channel) => {
      if (!visibleChannels[channel.key]) return;

      for (let i = 0; i < data.length; i++) {
        let sum = 0;

        for (let j = 0; j < kernel.length; j++) {
          const pos = i + j - kernelCenter;
          if (pos >= 0 && pos < data.length) {
            sum += data[pos][channel.key] * kernel[j];
          }
        }

        result[i][channel.key] = sum;
      }
    });

    return result;
  };

  // 应用对数缩放
  const applyLogScale = (data: HistogramData[]): HistogramData[] => {
    return data.map((item) => {
      const result = { ...item };

      channels.forEach((channel) => {
        if (visibleChannels[channel.key]) {
          const value = item[channel.key];
          result[channel.key] = value > 0 ? Math.log(value + 1) : 0;
        }
      });

      return result;
    });
  };

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
    setDisplayMode(
      value as "rgb" | "luminance" | "separate" | "single" | "custom"
    );
    // 当切换到单通道模式时，默认选择第一个通道
    if (value === "single") {
      setActiveChannel(channels[0].key);
    }
  };

  const toggleChannel = (key: string) => {
    setVisibleChannels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = () => {
    // 创建CSV格式的数据
    const header = [
      "Value",
      ...channels.filter((c) => visibleChannels[c.key]).map((c) => c.name),
    ].join(",");
    const rows = data.map((point) => {
      return [
        point.value,
        ...channels
          .filter((c) => visibleChannels[c.key])
          .map((c) => point[c.key]),
      ].join(",");
    });

    const csvContent = [header, ...rows].join("\n");

    // 创建下载链接
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `histogram-${new Date().toISOString().slice(0, 19)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 渲染图表类型的组件
  const renderChart = () => {
    const ChartComponent = chartType === "area" ? AreaChart : ComposedChart;

    return (
      <ChartComponent
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
          hide={isMobile}
          tick={{ fontSize: 10 }}
        />
        <YAxis hide={isMobile} tick={{ fontSize: 10 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const data = payload[0].payload as HistogramData;
            return (
              <div className="bg-black/80 p-2 rounded text-xs">
                <p>亮度: {data.value}</p>
                {channels.map(
                  (channel) =>
                    visibleChannels[channel.key] && (
                      <p key={channel.key} style={{ color: channel.color }}>
                        {channel.name}:{" "}
                        {Math.round(data[channel.key] * 100) / 100}
                      </p>
                    )
                )}
              </div>
            );
          }}
        />
        {!isMobile && <Legend verticalAlign="top" height={20} />}

        {displayMode === "single" ? (
          chartType === "area" ? (
            <Area
              type="monotone"
              dataKey={activeChannel}
              stroke={
                channels.find((c) => c.key === activeChannel)?.color ||
                "#ffffff"
              }
              fill={`${
                channels.find((c) => c.key === activeChannel)?.color ||
                "#ffffff"
              }40`}
              strokeWidth={1.5}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={activeChannel}
              stroke={
                channels.find((c) => c.key === activeChannel)?.color ||
                "#ffffff"
              }
              dot={false}
              strokeWidth={1.5}
            />
          )
        ) : (
          channels.map(
            (channel) =>
              visibleChannels[channel.key] &&
              (chartType === "area" ? (
                <Area
                  key={channel.key}
                  type="monotone"
                  dataKey={channel.key}
                  name={channel.name}
                  stroke={channel.color}
                  fill={`${channel.color}40`}
                  strokeWidth={1}
                />
              ) : (
                <Line
                  key={channel.key}
                  type="monotone"
                  dataKey={channel.key}
                  name={channel.name}
                  stroke={channel.color}
                  dot={false}
                  strokeWidth={1.5}
                />
              ))
          )
        )}

        {refAreaLeft && refAreaRight && (
          <ReferenceArea
            x1={refAreaLeft}
            x2={refAreaRight}
            strokeOpacity={0.3}
            fill="white"
            fillOpacity={0.1}
          />
        )}
      </ChartComponent>
    );
  };

  return (
    <div
      className={cn(
        "relative bg-black/30 rounded-lg p-2",
        isMobile ? "w-full h-[120px]" : "w-[300px] h-[200px]",
        className
      )}
    >
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        <Select value={displayMode} onValueChange={handleDisplayModeChange}>
          <SelectTrigger className="bg-black/50 text-xs h-7 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rgb">RGB</SelectItem>
            <SelectItem value="luminance">亮度</SelectItem>
            <SelectItem value="separate">分离通道</SelectItem>
            <SelectItem value="single">单通道</SelectItem>
            {customColorSpace && (
              <SelectItem value="custom">{customColorSpace}</SelectItem>
            )}
          </SelectContent>
        </Select>

        {displayMode === "single" && (
          <Select value={activeChannel} onValueChange={setActiveChannel}>
            <SelectTrigger className="bg-black/50 text-xs h-7 w-16 ml-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.key} value={channel.key}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Tabs
          value={chartType}
          onValueChange={(v) => setChartType(v as "area" | "line")}
        >
          <TabsList className="h-6 bg-black/50">
            <TabsTrigger value="area" className="px-2 py-0 h-5 text-[10px]">
              面积
            </TabsTrigger>
            <TabsTrigger value="line" className="px-2 py-0 h-5 text-[10px]">
              线条
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-black/50">
              <Sliders className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="bottom" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">平滑度</Label>
                  <span className="text-xs text-muted-foreground">
                    {smoothing.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[smoothing]}
                  min={0}
                  max={2}
                  step={0.1}
                  onValueChange={(v) => setSmoothing(v[0])}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="log-scale"
                  checked={logScale}
                  onCheckedChange={setLogScale}
                />
                <Label htmlFor="log-scale" className="text-xs">
                  对数缩放
                </Label>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">通道可见性</Label>
                {channels.map((channel) => (
                  <div
                    key={channel.key}
                    className="flex items-center space-x-2"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-6 px-2 text-xs",
                        visibleChannels[channel.key]
                          ? "opacity-100"
                          : "opacity-40"
                      )}
                      onClick={() => toggleChannel(channel.key)}
                    >
                      {visibleChannels[channel.key] ? (
                        <Eye
                          className="h-3 w-3 mr-1"
                          style={{ color: channel.color }}
                        />
                      ) : (
                        <EyeOff className="h-3 w-3 mr-1" />
                      )}
                      {channel.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-black/50"
          onClick={handleExport}
        >
          <Download className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-black/50"
          onClick={handleZoomOut}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
