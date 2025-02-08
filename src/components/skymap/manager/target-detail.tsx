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
} from "recharts";
import { DateTime } from "luxon";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner as Spinner } from "@/components/ui/loading-spinner";
import {
  Info,
  BookOpen,
  Plus,
  Target,
  LineChart as LineChartIcon,
  X,
} from "lucide-react";
import { IDSOObjectDetailedInfo } from "@/types/skymap";
import { useSkymapStore } from "@/stores/skymap/skymapStore";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

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

interface TargetSmallCardProps {
  open_dialog: number;
  target_info: IDSOObjectDetailedInfo;
  in_updating: boolean;
  on_choice_maken: (() => void) | null;
  in_manage?: boolean;
}

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

    const barData: BarData[] = [
      { name: "观测1", uv: 4000, pv: 2400, amt: 2400 },
      { name: "观测2", uv: 3000, pv: 1398, amt: 2210 },
      { name: "观测3", uv: 2000, pv: 9800, amt: 2290 },
      { name: "观测4", uv: 2780, pv: 3908, amt: 2000 },
    ];
    set_bar_data(barData);

    const pieData: PieData[] = [
      { name: "类别A", value: 400 },
      { name: "类别B", value: 300 },
      { name: "类别C", value: 300 },
      { name: "类别D", value: 200 },
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
      add_target_to_store(targetInfo);
      set_add_btn_color("destructive");
      setTimeout(() => {
        set_add_btn_color("default");
      }, 500);
    }
  };

  const handleFocusTarget = () => {
    if (set_focus_target_to_store) {
      set_focus_target_to_store(props.target_info.id);
      if (props.on_choice_maken) {
        props.on_choice_maken();
      }
    }
  };

  const TranslateTargetType = (type: string) => {
    const translations: { [key: string]: string } = {
      star: "恒星",
      planet: "行星",
      galaxy: "星系",
      // 更多类型...
    };
    return translations[type] || type;
  };

  const on_add_target_to_list_clicked = () => {
    handleAddTarget();
  };

  const on_add_focused_target_clicked = () => {
    handleFocusTarget();
  };

  const target_icon_link = "/path/to/target/icon.png"; // 替换为实际路径
  const current_alt = 45; // 替换为实际数据
  const highest_alt = 90; // 替换为实际数据
  const available_time = 5.5; // 替换为实际数据

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

  // 优化布局，更加紧凑：减小内边距和间距
  return (
    <motion.div
      className="h-full w-full p-4 bg-gray-800/95 backdrop-blur-sm dark:bg-gray-900/95 rounded-lg shadow-xl border border-gray-700/50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <AnimatePresence>
        <Tabs
          defaultValue="observationData"
          className="w-full flex flex-col lg:flex-row lg:gap-2"
        >
          <motion.div variants={itemVariants} className="w-full lg:w-48">
            <TabsList className="flex lg:flex-col space-x-1 lg:space-x-0 lg:space-y-1 bg-gray-700 dark:bg-gray-800 p-1 rounded">
              <TabsTrigger
                value="observationData"
                className="px-2 py-1 text-white flex items-center gap-1"
              >
                <LineChartIcon className="w-4 h-4" />
                观测数据
              </TabsTrigger>
              <TabsTrigger
                value="basicInfo"
                className="px-2 py-1 text-white flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                基础信息
              </TabsTrigger>
              <TabsTrigger
                value="wiki"
                className="px-2 py-1 text-white flex items-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                小百科
              </TabsTrigger>
            </TabsList>
          </motion.div>
          <div className="flex-1">
            <TabsContent value="observationData" className="mt-2">
              <motion.div
                className="flex flex-col h-full space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="flex flex-col md:flex-row h-1/2 space-y-2 md:space-y-0 md:space-x-2"
                  variants={containerVariants}
                >
                  <motion.div
                    className="w-full md:w-1/2 h-full"
                    variants={itemVariants}
                  >
                    <Card className="h-full bg-gray-700 dark:bg-gray-800">
                      <Image
                        src={target_icon_link}
                        alt="目标图片"
                        className="object-cover h-32 w-full rounded-t-lg"
                        width={400}
                        height={128}
                      />
                      <div className="p-2">
                        <h2 className="text-base font-semibold text-white">
                          {props.target_info.name}
                        </h2>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div
                    className="w-full md:w-1/2 h-full"
                    variants={itemVariants}
                  >
                    {props.in_updating ? (
                      <Spinner />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          width={250}
                          height={250}
                          data={polar_data}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="angle" stroke="#ffffff" />
                          <PolarRadiusAxis stroke="#ffffff" />
                          <Radar
                            name={props.target_info.name}
                            dataKey="radius"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <motion.div className="h-1/2" variants={itemVariants}>
                      {props.in_updating ? (
                        <Spinner />
                      ) : (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <LineChart width={300} height={180} data={alt_data}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff"
                              />
                              <XAxis dataKey="date" stroke="#ffffff" />
                              <YAxis stroke="#ffffff" />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: "#333",
                                  color: "#fff",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <BarChart width={300} height={180} data={bar_data}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff"
                              />
                              <XAxis dataKey="name" stroke="#ffffff" />
                              <YAxis stroke="#ffffff" />
                              <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: "#333",
                                  color: "#fff",
                                }}
                              />
                              <Bar dataKey="uv" fill="#8884d8" />
                              <Bar dataKey="pv" fill="#82ca9d" />
                            </BarChart>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <PieChart width={220} height={220}>
                              <Pie
                                data={pie_data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pie_data.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      [
                                        "#0088FE",
                                        "#00C49F",
                                        "#FFBB28",
                                        "#FF8042",
                                      ][index % 4]
                                    }
                                    name={entry.name} // 使用 entry 参数
                                  />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                            </PieChart>
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </HoverCardTrigger>
                  <HoverCardContent className="bg-black/80 text-white p-2">
                    <p className="text-xs">点击可查看详细数据</p>
                  </HoverCardContent>
                </HoverCard>
              </motion.div>
            </TabsContent>
            <TabsContent value="basicInfo" className="mt-2">
              <motion.div
                className="flex flex-col h-full space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="flex flex-col md:flex-row h-2/5 space-y-2 md:space-y-0 md:space-x-2"
                  variants={containerVariants}
                >
                  <motion.div
                    className="w-full md:w-1/2 h-full"
                    variants={itemVariants}
                  >
                    <Card className="h-full flex bg-gray-700 dark:bg-gray-800">
                      <Image
                        src={target_icon_link}
                        alt="目标图片"
                        className="object-cover h-full w-32 rounded-l-lg"
                        width={128}
                        height={128}
                      />
                      <div className="p-2 flex flex-col justify-between">
                        <h2 className="text-base font-semibold text-white">
                          {props.target_info.name}
                        </h2>
                        <div className="space-y-1">
                          <p className="text-white">
                            Ra: {props.target_info.ra.toFixed(7)} °
                          </p>
                          <p className="text-white">
                            Dec: {props.target_info.dec.toFixed(7)} °
                          </p>
                          <p className="text-secondary">
                            目标类型:{" "}
                            {TranslateTargetType(props.target_info.target_type)}
                          </p>
                          <p className="text-secondary">
                            目标视角大小: {props.target_info.size} ′
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                  <motion.div
                    className="w-full md:w-1/2 h-full"
                    variants={itemVariants}
                  >
                    <Card className="h-full p-2 bg-gray-700 dark:bg-gray-800">
                      <div className="grid grid-cols-2 gap-2">
                        <p className="text-white">
                          当前高度: {current_alt.toFixed(0)}°
                        </p>
                        <p className="text-white">
                          最高高度: {highest_alt.toFixed(0)}°
                        </p>
                        <p className="text-white">
                          估计可拍摄: {available_time.toFixed(1)}h
                        </p>
                        <p className="text-white">状态: 活跃</p>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
                <motion.div className="h-3/5" variants={itemVariants}>
                  <Card className="h-full p-2 overflow-auto bg-gray-700 dark:bg-gray-800">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {props.target_info.name} 简介
                    </h3>
                    <p className="text-white text-sm">
                      这里是关于目标的详细信息和背景介绍。您可以在这里添加更多关于目标的描述、历史和相关数据。
                    </p>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
            <TabsContent value="wiki" className="mt-2">
              <motion.div
                className="w-full h-full overflow-auto bg-gray-700 dark:bg-gray-800 p-2 rounded"
                variants={itemVariants}
              >
                <h3 className="text-base font-semibold text-white mb-1">
                  {props.target_info.name} 维基百科
                </h3>
                <p className="text-white text-sm">
                  这里可以显示来自维基百科或其他资料来源的关于目标的详细信息。
                </p>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>

        <motion.div
          className="flex justify-end mt-4 space-x-2"
          variants={containerVariants}
        >
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
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(TargetDetailCard);
