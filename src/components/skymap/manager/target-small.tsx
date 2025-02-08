"use client";

import * as React from "react";
import TargetDetailCard from "./target-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { DateTime } from "luxon";
import {
  XCircle,
  CheckCircle,
  FilePlus,
  Eye,
  Type,
  MoreHorizontal,
  Info,
  Heart,
} from "lucide-react";
import { useSkymapStore } from "@/stores/skymap/skymapStore";
import * as AXIOSOF from "@/services/api/skymap";
import Image from "next/image";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IDSOFramingObjectInfo, IDSOObjectDetailedInfo } from "@/types/skymap";
import { motion } from "framer-motion";
import { FC, useCallback, useEffect, useState } from "react";

interface ChartData {
  date: Date;
  value: number;
}

interface TargetSmallCardProps {
  target_info: IDSOObjectDetailedInfo | IDSOFramingObjectInfo;
  card_index: number;
  on_card_clicked: ((card_index: number, checked: boolean) => void) | null;
  on_choice_maken: (() => void) | null;
  in_manage?: boolean;
  is_favorite?: boolean;
  on_favorite_clicked?: (target_info: IDSOFramingObjectInfo) => void;
}

interface FigOptions {
  grid: {
    top: number;
    bottom: number;
    right: string;
    left: string;
  };
  tooltip: {
    trigger: string;
  };
  xAxis: {
    type: string;
    axisLabel: {
      formatter: string;
    };
  };
  yAxis: {
    type: string;
    min: number;
    max: number;
  };
  series: {
    data: ChartData[];
    type: string;
    smooth: number;
    markLine: {
      silent: boolean;
      data: (FigLineData & { xAxis: Date })[];
    };
    tooltip: {
      trigger: string;
    };
  }[];
}

interface FigLineData {
  name: string;
  xAxis: Date;
  label: {
    formatter: string;
    position: string;
  };
  lineStyle: { color: string };
}

const fig_options_template: FigOptions = {
  grid: {
    top: 10,
    bottom: 20,
    right: "1%",
    left: "10%",
  },
  tooltip: {
    trigger: "axis",
  },
  xAxis: {
    type: "time",
    axisLabel: {
      formatter: "{HH}",
    },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 90,
  },
  series: [
    {
      data: [],
      type: "line",
      smooth: 0.6,
      markLine: {
        silent: true,
        data: [],
      },
      tooltip: {
        trigger: "none",
      },
    },
  ],
};

const fig_line_data_template: FigLineData[] = [
  {
    name: "日落",
    xAxis: new Date(),
    label: {
      formatter: "{b}",
      position: "insideEnd",
    },
    lineStyle: { color: "grey" },
  },
  {
    name: "天文昏影",
    xAxis: new Date(),
    label: {
      formatter: "{b}",
      position: "insideEnd",
    },
    lineStyle: { color: "black" },
  },
  {
    name: "日出",
    xAxis: new Date(),
    label: {
      formatter: "{b}",
      position: "insideEnd",
    },
    lineStyle: { color: "grey" },
  },
  {
    name: "天文晨光",
    xAxis: new Date(),
    label: {
      formatter: "{b}",
      position: "insideEnd",
    },
    lineStyle: { color: "black" },
  },
];

function isDetailed(
  object: IDSOObjectDetailedInfo | IDSOFramingObjectInfo
): object is IDSOObjectDetailedInfo {
  return "altitude" in object;
}

