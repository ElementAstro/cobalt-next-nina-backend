"use client";

import { FC, useEffect, useState, useCallback, memo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
} from "recharts";
import { DateTime } from "luxon";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Info,
  BookOpen,
  Plus,
  Target,
  LineChart as LineChartIcon,
  X,
  AlertCircle,
  LucideIcon,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Star,
  Compass,
  Maximize2,
} from "lucide-react";
import { IDSOObjectDetailedInfo } from "@/types/skymap";
import { useSkymapStore } from "@/stores/skymap/skymapStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define chart data types
interface AltData {
  date: Date;
  value: number;
}
interface PolarData {
  angle: number;
  radius: number;
}
interface BarData {
  name: string;
  uv: number;
  pv: number;
  amt: number;
}
interface PieData {
  name: string;
  value: number;
}

type ChartType = "line" | "bar" | "pie" | "radar";

interface TargetSmallCardProps {
  open_dialog: number;
  target_info: IDSOObjectDetailedInfo;
  in_updating: boolean;
  on_choice_maken: (() => void) | null;
  in_manage?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  loading?: boolean;
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  className,
  loading = false,
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={cn(
      "p-3 rounded-lg bg-gray-800/50 shadow flex items-center gap-3",
      className
    )}
  >
    <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-gray-400">{title}</p>
      {loading ? (
        <Skeleton className="h-4 w-16 bg-gray-700" />
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  </motion.div>
);

const ChartSelector: FC<{
  activeChart: ChartType;
  setActiveChart: (type: ChartType) => void;
}> = ({ activeChart, setActiveChart }) => {
  const charts = [
    { type: "line" as ChartType, icon: LineChartIcon, label: "高度曲线" },
    { type: "radar" as ChartType, icon: Compass, label: "极坐标" },
    { type: "bar" as ChartType, icon: BarChart3, label: "观测数据" },
    { type: "pie" as ChartType, icon: PieChartIcon, label: "分布" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {charts.map((chart) => {
        const Icon = chart.icon;
        return (
          <Button
            key={chart.type}
            size="sm"
            variant={activeChart === chart.type ? "default" : "outline"}
            className={cn(
              "gap-1",
              activeChart === chart.type
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            )}
            onClick={() => setActiveChart(chart.type)}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{chart.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

const TargetDetailCard: FC<TargetSmallCardProps> = (props) => {
  const [add_btn_color, set_add_btn_color] = useState<
    | "link"
    | "secondary"
    | "default"
    | "destructive"
    | "outline"
    | "ghost"
    | null
    | undefined
  >("default");

  // chart data with specific types
  const [alt_data, set_alt_data] = useState<AltData[]>([]);
  const [polar_data, set_polar_data] = useState<PolarData[]>([]);
  const [bar_data, set_bar_data] = useState<BarData[]>([]);
  const [pie_data, set_pie_data] = useState<PieData[]>([]);
  const [activeChart, setActiveChart] = useState<ChartType>("line");
  const [showFullChart, setShowFullChart] = useState(false);

  // store functions (removed unused 'targets')
  const add_target_to_store = useSkymapStore((state) => state.addTarget);
  const set_focus_target_to_store = useSkymapStore(
    (state) => state.setFocusTarget
  );

  const handleClose = () => {
    // 实现关闭逻辑，例如调用父组件的回调
  };

  // Wrap init_fig_data with useCallback to fix dependency warnings
  const init_fig_data = useCallback(() => {
    const new_data = props.target_info.altitude.map((item) => ({
      date: DateTime.fromFormat(item[0], "yyyy-MM-dd HH:mm:ss").toJSDate(),
      value: Number(item[2].toFixed(2)),
    }));
    set_alt_data(new_data);

    const polarData = props.target_info.altitude.map((item) => ({
      angle: Number(item[1].toFixed(2)),
      radius: Number(item[2].toFixed(2)),
    }));
    set_polar_data(polarData);

    // 生成更真实的观测数据
    const generateObservationData = () => {
      const months = ["1月", "2月", "3月", "4月", "5月", "6月"];
      return months.map((month) => ({
        name: month,
        uv: Math.floor(Math.random() * 5000) + 2000,
        pv: Math.floor(Math.random() * 8000) + 1000,
        amt: Math.floor(Math.random() * 7000) + 1500,
      }));
    };

    const barData: BarData[] = generateObservationData();
    set_bar_data(barData);

    // 根据目标类型生成分类数据
    const pieData: PieData[] = [
      { name: "观测窗口", value: 40 },
      { name: "云层覆盖", value: 25 },
      { name: "光污染", value: 15 },
      { name: "其他因素", value: 20 },
    ];
    set_pie_data(pieData);
  }, [props.target_info]);

  useEffect(() => {
    if (props.open_dialog > 0) {
      // 打开逻辑
    }
  }, [props.open_dialog]);

  useEffect(() => {
    if (!props.in_updating) {
      init_fig_data();
    }
  }, [props.in_updating, init_fig_data]);

  const handleAddTarget = () => {
    if (add_target_to_store) {
      const targetInfo = {
        ...props.target_info,
        bmag: props.target_info.bmag ?? undefined,
        vmag: props.target_info.vmag ?? undefined,
      };

      const toastId = toast.loading("正在添加目标...");

      setTimeout(() => {
        add_target_to_store(targetInfo);
        toast.success(`已添加 ${props.target_info.name} 到列表`, {
          id: toastId,
          description: "目标已成功添加到待拍摄列表",
        });
        set_add_btn_color("destructive");
        setTimeout(() => {
          set_add_btn_color("default");
        }, 500);
      }, 600);
    }
  };

  const handleFocusTarget = () => {
    if (set_focus_target_to_store) {
      const toastId = toast.loading("正在更新构图...");

      setTimeout(() => {
        set_focus_target_to_store(props.target_info.id);
        toast.success(`已选择 ${props.target_info.name} 作为构图中心`, {
          id: toastId,
        });
        if (props.on_choice_maken) {
          props.on_choice_maken();
        }
      }, 500);
    }
  };

  const TranslateTargetType = (type: string) => {
    const translations: { [key: string]: string } = {
      galaxy: "星系",
      globular: "球状星团",
      opencluster: "疏散星团",
      nebula: "星云",
      planetary: "行星状星云",
      star: "恒星",
    };
    return translations[type.toLowerCase()] || type;
  };

  const on_add_target_to_list_clicked = () => {
    handleAddTarget();
  };

  const on_add_focused_target_clicked = () => {
    handleFocusTarget();
  };

  const target_icon_link = props.target_info.name
    ? `/api/file/DSO/${props.target_info.name}.jpg`
    : "/placeholder.jpg";
  const current_alt =
    props.target_info.altitude && props.target_info.altitude.length > 0
      ? props.target_info.altitude[0][2]
      : 0;
  const highest_alt = props.target_info.altitude
    ? Math.max(...props.target_info.altitude.map((alt) => alt[2]))
    : 0;
  const available_time = 5.5; // 替换为实际数据

  const shareTarget = () => {
    // 创建分享数据
    const shareData = {
      title: `天体目标: ${props.target_info.name}`,
      text: `查看天体目标 ${
        props.target_info.name
      }, RA: ${props.target_info.ra.toFixed(
        5
      )}°, DEC: ${props.target_info.dec.toFixed(5)}°`,
      url: `${window.location.origin}/target?name=${encodeURIComponent(
        props.target_info.name
      )}`,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => toast.success("分享成功"))
        .catch((error) => {
          console.error("分享失败:", error);
          toast.error("分享失败，请稍后重试");
        });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard
        .writeText(`${shareData.text}\n${shareData.url}`)
        .then(() => {
          toast.success("链接已复制到剪贴板", {
            description: "可以粘贴给好友分享",
          });
        })
        .catch(() => {
          toast.error("复制链接失败");
        });
    }
  };

  const downloadData = () => {
    const data = {
      name: props.target_info.name,
      ra: props.target_info.ra,
      dec: props.target_info.dec,
      type: props.target_info.target_type,
      size: props.target_info.size,
      altitude: props.target_info.altitude,
      magnitude: props.target_info.magnitude,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.target_info.name}_data.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("数据下载完成", {
      description: `已下载 ${props.target_info.name} 的详细数据`,
    });
  };

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const renderActiveChart = () => {
    if (props.in_updating) {
      return (
        <div className="flex items-center justify-center h-64 w-full">
          <LoadingSpinner className="w-10 h-10 text-indigo-400" />
          <p className="ml-3 text-gray-400">加载图表数据中...</p>
        </div>
      );
    }

    switch (activeChart) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={alt_data}
              margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="date"
                stroke="#999"
                tickFormatter={(date) =>
                  DateTime.fromJSDate(date).toFormat("HH:mm")
                }
              />
              <YAxis stroke="#999" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.9)",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                }}
                labelFormatter={(date) =>
                  `时间: ${DateTime.fromJSDate(date as Date).toFormat("HH:mm")}`
                }
              />
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6, fill: "#fff", stroke: "#8884d8" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart
              outerRadius="80%"
              data={polar_data}
              margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            >
              <PolarGrid stroke="#444" />
              <PolarAngleAxis dataKey="angle" stroke="#999" />
              <PolarRadiusAxis angle={30} domain={[0, 90]} stroke="#999" />
              <Radar
                name={props.target_info.name}
                dataKey="radius"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.9)",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={bar_data}
              margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.9)",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                }}
              />
              <Bar
                dataKey="pv"
                name="曝光时间"
                stackId="a"
                fill="#8884d8"
                animationDuration={1500}
              />
              <Bar
                dataKey="uv"
                name="最大高度"
                stackId="a"
                fill="#82ca9d"
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pie_data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={true}
                animationDuration={1500}
              >
                {pie_data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.9)",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // 优化布局，更加紧凑：减小内边距和间距
  return (
    <AnimatePresence>
      {props.open_dialog > 0 && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-gray-900/95 backdrop-blur-md dark:bg-gray-900 rounded-lg shadow-xl border border-gray-700/50 p-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
                <Star className="w-6 h-6" />
                {props.target_info.name}
              </h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={shareTarget}
                >
                  <Share2 className="w-5 h-5 text-gray-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={downloadData}
                >
                  <Download className="w-5 h-5 text-gray-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => setShowFullChart(!showFullChart)}
                >
                  {showFullChart ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={handleClose}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-gray-800">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-indigo-600"
                >
                  <Info className="w-4 h-4 mr-2" />
                  概览
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-indigo-600"
                >
                  <LineChartIcon className="w-4 h-4 mr-2" />
                  详细数据
                </TabsTrigger>
                <TabsTrigger
                  value="encyclopedia"
                  className="data-[state=active]:bg-indigo-600"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  百科资料
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800 mb-4">
                      {props.in_updating ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LoadingSpinner className="w-10 h-10 text-indigo-400" />
                        </div>
                      ) : (
                        <Image
                          src={target_icon_link}
                          alt={props.target_info.name}
                          className="w-full h-full object-cover"
                          width={500}
                          height={280}
                          onError={(e) => {
                            // 图片加载失败时的处理
                            e.currentTarget.src = "/placeholder-dso.jpg";
                          }}
                        />
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
                        onClick={() => {
                          // 图片全屏查看逻辑
                        }}
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <StatCard
                        title="赤经 (RA)"
                        value={`${props.target_info.ra.toFixed(5)}°`}
                        icon={Compass}
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="赤纬 (DEC)"
                        value={`${props.target_info.dec.toFixed(5)}°`}
                        icon={Compass}
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="类型"
                        value={TranslateTargetType(
                          props.target_info.target_type
                        )}
                        icon={Star}
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="视角大小"
                        value={`${props.target_info.size.toFixed(1)}′`}
                        icon={Maximize2}
                        loading={props.in_updating}
                      />
                    </div>

                    <Card className="p-3 bg-gray-800/50 border-gray-700/50">
                      <h3 className="text-lg font-medium mb-2 text-indigo-400">
                        目标信息
                      </h3>
                      <p className="text-sm text-gray-300">
                        {props.in_updating ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-gray-700" />
                            <Skeleton className="h-4 w-5/6 bg-gray-700" />
                            <Skeleton className="h-4 w-4/6 bg-gray-700" />
                          </div>
                        ) : (
                          <>
                            {props.target_info.name}是一个
                            {TranslateTargetType(props.target_info.target_type)}
                            类天体， 位于赤经{props.target_info.ra.toFixed(5)}
                            °，赤纬{props.target_info.dec.toFixed(5)}°位置。
                            视角大小约为{props.target_info.size.toFixed(1)}
                            角分，是一个很好的观测目标。
                          </>
                        )}
                      </p>
                      {!props.in_updating && (
                        <button className="text-indigo-400 text-sm mt-2 hover:underline">
                          查看更多信息
                        </button>
                      )}
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <Card className="p-4 bg-gray-800/50 border-gray-700/50">
                      <h3 className="text-lg font-medium mb-3 text-indigo-400">
                        高度曲线
                      </h3>
                      <div className="h-64">
                        {props.in_updating ? (
                          <div className="flex items-center justify-center h-full">
                            <LoadingSpinner className="w-8 h-8 text-indigo-400" />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={alt_data}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 25,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#444"
                              />
                              <XAxis
                                dataKey="date"
                                stroke="#999"
                                tickFormatter={(date) =>
                                  DateTime.fromJSDate(date).toFormat("HH:mm")
                                }
                              />
                              <YAxis stroke="#999" />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: "rgba(23, 23, 23, 0.9)",
                                  border: "1px solid #333",
                                  borderRadius: "4px",
                                }}
                                labelFormatter={(date) =>
                                  `时间: ${DateTime.fromJSDate(
                                    date as Date
                                  ).toFormat("HH:mm")}`
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                                animationDuration={1500}
                              />
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="none"
                                fill="#8884d8"
                                fillOpacity={0.2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        title="当前高度"
                        value={`${current_alt.toFixed(1)}°`}
                        icon={LineChartIcon}
                        className="bg-indigo-900/20 border border-indigo-900/30"
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="最高高度"
                        value={`${highest_alt.toFixed(1)}°`}
                        icon={LineChartIcon}
                        className="bg-indigo-900/20 border border-indigo-900/30"
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="可拍摄时间"
                        value={`${available_time.toFixed(1)}小时`}
                        icon={LineChartIcon}
                        className="bg-indigo-900/20 border border-indigo-900/30"
                        loading={props.in_updating}
                      />
                      <StatCard
                        title="状态"
                        value="活跃"
                        icon={AlertCircle}
                        className="bg-indigo-900/20 border border-indigo-900/30"
                        loading={props.in_updating}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <ChartSelector
                  activeChart={activeChart}
                  setActiveChart={setActiveChart}
                />
                <div className="relative">
                  {renderActiveChart()}
                  {showFullChart && (
                    <motion.div
                      className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-full h-full p-4">
                        {renderActiveChart()}
                      </div>
                    </motion.div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="encyclopedia" className="space-y-6">
                <Card className="p-4 bg-gray-800/50 border-gray-700/50">
                  <h3 className="text-lg font-medium mb-3 text-indigo-400">
                    百科资料
                  </h3>
                  <p className="text-sm text-gray-300">
                    {props.target_info.name}是一个
                    {TranslateTargetType(props.target_info.target_type)}类天体，
                    位于赤经{props.target_info.ra.toFixed(5)}°，赤纬
                    {props.target_info.dec.toFixed(5)}°位置。 视角大小约为
                    {props.target_info.size.toFixed(1)}
                    角分，是一个很好的观测目标。
                  </p>
                  <button className="text-indigo-400 text-sm mt-2 hover:underline">
                    查看更多信息
                  </button>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6 space-x-2">
              {!props.in_manage && (
                <motion.div variants={itemVariants}>
                  <Button
                    variant={add_btn_color}
                    size="sm"
                    onClick={on_add_target_to_list_clicked}
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    加入列表
                  </Button>
                </motion.div>
              )}
              <motion.div variants={itemVariants}>
                <Button
                  variant="default"
                  size="sm"
                  onClick={on_add_focused_target_clicked}
                  className="gap-1"
                >
                  <Target className="w-4 h-4" />
                  以该构图
                </Button>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClose}
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  退出
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(TargetDetailCard);
