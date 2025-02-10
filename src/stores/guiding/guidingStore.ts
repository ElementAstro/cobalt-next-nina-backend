import {
  CustomColors,
  GuideSettings,
  TrackingParams,
} from "@/types/guiding/guiding";
import { create } from "zustand";
import { toast } from "@/hooks/use-toast";

interface GuidingStore {
  // 基础设置
  settings: GuideSettings;
  setSettings: (settings: Partial<GuideSettings>) => void;

  // 跟踪参数
  tracking: TrackingParams;
  setTracking: (tracking: Partial<TrackingParams>) => void;

  // 波形数据
  waveform: {
    imageUrl: string | null;
    centroid: number | null;
    intensityData: { x: number; y: number }[];
    setImageUrl: (url: string) => void;
    setCentroid: (x: number) => void;
    setIntensityData: (data: { x: number; y: number }[]) => void;
    exportData: () => void;
  };

  // 历史图表
  historyGraph: {
    points: { x: number; y: number }[];
    showTrendLine: boolean;
    colors: CustomColors;
    animationSpeed: number;
    gridSpacing: number;
    showStats: boolean;
    enableZoom: boolean;
    showAxisLabels: boolean;
    pointRadius: number;
    lineThickness: number;
    refreshData: () => void;
    exportData: () => void;
  };
}

export const useGuidingStore = create<GuidingStore>((set, get) => {
  return {
    settings: {
      radius: 2.0,
      zoom: 100,
      xScale: 100,
      yScale: '+/-4"',
      correction: true,
      trendLine: false,
      animationSpeed: 1,
      colorScheme: "dark",
      autoGuide: false,
      exposureTime: 1000,
      debugMode: false,
    },
    setSettings: (newSettings) =>
      set((state) => ({ settings: { ...state.settings, ...newSettings } })),

    tracking: {
      mod: 70,
      flow: 10,
      value: 0.27,
      agr: 100,
      guideLength: 2500,
    },
    setTracking: (newTracking) =>
      set((state) => ({ tracking: { ...state.tracking, ...newTracking } })),

    waveform: {
      imageUrl: null,
      centroid: null,
      intensityData: [],
      setImageUrl: (url) =>
        set((state) => ({ waveform: { ...state.waveform, imageUrl: url } })),
      setCentroid: (x) =>
        set((state) => ({ waveform: { ...state.waveform, centroid: x } })),
      setIntensityData: (data) =>
        set((state) => ({
          waveform: { ...state.waveform, intensityData: data },
        })),
      exportData: () => {
        const { intensityData } = get().waveform;
        const csvContent =
          "data:text/csv;charset=utf-8," +
          intensityData.map((point) => `${point.x},${point.y}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "waveform_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "数据导出成功",
          description: "波形数据已成功导出为CSV文件",
        });
      },
    },

    historyGraph: {
      points: [],
      showTrendLine: true,
      colors: {
        primary: "#4ade80",
        secondary: "#818cf8",
        accent: "#f472b6",
        background: "#1f2937",
        text: "#ffffff",
        grid: "#374151",
        avgLine: "#f59e0b",
      },
      animationSpeed: 0.5,
      gridSpacing: 50,
      showStats: true,
      enableZoom: true,
      showAxisLabels: true,
      pointRadius: 3,
      lineThickness: 2,
      refreshData: () => {
        const newPoints = Array.from({ length: 50 }, (_, i) => ({
          x: i,
          y: Math.random() * 100,
        }));
        set((state) => ({
          historyGraph: { ...state.historyGraph, points: newPoints },
        }));
      },
      exportData: () => {
        const { points } = get().historyGraph;
        const csvContent =
          "data:text/csv;charset=utf-8," +
          ["x,y", ...points.map((p) => `${p.x},${p.y}`)].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "history_graph_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "数据导出成功",
          description: "历史图表数据已成功导出为CSV文件",
        });
      },
    },
  };
});

// 初始化数据刷新
setInterval(() => {
  useGuidingStore.getState().historyGraph.refreshData();
}, 5000);

// 颜色方案
export const darkScheme: CustomColors = {
  background: "#1a1a2e",
  text: "#ffffff",
  primary: "#0f3460",
  secondary: "#16213e",
  accent: "#e94560",
};

export const lightScheme: CustomColors = {
  background: "#f0f0f0",
  text: "#333333",
  primary: "#3498db",
  secondary: "#ecf0f1",
  accent: "#e74c3c",
};

export function getColorScheme(scheme: "dark" | "light"): CustomColors {
  return scheme === "dark" ? darkScheme : lightScheme;
}