const TargetSmallCard: FC<TargetSmallCardProps> = (props) => {
  // UI 控制
  const [show_detail, set_show_detail] = useState(false);
  const [this_checked, set_this_checked] = useState(false);
  const [added_flag, set_added_flag] = useState(false);
  const [target_icon_link, set_target_icon_link] = useState("");
  const [add_tooltip_open, set_add_tooltip_open] = useState(false);
  const [chartDimensions, setChartDimensions] = useState({
    width: 500,
    height: 300,
  });

  // 显示数据
  const [, set_echarts_options] = useState<FigOptions>(fig_options_template);
  const [real_target_info, set_real_target_info] =
    useState<IDSOObjectDetailedInfo>({
      id: "",
      name: "",
      ra: 0,
      dec: 0,
      target_type: "",
      size: 0,
      altitude: [],
      alias: "",
      const: "",
      transit_month: 0,
      transit_date: "",
      filter: "",
      focal_length: 0,
      Top200: null,
      rotation: 0,
      flag: "",
      tag: "",
      checked: false,
      angular_size: 0,
      magnitude: 0,
      type: "",
    });
  const [in_updating, set_in_updating] = useState(true);

  // 全局状态
  const [,/*targets*/] = useSkymapStore((state) => state.targets);
  const add_target_to_store = useSkymapStore((state) => state.addTarget);
  const save_all_targets = useSkymapStore((state) => state.saveAllTargets);
  const set_focus_target_to_store = useSkymapStore(
    (state) => state.setFocusTarget
  );
  const twilight_data = useSkymapStore((state) => state.twilight_data);

  // 初始化图表数据
  const initial_fig_data = useCallback(() => {
    const new_data: ChartData[] = real_target_info.altitude.map((item) => ({
      date: DateTime.fromFormat(item[0], "yyyy-MM-dd HH:mm:ss").toJSDate(),
      value: Number(item[2].toFixed(2)),
    }));
    const new_options: FigOptions = { ...fig_options_template };
    new_options.series[0].data = new_data;

    const new_mark_line = fig_line_data_template.map((line, index) => {
      let time: Date;
      switch (index) {
        case 0:
          time = new Date(twilight_data.evening.sun_set_time);
          break;
        case 1:
          time = new Date(twilight_data.evening.evening_astro_time);
          break;
        case 2:
          time = new Date(twilight_data.morning.sun_rise_time);
          break;
        case 3:
          time = new Date(twilight_data.morning.morning_astro_time);
          break;
        default:
          time = new Date();
      }
      return { ...line, xAxis: time };
    });
    new_options.series[0].markLine.data = new_mark_line;
    set_echarts_options(new_options);
    set_in_updating(false);
  }, [real_target_info.altitude, twilight_data]);

  // 构建框架信息到卡片信息
  const construct_framing_info2card_info = useCallback(async () => {
    try {
      const new_curve_data = await AXIOSOF.getTargetALtCurveOnly(
        props.target_info.ra,
        props.target_info.dec
      );
      if (new_curve_data.success) {
        set_real_target_info({
          ...new_curve_data.data,
          alias: "",
          const: "",
          transit_month: 0,
          transit_date: "",
          filter: "",
          focal_length: 0,
          Top200: null,
          rotation: 0,
          flag: "",
          tag: "",
          checked: false,
          angular_size: 0,
          magnitude: 0,
          type: "",
        });
        initial_fig_data();
      }
    } catch (err) {
      console.error("Error fetching target altitude curve:", err);
    }
  }, [props.target_info.ra, props.target_info.dec, initial_fig_data]);

  // 生命周期函数
  useEffect(() => {
    if (isDetailed(props.target_info)) {
      set_real_target_info(props.target_info);
    } else {
      construct_framing_info2card_info();
    }

    const iconPath =
      process.env.NODE_ENV === "development"
        ? `/api/file/DSO/${props.target_info.name}.jpg`
        : `/file/DSO/${props.target_info.name}.jpg`;
    set_target_icon_link(iconPath);
  }, [props.target_info, construct_framing_info2card_info]);

  useEffect(() => {
    initial_fig_data();
  }, [initial_fig_data]);

  useEffect(() => {
    if ("checked" in props.target_info) {
      set_this_checked(props.target_info.checked);
    }
  }, [props.target_info]);

  // 添加目标到框架
  const on_add_target_to_framing_clicked = () => {
    const to_add_object: IDSOFramingObjectInfo = {
      name: props.target_info.name,
      ra: props.target_info.ra,
      dec: props.target_info.dec,
      rotation: 0,
      flag: "",
      tag: "",
      target_type: props.target_info.target_type,
      size: props.target_info.size,
      checked: false,
    };
    set_focus_target_to_store(to_add_object.name);
    props.on_choice_maken?.();
  };

  // 添加目标到列表
  const on_add_target_to_list_clicked = () => {
    if (added_flag) {
      set_add_tooltip_open(true);
      setTimeout(() => set_add_tooltip_open(false), 3000);
    } else {
      const to_add_object: IDSOFramingObjectInfo = {
        name: props.target_info.name,
        ra: props.target_info.ra,
        dec: props.target_info.dec,
        rotation: 0,
        flag: "",
        tag: "",
        target_type: props.target_info.target_type,
        size: props.target_info.size,
        checked: false,
      };
      add_target_to_store(to_add_object);
      save_all_targets();
      set_focus_target_to_store(to_add_object.name);
      set_added_flag(true);
    }
  };

  // 翻译目标类型
  const TranslateTargetType = (type: string) => {
    // 实现实际的翻译逻辑
    return type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 10,
      }}
      className="mb-2 hover:shadow-xl transition-all duration-300 dark:bg-gray-800 rounded-lg relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <Card className="p-3 landscape:flex landscape:gap-3">
        <div className="landscape:w-[30%]">
          <CardContent className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-32 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={target_icon_link}
                  alt={props.target_info.name}
                  width={110}
                  height={110}
                  className="w-full h-full object-cover rounded"
                  priority
                />
              </motion.div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute bottom-2 left-2 text-white text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>视角: {real_target_info.size.toFixed(1)}′</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    <span>
                      类型: {TranslateTargetType(real_target_info.target_type)}
                    </span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-0 bottom-1/2 transform translate-y-1/2 z-10"
              >
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full p-2"
                  onClick={() => set_show_detail(!show_detail)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute left-0 bottom-1/2 transform translate-y-1/2 z-10"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-full p-2"
                        onClick={on_add_target_to_list_clicked}
                      >
                        {added_flag ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <FilePlus className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {add_tooltip_open && (
                        <span className="flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          已添加到待拍摄列表，如需要删除目标，请到目标管理界面删除
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-0 top-0 z-10"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`bg-transparent p-2 ${props.is_favorite ? 'text-red-500' : ''}`}
                  onClick={() => {
                    const framingInfo: IDSOFramingObjectInfo = {
                      name: props.target_info.name,
                      ra: props.target_info.ra,
                      dec: props.target_info.dec,
                      rotation: props.target_info.rotation,
                      flag: props.target_info.flag,
                      tag: props.target_info.tag,
                      target_type: props.target_info.target_type,
                      size: props.target_info.size,
                      checked: 'checked' in props.target_info ? props.target_info.checked : false
                    };
                    props.on_favorite_clicked?.(framingInfo);
                  }}
                >
                  <Heart className="w-4 h-4" fill={props.is_favorite ? "currentColor" : "none"} />
                </Button>
              </motion.div>
              {props.on_card_clicked && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute left-0 top-0 z-10"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-transparent p-2"
                    onClick={() => {
                      set_this_checked(!this_checked);
                      props.on_card_clicked?.(props.card_index, !this_checked);
                    }}
                  >
                    {this_checked ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
            <div
              className="flex-grow pl-0 md:pl-3 cursor-pointer mt-4 md:mt-0"
              onClick={on_add_target_to_framing_clicked}
            >
              <CardTitle className="text-lg font-semibold text-green-600 dark:text-green-400">
                {real_target_info.name}
              </CardTitle>
              <div className="text-sm dark:text-gray-300">
                Ra: {real_target_info.ra.toFixed(5)} °
              </div>
              <div className="text-sm dark:text-gray-300">
                Dec: {real_target_info.dec.toFixed(5)} °
              </div>
            </div>
          </CardContent>
        </div>
        <div id="chart-container" className="landscape:w-[70%]">
          <div className="relative h-28 mt-2">
            {in_updating ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 backdrop-blur-sm rounded"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                >
                  <LoadingSpinner className="w-8 h-8" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 150,
                }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <LineChart
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                  data={real_target_info.altitude.map(([time, , alt]) => ({
                    time: DateTime.fromFormat(
                      time,
                      "yyyy-MM-dd HH:mm:ss"
                    ).toJSDate(),
                    altitude: Number(alt.toFixed(2)),
                  }))}
                  margin={{ top: 10, right: 5, left: 10, bottom: 20 }}
                  className="transition-all duration-300 hover:opacity-90"
                  onMouseEnter={() =>
                    setChartDimensions((prev) => ({ ...prev, height: 320 }))
                  }
                  onMouseLeave={() =>
                    setChartDimensions((prev) => ({ ...prev, height: 280 }))
                  }
                >
                  <XAxis
                    dataKey="time"
                    tickFormatter={(time) =>
                      DateTime.fromJSDate(time).toFormat("HH")
                    }
                    stroke="#fff"
                  />
                  <YAxis domain={[0, 90]} stroke="#fff" />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="altitude"
                    stroke="#8884d8"
                    dot={false}
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  <defs>
                    <linearGradient
                      id="altitudeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="altitude"
                    stroke="#8884d8"
                    fill="url(#altitudeGradient)"
                    strokeWidth={2}
                    animationDuration={1000}
                  />
                  {fig_line_data_template.map((line, index) => (
                    <ReferenceLine
                      key={index}
                      x={line.xAxis.getTime()}
                      stroke={line.lineStyle.color}
                      label={line.name}
                    />
                  ))}
                </LineChart>
              </motion.div>
            )}
          </div>
        </div>
        <TargetDetailCard
          open_dialog={show_detail ? 1 : 0}
          target_info={real_target_info}
          in_updating={in_updating}
          on_choice_maken={props.on_choice_maken}
          in_manage={props.in_manage}
        />
      </Card>
    </motion.div>
  );
};

export default TargetSmallCard;
